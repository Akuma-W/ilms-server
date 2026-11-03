import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { LoggerService } from 'src/logger/logger.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    // Step 1: Switch to HTTP context and get request/response objects
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // Step 2: Extract HTTP status code
    const status = exception.getStatus();

    // Step 3: Build structured error log and write to logger
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

    // Step 4: Return unified error response
    res.status(status).json({
      success: false,
      statusCode: status,
      timestamp: log.timestamp,
      path: req.originalUrl,
      message: exception.message,
    });
  }
}
