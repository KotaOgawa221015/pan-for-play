import { describe, expect, it } from 'vitest';
import type { NextRequest } from 'next/server';
import { authorizeRouteAccess } from './route-access';

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

describe('authorizeRouteAccess', () => {
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
});
