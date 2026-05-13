'use server';

import { signIn, signOut, auth } from "./auth";
import { prisma } from '@/lib/prisma';

export async function loginWithGoogleAction() {
  await signIn("google", { redirectTo: "/" });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
    },
  });
}

export async function getCurrentUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}