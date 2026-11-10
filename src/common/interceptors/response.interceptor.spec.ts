import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

interface StandardResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  const createMockContext = () => ({}) as unknown as ExecutionContext;

  it('should preserve an array returned directly by controller', async () => {
    const rawArray = [
      { id: '1', title: 'Post 1' },
      { id: '2', title: 'Post 2' },
    ];
    const next: CallHandler = { handle: () => of(rawArray) };

    const result = (await lastValueFrom(
      interceptor.intercept(createMockContext(), next),
    )) as StandardResponse<typeof rawArray>;

    expect(result).toEqual({
      success: true,
      message: 'Success',
      data: rawArray,
    });
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should preserve an empty array returned directly by controller', async () => {
    const next: CallHandler = { handle: () => of([]) };

    const result = (await lastValueFrom(
      interceptor.intercept(createMockContext(), next),
    )) as StandardResponse<unknown[]>;

    expect(result).toEqual({
      success: true,
      message: 'Success',
      data: [],
    });
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should wrap domain entity object into standardized envelope', async () => {
    const entity = { id: 'forum-1', title: 'Discussion' };
    const next: CallHandler = { handle: () => of(entity) };

    const result = (await lastValueFrom(
      interceptor.intercept(createMockContext(), next),
    )) as StandardResponse<typeof entity>;

    expect(result).toEqual({
      success: true,
      message: 'Success',
      data: entity,
    });
  });

  it('should preserve custom message and data from envelope object', async () => {
    const responsePayload = {
      message: 'Custom message',
      data: ['item-1', 'item-2'],
    };
    const next: CallHandler = { handle: () => of(responsePayload) };

    const result = (await lastValueFrom(
      interceptor.intercept(createMockContext(), next),
    )) as StandardResponse<string[]>;

    expect(result).toEqual({
      success: true,
      message: 'Custom message',
      data: ['item-1', 'item-2'],
    });
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should return null data when response only has message', async () => {
    const responsePayload = {
      message: 'Item deleted successfully',
    };
    const next: CallHandler = { handle: () => of(responsePayload) };

    const result = (await lastValueFrom(
      interceptor.intercept(createMockContext(), next),
    )) as StandardResponse<null>;

    expect(result).toEqual({
      success: true,
      message: 'Item deleted successfully',
      data: null,
    });
  });
});
