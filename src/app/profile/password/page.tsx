import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSessionStatus } from '@/features/auth/account-access';

export const metadata: Metadata = {
  title: 'パスワード変更 | パンコレ',
  description: 'パスワードを変更します。',
};

export default async function PasswordChangePage() {
  const session = await getSessionStatus();

  if (session.status === 'invalid') {
    redirect('/session/clear');
  }

  if (session.status !== 'authenticated') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* マイページへ戻るボタン */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>戻る</title>
            <path d="m15 18-6-6 6-6" />
          </svg>
          マイページに戻る
        </Link>

        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">パスワードの変更</h1>
          <p className="text-zinc-500">安全なパスワードを設定してください</p>
        </header>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <form className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="current-pass"
                  className="text-xs font-bold text-zinc-400 uppercase"
                >
                  現在のパスワード
                </label>
                <input
                  id="current-pass"
                  type="password"
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="new-pass"
                  className="text-xs font-bold text-zinc-400 uppercase"
                >
                  新しいパスワード
                </label>
                <input
                  id="new-pass"
                  type="password"
                  placeholder="6文字以上"
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="confirm-pass"
                  className="text-xs font-bold text-zinc-400 uppercase"
                >
                  新しいパスワード（確認）
                </label>
                <input
                  id="confirm-pass"
                  type="password"
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="submit"
                className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition"
              >
                パスワードを変更する
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
