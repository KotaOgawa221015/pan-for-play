import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';
import {
  addSessionClaimsToToken,
  authorizeRouteAccess,
  createGoogleSignInProviders,
  exposeSessionClaims,
} from '@/features/account/auth';
import { getAuthEnv } from '@/lib/environment';

function createProxyAuthConfig(): NextAuthConfig {
  const authEnv = getAuthEnv();

  return {
    secret: authEnv.authSecret,
    trustHost: true,
    providers: createGoogleSignInProviders(authEnv),
    session: { strategy: 'jwt' },
    pages: {
      signIn: '/login',
    },
    callbacks: {
      authorized: authorizeRouteAccess,
      jwt: addSessionClaimsToToken,
      session: exposeSessionClaims,
    },
  };
}

export default NextAuth(() => createProxyAuthConfig()).auth;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
