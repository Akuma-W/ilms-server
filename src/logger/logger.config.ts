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
  const fileTransport = new winston.transports.File({
    filename: 'logs/app.log',
    level: 'info',
    format: winston.format.json(),
  });

  // LOKI TRANSPORT
  const lokiTransport = new LokiTransport({
    host: config.get<string>('logger.lokiHost') || 'http://gateway:3100',
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

  if (transportType === 'file' || transportType === 'both') {
    transports.push(fileTransport);
  }

  if (transportType === 'loki' || transportType === 'both') {
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
