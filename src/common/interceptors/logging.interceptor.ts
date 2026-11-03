import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class LoggingInterceptor<T> implements NestInterceptor<T, T> {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    // Step 1: Capture request metadata and initialize high-resolution timer
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const { method, originalUrl, headers, ip } = request;
    const body = request.body as Record<string, unknown>;

    const start = process.hrtime();

    // Step 2: Handle downstream request pipeline and calculate execution duration
    return next.handle().pipe(
      tap((res: T) => {
        const diff = process.hrtime(start);
        const duration = diff[0] * 1000 + diff[1] / 1e6;

        // Step 3: Format log payload and record API request audit
        const log = {
          timestamp: new Date().toISOString(),
          method,
          path: originalUrl,
          status_code: response.statusCode,
          duration_ms: duration,
          request_body: body,
          response_body: res,
          ip,
          user_agent: headers['user-agent'],
          headers: {
            Accept: headers['accept'],
            'Content-Type': headers['content-type'],
          },
        };

        this.logger.log('API Request', log);
      }),
    );
  }
}
