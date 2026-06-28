import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const prodBase = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://u:p@h:5432/db',
    JWT_SECRET: 'a-sufficiently-long-secret-value',
    JWT_REFRESH_SECRET: 'another-long-refresh-secret',
    REDIS_URL: 'redis://localhost:6379',
    CORS_ORIGINS: 'https://unkora.com',
  };

  it('passes through non-production configs unchanged', () => {
    const dev = { NODE_ENV: 'development' };
    expect(validateEnv(dev)).toBe(dev);
  });

  it('accepts a complete production config', () => {
    expect(() => validateEnv({ ...prodBase })).not.toThrow();
  });

  it('throws when a required production var is missing', () => {
    const { DATABASE_URL, ...rest } = prodBase;
    void DATABASE_URL;
    expect(() => validateEnv(rest)).toThrow(/DATABASE_URL/);
  });

  it('throws when a required production var is blank', () => {
    expect(() => validateEnv({ ...prodBase, CORS_ORIGINS: '   ' })).toThrow(/CORS_ORIGINS/);
  });

  it('rejects a weak / placeholder JWT secret in production', () => {
    expect(() => validateEnv({ ...prodBase, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
    expect(() => validateEnv({ ...prodBase, JWT_SECRET: 'dev-secret-please-change' })).toThrow(/JWT_SECRET/);
  });
});
