import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { createDevelopmentSignInProviders } from './development-sign-in';
import { authorizeRouteAccess } from './route-access';
import {
  addSessionClaimsToToken,
  allowActiveUserSignIn,
  exposeSessionClaims,
} from './session-claims';

export const { auth, signIn, signOut, handlers } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
    ...createDevelopmentSignInProviders(process.env.NODE_ENV, {
      findDevelopmentAdmin: () =>
        prisma.user.findFirst({
          where: { email: 'admin@example.com', role: 'ADMIN' },
        }),
      findDevelopmentUser: () =>
        prisma.user.findFirst({
          where: { email: 'user@example.com', role: 'MEMBER' },
        }),
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: authorizeRouteAccess,
    signIn: allowActiveUserSignIn,
    jwt: addSessionClaimsToToken,
    session: exposeSessionClaims,
  },
});
