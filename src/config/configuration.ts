import { registerAs } from '@nestjs/config';
import { StringValue } from 'ms';

export default registerAs('', () => ({
  appName: process.env.APP_NAME,
  appVersion: process.env.APP_VERSION,
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT) || 3000,
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  auth: {
    saltRounds: Number(process.env.SALT_ROUNDS || 10),
    jwt: {
      accessTokenSecret: process.env.JWT_ACCESS_SECRET,
      refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
      tempTokenSecret: process.env.JWT_TEMP_SECRET,
      accessExpriesIn: process.env.JWT_ACCESS_EXPIRES_IN as StringValue,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN as StringValue,
      tempExpriesIn: process.env.JWT_TEMP_EXPIRES_IN as StringValue,
    },
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    ttl: Number(process.env.REDIS_TTL || 3600),
  },
  logger: {
    lokiHost: process.env.LOKI_HOST,
    transport: process.env.LOG_TRANSPORT,
  },
  minio: {
    endPoint: process.env.MINIO_INTERNAL_ENDPOINT,
    port: Number(process.env.MINIO_PORT) || 9000,
    accessKey: process.env.MINIO_USERNAME,
    secretKey: process.env.MINIO_PASSWORD,
    bucket: process.env.MINIO_BUCKET,
    publicEndPoint: process.env.MINIO_PUBLIC_ENDPOINT,
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },
  storage: {
    driver: process.env.STORAGE_DRIVER,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
}));
