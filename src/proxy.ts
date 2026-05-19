import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import {
  addSessionClaimsToToken,
  authorizeRouteAccess,
  exposeSessionClaims,
} from '@/features/account/auth';

export default NextAuth({
  secret:
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV === 'development'
      ? 'development-only-secret'
      : undefined),
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
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
