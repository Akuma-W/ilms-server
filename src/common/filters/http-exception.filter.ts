import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger('HTTP_ERROR');
  constructor() {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status = exception.getStatus();

    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status_code: status,
      error: exception.message,
      request_body: JSON.stringify(req.body),
      ip: req.ip,
      user_agent: req.headers['user-agent'],
      stack: exception.stack,
    };

    this.logger.error(JSON.stringify(log));

    res.status(status).json({
      statusCode: status,
      timestamp: log.timestamp,
      path: req.originalUrl,
      message: exception.message,
    });
  }
}
