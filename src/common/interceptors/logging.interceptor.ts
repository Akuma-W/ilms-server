import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const { method, originalUrl, headers, ip } = request;
    const body = request.body as Record<string, unknown>;

    const start = process.hrtime();

    return next.handle().pipe(
      tap((res) => {
        const diff = process.hrtime(start);
        const duration = diff[0] * 1000 + diff[1] / 1e6;

        const log = {
          timestamp: new Date().toISOString(),
          method,
          path: originalUrl,
          status_code: response.statusCode,
          duration_ms: duration,
          request_body: JSON.stringify(body),
          response_body: JSON.stringify(res),
          ip,
          user_agent: headers['user-agent'],
          headers: {
            Accept: headers['accept'],
            'Content-Type': headers['content-type'],
          },
        };

        this.logger.log(log);
      }),
    );
  }
}
