import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig = {
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
    async signIn({ user }) {
      // データベースの論理削除フラグをチェック
      // (アダプター経由でDBのUserオブジェクトが渡されるためチェック可能)
      if (user.deletedAt) {
        return false; // ログインを拒否し、新規サインアップフローへ
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.deletedAt = user.deletedAt; // トークンに含める
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.deletedAt = token.deletedAt as Date | null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
