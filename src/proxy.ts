import NextAuth from 'next-auth';
import {
  addSessionClaimsToToken,
  authorizeRouteAccess,
  createGoogleSignInProviders,
  exposeSessionClaims,
} from '@/features/account/auth';
import { getAuthEnv } from '@/lib/environment';

const authEnv = getAuthEnv();

export default NextAuth({
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
}).auth;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
