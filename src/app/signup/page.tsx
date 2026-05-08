// src/app/signup/page.tsx (新規作成)
import { signupAction } from '@/app/actions';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-2xl font-bold">サインアップ</h1>
          <p className="text-sm text-zinc-500">新しくアカウントを作成します</p>
        </header>

        <form action={signupAction} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-xs font-bold text-zinc-400 uppercase"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
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
              type="password"
              required
              className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold hover:opacity-90 transition"
          >
            アカウント作成
          </button>
        </form>

        <p className="text-sm text-center text-zinc-500">
          既にアカウントをお持ちですか？{' '}
          <Link
            href="/login"
            className="text-zinc-900 dark:text-zinc-100 font-bold hover:underline"
          >
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
