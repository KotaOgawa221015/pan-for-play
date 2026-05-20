import { PrismaAdapter } from '@auth/prisma-adapter';
import type { User } from '@prisma/client';
import type { NextRequest } from 'next/server';
import type { NextAuthConfig, Session } from 'next-auth';
import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { getAuthEnv } from '@/lib/environment';
import { prisma } from '@/lib/prisma';

type AuthCallbacks = NonNullable<NextAuthConfig['callbacks']>;

type DevelopmentSignInDependencies = {
  findDevelopmentAdmin: () => Promise<User | null>;
  findDevelopmentUser: () => Promise<User | null>;
};

type AuthEnvironment = ReturnType<typeof getAuthEnv>;

export function createGoogleSignInProviders(
  authEnv: AuthEnvironment,
): Provider[] {
  if (!authEnv.googleProvider.isEnabled) {
    return [];
  }

  return [
    Google({
      clientId: authEnv.googleProvider.clientId,
      clientSecret: authEnv.googleProvider.clientSecret,
    }),
  ];
}

export function createDevelopmentSignInProviders(
  nodeEnv: string | undefined,
  deps?: DevelopmentSignInDependencies,
): Provider[] {
  if (nodeEnv !== 'development') {
    return [];
  }

  if (!deps) {
    throw new Error(
      'Development sign-in dependencies are required in development mode.',
    );
  }

  return [
    Credentials({
      id: 'dev-admin',
      name: 'Development Admin',
      credentials: {},
      authorize: deps.findDevelopmentAdmin,
    }),
    Credentials({
      id: 'dev-user',
      name: 'Development User',
      credentials: {},
      authorize: deps.findDevelopmentUser,
    }),
  ];
}

export function authorizeRouteAccess({
  auth,
  request,
}: {
  auth: Session | null;
  request: NextRequest;
}) {
  const isServerActionRequest =
    request.method === 'POST' && request.headers.get('next-action') !== null;
  if (isServerActionRequest) {
    return true;
  }

  const { nextUrl } = request;
  const user = auth?.user;
  const isOnLoginPage = nextUrl.pathname === '/login';
  const isLoggedIn = !!user;
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
}

export const allowActiveUserSignIn: NonNullable<
  AuthCallbacks['signIn']
> = async ({ user }) => !user.deletedAt;

export const addSessionClaimsToToken: NonNullable<
  AuthCallbacks['jwt']
> = async ({ token, user, trigger, session }) => {
  if (user) {
    token.id = user.id as string;
    token.role = user.role;
    token.deletedAt = user.deletedAt;
  }

  if (trigger === 'update' && session?.name) {
    token.name = session.name;
  }

  return token;
};

export const exposeSessionClaims: NonNullable<
  AuthCallbacks['session']
> = async ({ session, token }) => {
  if (session.user) {
    session.user.id = token.id as string;
    session.user.role = token.role as string;
    session.user.deletedAt = (token.deletedAt as Date | null) ?? null;
  }

  return session;
};

export function createAccountAuthConfig(): NextAuthConfig {
  const authEnv = getAuthEnv();

  return {
    adapter: PrismaAdapter(prisma),
    secret: authEnv.authSecret,
    trustHost: true,
    providers: [
      ...createGoogleSignInProviders(authEnv),
      ...createDevelopmentSignInProviders(authEnv.nodeEnv, {
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
  };
}

export const { auth, signIn, signOut, handlers } = NextAuth(() =>
  createAccountAuthConfig(),
);
