import type { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from './auth';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  favoriteFridgeId: string | null;
};

export type SessionStatus =
  | { status: 'anonymous' }
  | { status: 'invalid' }
  | { status: 'authenticated'; user: AuthenticatedUser };

async function getSessionStatus(): Promise<SessionStatus> {
  const session = await auth();
  if (!session?.user?.id) return { status: 'anonymous' };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      deletedAt: true,
      favoriteFridgeId: true,
    },
  });

  if (!user || user.deletedAt) {
    return { status: 'invalid' };
  }

  return {
    status: 'authenticated',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      favoriteFridgeId: user.favoriteFridgeId,
    },
  };
}

export async function requireCurrentUser() {
  const sessionStatus = await getSessionStatus();

  if (sessionStatus.status === 'anonymous') {
    redirect('/login');
  }

  if (sessionStatus.status === 'invalid') {
    redirect('/session/clear');
  }

  return sessionStatus.user;
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
