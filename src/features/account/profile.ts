'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth, signOut } from './auth';
import { requireCurrentUser } from './session-user';

const profileUpdateSchema = z.object({
  name: z
    .string({
      message: '表示名を入力してください',
    })
    .trim()
    .min(1, { message: '表示名を入力してください' })
    .max(30, { message: '表示名は30文字以内で入力してください' }),
  favoriteFridgeId: z.string().nullable(),
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
    favoriteFridgeId: (() => {
      const raw = formData.get('favoriteFridgeId');
      if (typeof raw !== 'string') return null;
      return raw.trim() ? raw : null;
    })(),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message ?? '表示名を入力してください' };
  }

  const { name, favoriteFridgeId } = parsed.data;

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name, favoriteFridgeId },
    });
    revalidatePath('/profile');
  } catch {
    return { error: '更新に失敗しました' };
  }

  redirect('/profile?msg=profile_update_success');
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
