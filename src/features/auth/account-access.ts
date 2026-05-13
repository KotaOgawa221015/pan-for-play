'use server';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

const SESSION_COOKIE_NAME = 'pancolle_session';

async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function loginAction(_prevState: unknown, formData: FormData) {
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

  await setSessionCookie(user.id);

  redirect('/?msg=login_success');
}

export async function signupAction(_prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  if (!name?.trim()) {
    return { error: '表示名を入力してください' };
  }
  if (!email?.includes('@')) {
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
    data: { email, passwordHash, name: name.trim() },
  });

  await setSessionCookie(user.id);

  redirect('/?msg=signup_success');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/login');
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
}

export async function getCurrentUserId() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}
