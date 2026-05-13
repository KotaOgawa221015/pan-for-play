'use server';

import { prisma } from '@/lib/prisma';
import { auth, signIn, signOut } from './auth';

export async function loginWithGoogleAction() {
  await signIn('google', { redirectTo: '/' });
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: {
      id: session.user.id,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
    },
  });
}

export type SessionStatus =
  | { status: 'anonymous' }
  | { status: 'invalid' }
  | { status: 'authenticated'; user: any };

export async function getSessionStatus(): Promise<SessionStatus> {
  const session = await auth();
  if (!session?.user) {
    return { status: 'anonymous' };
  }
  return { status: 'authenticated', user: session.user };
}

export async function getCurrentUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('セッションが無効です。再ログインしてください。');
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
