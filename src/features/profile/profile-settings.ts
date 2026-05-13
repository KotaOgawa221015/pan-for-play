'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/features/auth/account-access';
import { prisma } from '@/lib/prisma';
import { signOut } from "@/features/auth/auth";

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
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'ユーザーが見つかりません' };

    // トランザクションで整合性を保ちつつ論理削除
    await prisma.$transaction([
      // 1. Userのemailを書き換えてユニーク制約を逃がし、deletedAtを刻む
      prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          email: `${user.email}_deleted_${Date.now()}`, // 同じGoogleアカウントで再登録可能にする
        },
      }),
      // 2. 外部認証連携(Google)を解除（これをしないと次回ログイン時に古いUserに紐付く）
      prisma.account.deleteMany({
        where: { userId: userId },
      }),
      // 3. 現在のセッションをDBから削除
      prisma.session.deleteMany({
        where: { userId: userId },
      }),
    ]);

    // 重要：最後にサインアウトしてCookieをクリア
    await signOut({ redirectTo: "/login?msg=logout_success" });
    return { success: true };
  } catch (error) {
    console.error('Delete account error:', error);
    return { error: '退会処理に失敗しました' };
  }
}