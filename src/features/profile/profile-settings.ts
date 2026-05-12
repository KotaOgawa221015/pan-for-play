'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/features/auth/account-access';
import { prisma } from '@/lib/prisma';

export async function updateProfileAction(
  _prevState: unknown,
  formData: FormData,
) {
  const userId = await getCurrentUserId();
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
