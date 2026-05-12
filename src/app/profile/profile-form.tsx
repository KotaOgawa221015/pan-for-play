'use client';

import { useActionState } from 'react';

import { updateProfileAction } from '@/features/profile/profile-settings';
import Link from 'next/link';

export function ProfileForm({
  user,
}: {
  user: { displayName: string | null; email: string };
}) {
  const [pState, pAction, pPending] = useActionState(updateProfileAction, null);

  return (
    <div className="space-y-6">
      {/* 基本情報 */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h2 className="font-semibold text-lg mb-6">基本情報</h2>

        <form action={pAction} className="flex flex-col gap-6">
          <input type="hidden" name="email" value={user.email} />

          <div className="space-y-1">
            <label
              htmlFor="displayName"
              className="text-xs font-bold text-zinc-400 uppercase"
            >
              表示名
            </label>
            <input
              id="displayName"
              name="displayName"
              defaultValue={user.displayName || ''}
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-zinc-400 uppercase">
              メールアドレス
            </p>
            <div className="py-2 text-zinc-800 dark:text-zinc-200">
              {user.email}
            </div>
          </div>

          {/* メッセージ */}
          {(pState?.success || pState?.error) && (
            <div className="text-right -mb-2">
              {pState?.success && (
                <p className="text-green-600 text-xs font-bold">
                  {pState.success}
                </p>
              )}
              {pState?.error && (
                <p className="text-red-600 text-xs font-bold">{pState.error}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <Link
              href="/profile/email"
              className="inline-flex items-center px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            >
              メールアドレスを変更する
            </Link>

            <button
              type="submit"
              disabled={pPending}
              className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {pPending ? '保存中...' : '基本情報を保存'}
            </button>
          </div>
        </form>
      </div>

      {/* セキュリティ */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h2 className="font-semibold text-lg mb-6">セキュリティ</h2>

        <div className="flex flex-col gap-6">
          <div className="space-y-1">
            <p className="text-xs font-bold text-zinc-400 uppercase">
              現在のパスワード
            </p>
            <div className="text-zinc-500 font-mono py-2">********</div>
          </div>

          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <Link
              href="/profile/password"
              className="inline-block px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            >
              パスワードを変更する
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
