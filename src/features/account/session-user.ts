import type { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';
import { auth } from './auth';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type SessionStatus =
  | { status: 'anonymous' }
  | { status: 'invalid' }
  | { status: 'authenticated'; user: AuthenticatedUser };

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
    role: session.user.role,
  };
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireAdminUser() {
  const user = await requireCurrentUser();

  if (user.role !== 'ADMIN') {
    throw new Error('管理者権限が必要です。');
  }

  return user;
}

export function authenticatedAction<Args extends unknown[], R>(
  action: (user: AuthenticatedUser, ...args: Args) => Promise<R>,
) {
  return async (...args: Args): Promise<R> => {
    const user = await requireCurrentUser();

    return action(user as AuthenticatedUser, ...args);
  };
}

export function adminAction<Args extends unknown[], R>(
  action: (admin: AuthenticatedUser, ...args: Args) => Promise<R>,
) {
  return async (...args: Args): Promise<R> => {
    const admin = await requireAdminUser();

    return action(admin as AuthenticatedUser, ...args);
  };
}
