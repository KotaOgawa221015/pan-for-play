'use client';

import {
  loginWithGoogleAction,
  loginAsAdminAction,
  loginAsUserAction,
} from '@/features/auth/account-access';

export function LoginPageClient() {
  const showDemoLogin =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true';
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
        {showDemoLogin && (
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div className="mb-4 text-center">
              <span className="px-2 bg-white dark:bg-zinc-900 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                Dev Mode Only
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => loginAsUserAction()}
                className="py-3 px-2 bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-xl text-[11px] font-bold hover:bg-zinc-100 hover:text-zinc-900 transition shadow-sm dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                一般ユーザー
              </button>
              <button
                type="button"
                onClick={() => loginAsAdminAction()}
                className="py-3 px-2 bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-xl text-[11px] font-bold hover:bg-zinc-100 hover:text-zinc-900 transition shadow-sm dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                管理者 (Bypass)
              </button>
            </div>

            <p className="mt-4 text-[10px] text-zinc-400 leading-relaxed">
              ※OAuth認証をスキップしてシードユーザーでログインします。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
