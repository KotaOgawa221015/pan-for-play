import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials'; // ここに移動

export const { auth, signIn, signOut, handlers } = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
  providers: [
    ...authConfig.providers, // Googleプロバイダーなどを継承
    // 検証用のプロバイダーをここに追加（Node.js環境でのみ実行される）
    Credentials({
      id: 'dev-admin',
      name: 'Development Admin',
      credentials: {},
      async authorize() {
        if (process.env.NODE_ENV !== 'development') return null;

        // 管理者ユーザーをDBから取得
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

        // シードスクリプトで作成される一般ユーザーをDBから取得
        const user = await prisma.user.findFirst({
          where: { email: 'user@example.com', role: 'MEMBER' },
        });

        return user ?? null;
      },
    }),
  ],
});
