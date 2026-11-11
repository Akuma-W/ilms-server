import { registerAs } from '@nestjs/config';
import { StringValue } from 'ms';

export default registerAs('', () => ({
  // Apps
  appName: process.env.APP_NAME || 'InteractiveLMS',
  appVersion: process.env.APP_VERSION || '1',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  // Domain & Traefik
  domain: {
    app: process.env.APP_DOMAIN || 'localhost',
    minio: process.env.MINIO_DOMAIN || 'files.localhost',
    acmeEmail: process.env.ACME_EMAIL,
    desecToken: process.env.DESEC_TOKEN,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  // Database
  database: {
    url: process.env.DATABASE_URL,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB || 'ilms_db',
    port: Number(process.env.POSTGRES_PORT) || 5432,
  },
  // Auth & JWT
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
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    ttl: Number(process.env.REDIS_TTL || 86400),
  },
  // Logger
  logger: {
    lokiHost: process.env.LOKI_HOST,
    transport: process.env.LOG_TRANSPORT,
  },
  // MinIO
  minio: {
    endPoint: process.env.MINIO_INTERNAL_ENDPOINT || 'localhost',
    port: Number(process.env.MINIO_PORT) || 9000,
    consolePort: Number(process.env.MINIO_CONSOLE_PORT) || 9001,
    accessKey: process.env.MINIO_USERNAME,
    secretKey: process.env.MINIO_PASSWORD,
    bucket: process.env.MINIO_BUCKET || 'ilms-bucket',
    publicEndPoint: process.env.MINIO_PUBLIC_ENDPOINT,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    urlExpiresIn: Number(process.env.MINIO_URL_EXPIRES_IN) || 7200,
  },
  // Storage driver & Google OAuth
  storage: {
    driver: process.env.STORAGE_DRIVER || 'minio',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  // Infrastructure Notification (Email SMTP & Twilio SMS)
  infra: {
    email: {
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
      from: process.env.EMAIL_FROM || 'noreply@ilms.local',
    },
    twilio: {
      account_sid: process.env.TWILIO_ACCOUNT_SID,
      auth_token: process.env.TWILIO_AUTH_TOKEN,
      from: process.env.TWILIO_FROM_PHONE,
    },
  },
}));
