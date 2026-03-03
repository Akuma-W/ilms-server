export default () => ({
  port: Number(process.env.PORT) || 3000,
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
  database: {
    url: process.env.DATABASE_URL,
  }
});
