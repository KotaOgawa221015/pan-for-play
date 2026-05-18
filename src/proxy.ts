import NextAuth from 'next-auth';
import { authorizeRouteAccess } from '@/features/auth/route-access';
import {
  addSessionClaimsToToken,
  exposeSessionClaims,
} from '@/features/auth/session-claims';

export default NextAuth({
  secret:
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV === 'development'
      ? 'development-only-secret'
      : undefined),
  trustHost: true,
  providers: [],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: authorizeRouteAccess,
    jwt: addSessionClaimsToToken,
    session: exposeSessionClaims,
  },
}).auth;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
