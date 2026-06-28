/**
 * Fail-fast environment validation. Wired into ConfigModule.forRoot({ validate }).
 * In production, a missing critical variable throws at boot rather than letting
 * the app silently run on localhost/dev defaults. Dependency-free on purpose.
 */
const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'REDIS_URL',
  'CORS_ORIGINS',
] as const;

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const isProd = config['NODE_ENV'] === 'production';
  if (!isProd) return config;

  const missing = REQUIRED_IN_PRODUCTION.filter(
    (key) => !config[key] || String(config[key]).trim() === '',
  );

  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required production environment variable(s): ${missing.join(', ')}. ` +
        `Set them before starting the API in production.`,
    );
  }

  // Guard against obvious dev placeholders leaking into production.
  const secret = String(config['JWT_SECRET'] ?? '');
  if (secret.length < 16 || secret.includes('dev-secret')) {
    throw new Error('[env] JWT_SECRET is too weak or a dev placeholder in production.');
  }

  return config;
}
