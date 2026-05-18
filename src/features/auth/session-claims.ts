import type { NextAuthConfig } from 'next-auth';

type AuthCallbacks = NonNullable<NextAuthConfig['callbacks']>;

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
