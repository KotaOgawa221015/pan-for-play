import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import {
  addSessionClaimsToToken,
  authorizeRouteAccess,
  exposeSessionClaims,
} from '@/features/account/auth';
import { getAuthEnv } from '@/lib/environment';

const authEnv = getAuthEnv();

export default NextAuth({
  secret: authEnv.authSecret,
  trustHost: true,
  providers: [
    Google({
      clientId: authEnv.authGoogleId,
      clientSecret: authEnv.authGoogleSecret,
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
