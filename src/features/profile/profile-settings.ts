'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/features/auth/account-access';
import { prisma } from '@/lib/prisma';
import { signOut } from "@/auth";

export async function updateProfileAction(_prevState: unknown, formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: '認証が必要です' };

  const name = formData.get('name') as string;

  if (!name?.trim()) {
    return { error: '表示名を入力してください' };
  }

  try {
    await prisma.user.update({
      where: { id: userId },

      data: { name },

    });
    revalidatePath('/profile');
    return { success: 'プロフィールを更新しました' };
  } catch {
    return { error: '更新に失敗しました' };
  }
}

export async function deleteAccountAction() {
  const userId = await getCurrentUserId();
  if (!userId) return { error: '認証が必要です' };

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    await signOut({ redirectTo: "/login" });
  } catch (error) {
    console.error(error);
    return { error: '退会処理に失敗しました' };
  }
}