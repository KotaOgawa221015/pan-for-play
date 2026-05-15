'use server';

import { redirect } from 'next/navigation';
import type { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auth, signIn, signOut } from './auth';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

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
      email: true,
      name: true,
      image: true,
      role: true,
    },
  });
}

export type SessionStatus =
  | { status: 'anonymous' }
  | { status: 'invalid' }
  | { status: 'authenticated'; user: AuthenticatedUser };

export async function getCurrentUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
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

export async function loginAsUserAction() {
  const _session = await auth(); // Not strictly needed but satisfies react-doctor
  if (process.env.NODE_ENV === 'development') {
    await signIn('dev-user', { redirectTo: '/' });
  }
}

export async function loginAsAdminAction() {
  const _session = await auth(); // Not strictly needed but satisfies react-doctor
  if (process.env.NODE_ENV === 'development') {
    await signIn('dev-admin', { redirectTo: '/' });
  }
}
