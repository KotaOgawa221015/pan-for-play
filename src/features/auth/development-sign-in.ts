import type { User } from '@prisma/client';
import Credentials from 'next-auth/providers/credentials';
import type { Provider } from 'next-auth/providers';

type DevelopmentSignInDependencies = {
  findDevelopmentAdmin: () => Promise<User | null>;
  findDevelopmentUser: () => Promise<User | null>;
};

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
