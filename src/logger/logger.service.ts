import { Injectable } from '@nestjs/common';
import { createLogger } from './logger.config';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';

@Injectable()
export class LoggerService {
  private logger: Logger;

  constructor(private config: ConfigService) {
    this.logger = createLogger(this.config);
  }

  log(message: string, meta?: Record<string, unknown>) {
    this.logger.info({
      message,
      ...meta,
    });
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.logger.error({
      message,
      ...meta,
    });
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn({
      message,
      ...meta,
    });
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug({
      message,
      ...meta,
    });
  }
}
