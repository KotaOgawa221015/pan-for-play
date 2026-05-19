import type { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn(() => ({})),
}));

vi.mock('next-auth/providers/google', () => ({
  default: vi.fn(() => ({ type: 'oauth' })),
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn((config: { id: string }) => ({
    type: 'credentials',
    id: config.id,
  })),
}));

vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    handlers: {},
  })),
}));

vi.mock('@/lib/environment', () => ({
  getAuthEnv: () => ({
    authSecret: 'test-secret',
    authGoogleId: 'test-google-id',
    authGoogleSecret: 'test-google-secret',
    nodeEnv: 'test',
  }),
}));

import { authorizeRouteAccess, createDevelopmentSignInProviders } from './auth';

function createRequest(
  pathname: string,
  init?: { method?: string; nextAction?: string },
) {
  const headers = new Headers();
  if (init?.nextAction) {
    headers.set('next-action', init.nextAction);
  }

  return {
    method: init?.method ?? 'GET',
    headers,
    nextUrl: new URL(`https://example.com${pathname}`),
  } as unknown as NextRequest;
}

describe('account auth', () => {
  it('redirects unauthenticated navigation requests to login', () => {
    const result = authorizeRouteAccess({
      auth: null,
      request: createRequest('/'),
    });

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('location')).toBe(
      'https://example.com/login',
    );
  });

  it('allows server action requests to continue to action-level authorization', () => {
    const result = authorizeRouteAccess({
      auth: null,
      request: createRequest('/', {
        method: 'POST',
        nextAction: 'action-id',
      }),
    });

    expect(result).toBe(true);
  });

  it('returns no credentials providers outside development', () => {
    const providers = createDevelopmentSignInProviders('production');

    expect(providers).toEqual([]);
  });

  it('returns development credentials providers in development', () => {
    const providers = createDevelopmentSignInProviders('development', {
      findDevelopmentAdmin: vi.fn(async () => null),
      findDevelopmentUser: vi.fn(async () => null),
    }) as Array<{ type?: string }>;
    const credentialsProviders = providers.filter(
      (provider) => provider.type === 'credentials',
    );

    expect(credentialsProviders).toHaveLength(2);
  });
});
