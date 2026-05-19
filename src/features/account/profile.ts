'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth, signOut } from './auth';
import { requireCurrentUser } from './session-user';
import { z } from 'zod';

const profileUpdateSchema = z.object({
  name: z
    .string({
      message: '表示名を入力してください',
    })
    .trim()
    .min(1, { message: '表示名を入力してください' })
    .max(30, { message: '表示名は30文字以内で入力してください' }),
});

export async function updateProfileAction(
  _prevState: unknown,
  formData: FormData,
) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  const user = await requireCurrentUser();

  const parsed = profileUpdateSchema.safeParse({
    name: formData.get('name'),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message ?? '表示名を入力してください' };
  }

  const { name } = parsed.data;

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });
    revalidatePath('/profile');
    return { success: 'プロフィールを更新しました' };
  } catch {
    return { error: '更新に失敗しました' };
  }
}

export async function deleteAccountAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: '認証が必要です' };
  const userId = session.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true },
    });
    if (!user) return { error: 'ユーザーが見つかりません' };

    const googleAccount = user.accounts.find(
      (account) => account.provider === 'google',
    );
    const token = googleAccount?.access_token || googleAccount?.refresh_token;
    if (token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      } catch (error) {
        console.error('Google token revocation failed:', error);
      }
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          email: `${user.email}_deleted_${Date.now()}`,
        },
      }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
    ]);
  } catch (error) {
    console.error('Delete account error:', error);
    return { error: '退会処理に失敗しました' };
  }

  await signOut({ redirectTo: '/login?msg=logout_success' });
}
