'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  isItemStatus,
  type InventoryItem,
  type ItemStatus,
} from '@/types/inventory';

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const items = await prisma.item.findMany({
    orderBy: { name: 'asc' },
  });

  return items.map((item) => {
    const status = item.status;

    if (!isItemStatus(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    return {
      id: item.id,
      name: item.name,
      status,
      updatedAt: item.updatedAt.toISOString(),
    };
  });
}

export async function updateItemStatus(itemId: string, status: ItemStatus) {
  if (!isItemStatus(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  await prisma.item.update({
    where: { id: itemId },
    data: { status },
  });

  revalidatePath('/', 'layout');
}

const SESSION_COOKIE_NAME = 'pancolle_session';

export async function loginAction() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, 'dummy-session-id', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  redirect('/');
}

export async function signupAction() {
  await loginAction();
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/login');
}
