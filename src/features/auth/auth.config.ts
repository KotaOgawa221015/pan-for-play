import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig = {
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
    authorized({ auth, request }) {
      const isServerActionRequest =
        request.method === 'POST' &&
        request.headers.get('next-action') !== null;
      if (isServerActionRequest) {
        return true;
      }

      const { nextUrl } = request;
      const user = auth?.user;
      const isOnLoginPage = nextUrl.pathname === '/login';
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;
      const isPublicPage = pathname === '/login';
      const isOnSessionClearPage = nextUrl.pathname === '/session/clear';
      const isOnAdminRoute =
        nextUrl.pathname === '/admin' || nextUrl.pathname.startsWith('/admin/');

      if (user?.deletedAt) {
        if (isOnSessionClearPage) return true;
        return Response.redirect(new URL('/session/clear', nextUrl));
      }

      if (isLoggedIn && isPublicPage) {
        return Response.redirect(new URL('/', nextUrl));
      }

      if (isOnLoginPage) {
        if (user) return Response.redirect(new URL('/', nextUrl));
        return true;
      }

      if (!user) {
        return Response.redirect(new URL('/login', nextUrl));
      }

      if (isOnAdminRoute && user.role !== 'ADMIN') {
        return Response.redirect(new URL('/', nextUrl));
      }

      return true;
    },
    async signIn({ user }) {
      if (user.deletedAt) {
        return false;
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.deletedAt = user.deletedAt;
      }

      if (trigger === 'update' && session?.name) {
        token.name = session.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.deletedAt = (token.deletedAt as Date | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
