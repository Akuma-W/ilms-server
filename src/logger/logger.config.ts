import { ConfigService } from '@nestjs/config';
import winston from 'winston';
import LokiTransport from 'winston-loki';

export const createLogger = (config: ConfigService) => {
  const transports: winston.transport[] = [];
  const transportType = config.get<string>('logger.transport');

  // FILE TRANSPORT
  const fileTransport = new winston.transports.File({
    filename: 'logs/app.log',
    level: 'info',
    format: winston.format.json(),
  });

  // LOKI TRANSPORT
  const lokiTransport = new LokiTransport({
    host: config.get<string>('logger.lokiHost') || 'http://loki:3000',
    labels: {
      app: config.get<string>('appName'),
      env: config.get<string>('nodeEnv'),
    },
    json: true,
    batching: true,
    interval: 5,
  });

  if (transportType === 'file' || transportType === 'both') {
    transports.push(fileTransport);
  }

  if (transportType === 'loki' || transportType === 'both') {
    transports.push(lokiTransport);
  }

  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    transports,
  });
};
