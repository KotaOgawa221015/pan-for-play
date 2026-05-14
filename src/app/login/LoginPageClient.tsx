'use client';

import {
  loginWithGoogleAction,
  loginAsAdminAction,
} from '@/features/auth/account-access';

export function LoginPageClient() {
  const isDev = process.env.NODE_ENV === 'development';
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm space-y-6 text-center">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">ログイン</h1>
          <p className="text-sm text-zinc-500">
            Googleアカウントでログインしてください
          </p>
        </header>

        <button
          type="button"
          onClick={() => loginWithGoogleAction()}
          className="w-full py-4 bg-white border border-zinc-300 text-zinc-900 rounded-xl font-bold hover:bg-zinc-50 transition shadow-sm flex items-center justify-center gap-2"
        >
          Googleでログイン
        </button>
        {isDev && (
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => loginAsAdminAction()}
              className="w-full py-3 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-200 transition"
            >
              【検証用】管理者としてログイン (OAuthスキップ)
            </button>
            <p className="mt-2 text-[10px] text-zinc-400">
              ※このボタンは開発環境でのみ表示・動作します
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
