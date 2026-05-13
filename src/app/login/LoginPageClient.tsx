'use client';

import { loginWithGoogleAction } from '@/features/auth/account-access';

export function LoginPageClient() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm space-y-6 text-center">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">ログイン</h1>
          <p className="text-sm text-zinc-500">Googleアカウントでログインしてください</p>
        </header>

        <button
          onClick={() => loginWithGoogleAction()}
          className="w-full py-4 bg-white border border-zinc-300 text-zinc-900 rounded-xl font-bold hover:bg-zinc-50 transition shadow-sm flex items-center justify-center gap-2"
        >
          Googleでログイン
        </button>
      </div>
    </div>
  );
}