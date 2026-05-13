'use server';

import { signIn, signOut, auth } from './auth';
import { prisma } from '@/lib/prisma';

export async function loginWithGoogleAction() {
  const session = await auth();
  if (session) return; // Already logged in
  await signIn('google', { redirectTo: '/' });
}

export async function logoutAction() {
  const session = await auth();
  if (!session) return;
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
