// src/app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import {
  isProductStatus,
  type Product,
  type ProductStatus,
} from '@/types/inventory';

const SESSION_COOKIE_NAME = 'pancolle_session';

export async function getInventoryProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
  });

  return products.map((product) => {
    const status = product.status;

    if (!isProductStatus(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    return {
      id: product.id,
      name: product.name,
      status,
      updatedAt: product.updatedAt.toISOString(),
    };
  });
}

export async function updateProductStatus(
  productId: string,
  status: ProductStatus,
) {
  if (!isProductStatus(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  await prisma.product.update({
    where: { id: productId },
    data: { status },
  });

  revalidatePath('/', 'layout');
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

export async function signupAction(_prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const displayName = formData.get('displayName') as string;

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

  const [passwordHash, cookieStore] = await Promise.all([
    bcrypt.hash(password, 10),
    cookies(),
  ]);
  const user = await prisma.user.create({
    data: { email, passwordHash, displayName },
  });

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

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
    },
  });
}

export async function updateProfileAction(
  _prevState: unknown,
  formData: FormData,
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!userId) return { error: '認証が必要です' };

  const displayName = formData.get('displayName') as string;
  const email = formData.get('email') as string;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { displayName, email },
    });
    revalidatePath('/profile');
    return { success: 'プロフィールを更新しました' };
  } catch {
    return { error: '更新に失敗しました' };
  }
}


