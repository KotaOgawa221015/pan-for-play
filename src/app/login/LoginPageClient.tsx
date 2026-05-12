'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions';
import Link from 'next/link';

export function LoginPageClient() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">ログイン</h1>
          <p className="text-sm text-zinc-500">
            メールアドレスとパスワードを入力してください
          </p>
        </header>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg text-center font-medium dark:bg-rose-900/20 dark:border-rose-800">
              {state.error}
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-xs font-bold text-zinc-400 uppercase"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
              placeholder="example@mail.com"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-xs font-bold text-zinc-400 uppercase"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {isPending ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <p className="text-sm text-center text-zinc-500">
          アカウントをお持ちでないですか？{' '}
          <Link
            href="/signup"
            className="text-emerald-600 font-bold hover:underline"
          >
            サインアップ
          </Link>
        </p>
      </div>
    </div>
  );
}
