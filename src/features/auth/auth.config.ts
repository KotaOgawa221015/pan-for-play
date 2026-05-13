import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
    ],
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async signIn({ user }) {
            // データベースの論理削除フラグをチェック
            // (アダプター経由でDBのUserオブジェクトが渡されるためチェック可能)
            if ((user as any).deletedAt) {
                return false; // ログインを拒否し、新規サインアップフローへ
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.deletedAt = (user as any).deletedAt; // トークンに含める
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as any).role = token.role;
                (session.user as any).deletedAt = token.deletedAt;
            }
            return session;
        },
    },
} satisfies NextAuthConfig;