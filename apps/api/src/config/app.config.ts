import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env['API_PORT'] ?? '4000', 10),
  apiPrefix: process.env['API_PREFIX'] ?? 'api',
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  corsOrigins: process.env['CORS_ORIGINS'] ?? 'http://localhost:3000',
}));
