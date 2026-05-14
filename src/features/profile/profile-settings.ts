'use server';

import { revalidatePath } from 'next/cache';
import { requireCurrentUser } from '@/features/auth/account-access';
import { prisma } from '@/lib/prisma';
import { auth, signOut } from '@/features/auth/auth';

export async function updateProfileAction(
  _prevState: unknown,
  formData: FormData,
) {
  const user = await requireCurrentUser();
  const userId = user.id;
  const email = user.email;

  const name = formData.get('name') as string;

  if (!name?.trim()) {
    return { error: '表示名を入力してください' };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim(), email },
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
      include: { accounts: true }, // Account情報を取得
    });
    if (!user) return { error: 'ユーザーが見つかりません' };

    // --- Google側の承認を解除する処理を追加 ---
    const googleAccount = user.accounts.find(
      (acc) => acc.provider === 'google',
    );
    // access_token または refresh_token を使用
    const token = googleAccount?.access_token || googleAccount?.refresh_token;

    if (token) {
      try {
        // GoogleのRevoke APIを呼び出す
        await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      } catch (err) {
        console.error('Google token revocation failed:', err);
        // 失敗してもDB削除は進める（アプリ側の退会を優先）
      }
    }
    // ----------------------------------------

    await prisma.$transaction([
      // 既存の削除ロジック
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
