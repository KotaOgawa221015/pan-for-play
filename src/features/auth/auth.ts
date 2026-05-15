import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';

export const { auth, signIn, signOut, handlers } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret:
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV === 'development'
      ? 'development-only-secret'
      : undefined),
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      id: 'dev-admin',
      name: 'Development Admin',
      credentials: {},
      async authorize() {
        if (process.env.NODE_ENV !== 'development') return null;

        const admin = await prisma.user.findFirst({
          where: { email: 'admin@example.com', role: 'ADMIN' },
        });
        return admin ?? null;
      },
    }),
    Credentials({
      id: 'dev-user',
      name: 'Development User',
      credentials: {},
      async authorize() {
        if (process.env.NODE_ENV !== 'development') return null;

        const user = await prisma.user.findFirst({
          where: { email: 'user@example.com', role: 'MEMBER' },
        });
        return user ?? null;
      },
    }),
  ],
});
