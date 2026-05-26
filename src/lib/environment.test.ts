import { describe, expect, it, vi } from 'vitest';
import { getAuthEnv, getTursoRecreateEnv } from './environment';

describe('environment', () => {
  it('disables Google sign-in in development when Google credentials are absent', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const authEnv = getAuthEnv({
      NODE_ENV: 'development',
      AUTH_SECRET: '',
      AUTH_GOOGLE_ID: '',
      AUTH_GOOGLE_SECRET: '',
    });

    expect(authEnv.authSecret).toBe('development-only-secret');
    expect(authEnv.googleProvider).toEqual({ isEnabled: false });
    expect(warn).toHaveBeenCalledWith(
      'AUTH_SECRET is not set. Using development-only-secret.',
    );
    expect(warn).toHaveBeenCalledWith(
      'AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are not set. Google sign-in is disabled.',
    );
  });

  it('requires both Google credentials together', () => {
    expect(() =>
      getAuthEnv({
        NODE_ENV: 'development',
        AUTH_SECRET: 'test-secret',
        AUTH_GOOGLE_ID: 'test-google-id',
        AUTH_GOOGLE_SECRET: '',
      }),
    ).toThrow('AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be set together.');
  });

  it('requires Google credentials outside development', () => {
    expect(() =>
      getAuthEnv({
        NODE_ENV: 'production',
        AUTH_SECRET: 'test-secret',
        AUTH_GOOGLE_ID: '',
        AUTH_GOOGLE_SECRET: '',
      }),
    ).toThrow('AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are required.');
  });

  it('accepts an empty optional Turso database group', () => {
    const env = getTursoRecreateEnv({
      DATABASE_URL: 'file:./data/dev.db',
      TURSO_DATABASE_NAME: 'pan-for-play-db',
      TURSO_AUTH_TOKEN_EXPIRATION: 'never',
      TURSO_DATABASE_GROUP: '',
    });

    expect(env.tursoDatabaseGroup).toBeUndefined();
  });
});
