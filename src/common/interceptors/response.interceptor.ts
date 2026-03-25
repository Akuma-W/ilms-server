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
        // Check if res is object and not null
        const isObject = typeof res === 'object' && res !== null;

        // Extract message and data securely
        let message = 'Success';
        let data = res;

        if (isObject) {
          const payload = res as ControllerResponse;
          if (payload.message) message = payload.message;

          // If object response have field 'data', choose this field
          // Else make data by all object (but remove field message)
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
