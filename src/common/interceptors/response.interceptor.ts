import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => ({
        success: true,
        message:
          typeof data === 'object' && data !== null && 'message' in data
            ? (data as { message: string }).message
            : 'Success',
        data:
          typeof data === 'object' && data !== null && 'data' in data
            ? (data as { data: unknown }).data
            : data,
      })),
    );
  }
}
