import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const isProd = process.env['NODE_ENV'] === 'production';
  const secret = process.env['JWT_SECRET'];
  const refreshSecret = process.env['JWT_REFRESH_SECRET'];

  if (isProd && !secret) throw new Error('JWT_SECRET env var is required in production');
  if (isProd && !refreshSecret) throw new Error('JWT_REFRESH_SECRET env var is required in production');

  return {
    secret: secret ?? 'dev-secret-change-in-production',
    expiresIn: process.env['JWT_EXPIRES_IN'] ?? '15m',
    refreshSecret: refreshSecret ?? 'dev-refresh-secret-change-in-production',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',
  };
});
