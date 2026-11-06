import { ConfigService } from '@nestjs/config';
import winston from 'winston';
import LokiTransport from 'winston-loki';

export const createLogger = (config: ConfigService) => {
  const transports: winston.transport[] = [];
  const transportType = config.get<string>('logger.transport');

  // CONSOLE TRANSPORT
  const consoleTransport = new winston.transports.Console({
    format: winston.format.json(),
  });

  // FILE TRANSPORT
  if (transportType === 'file' || transportType === 'both') {
    const fileTransport = new winston.transports.File({
      filename: 'logs/app.log',
      level: 'info',
      format: winston.format.json(),
    });
    transports.push(fileTransport);
  }

  // LOKI TRANSPORT
  if (transportType === 'loki' || transportType === 'both') {
    const lokiTransport = new LokiTransport({
      host: config.get<string>('logger.lokiHost') || 'http://loki:3100',
      headers: {
        'X-Scope-OrgID': 'tenant1',
      },
      labels: {
        app: config.get<string>('appName'),
        env: config.get<string>('nodeEnv'),
      },
      json: false,
      batching: true,
      interval: 5,
      onConnectionError: (err) => console.error('Loki transport error: ', err),
    });
    transports.push(lokiTransport);
  }

  transports.push(consoleTransport);

  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    transports,
  });

  return logger;
};
