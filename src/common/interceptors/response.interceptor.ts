import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ControllerResponse {
  message?: string;
  data?: unknown;
  [key: string]: unknown;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((res: unknown) => {
        // Step 1: If res is directly an Array, preserve it directly as array data
        if (Array.isArray(res)) {
          return {
            success: true,
            message: 'Success',
            data: res,
          };
        }

        // Step 2: Check if res is non-null object
        const isObject = typeof res === 'object' && res !== null;

        // Step 3: Extract message and data securely
        let message = 'Success';
        let data = res;

        if (isObject) {
          const payload = res as ControllerResponse;
          if (payload.message) message = payload.message;

          // If object response has field 'data', choose this field (preserves array/object inside data)
          if (payload.data !== undefined) {
            data = payload.data;
          } else {
            const cleanData = { ...payload };
            delete cleanData.message;
            data = Object.keys(cleanData).length > 0 ? cleanData : null;
          }
        }

        return {
          success: true,
          message,
          data: data ?? null,
        };
      }),
    );
  }
}
