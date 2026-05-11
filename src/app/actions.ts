// src/app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import {
  isItemStatus,
  type InventoryItem,
  type ItemStatus,
} from '@/types/inventory';

const SESSION_COOKIE_NAME = 'pancolle_session';

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

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'メールアドレスとパスワードを入力してください' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' };
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect('/?msg=login_success');
}


export async function signupAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !email.includes('@')) {
    return { error: '有効なメールアドレスを入力してください' };
  }
  if (!password || password.length < 6) {
    return { error: 'パスワードは6文字以上で入力してください' };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: 'このメールアドレスは既に登録されています' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect('/?msg=signup_success');
}


export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/login');
}