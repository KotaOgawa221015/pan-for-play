'use server';

import { revalidatePath } from 'next/cache';
import { requireCurrentUser } from '@/features/auth/session-user';
import { prisma } from '@/lib/prisma';
import { auth, signOut } from '@/features/auth/auth';

export async function updateProfileAction(
  _prevState: unknown,
  formData: FormData,
) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  const user = await requireCurrentUser();

  const userId = user.id;

  const name = formData.get('name') as string;

  if (!name?.trim()) {
    return { error: '表示名を入力してください' };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
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
      (acc) => acc.provider === 'google',
    );
    const token = googleAccount?.access_token || googleAccount?.refresh_token;
    if (token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      } catch (err) {
        console.error('Google token revocation failed:', err);
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
      prisma.account.deleteMany({ where: { userId: userId } }),
      prisma.session.deleteMany({ where: { userId: userId } }),
    ]);
  } catch (error) {
    console.error('Delete account error:', error);
    return { error: '退会処理に失敗しました' };
  }

  await signOut({ redirectTo: '/login?msg=logout_success' });
}
