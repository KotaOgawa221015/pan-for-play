'use client';

import { isRedirectError } from 'next/dist/client/components/redirect-error';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import {
  loginAsAdminAction,
  loginAsUserAction,
  loginWithGoogleAction,
} from '@/features/account/access';

type LoginPageClientProps = {
  isGoogleSignInEnabled: boolean;
};

export function LoginPageClient({
  isGoogleSignInEnabled,
}: LoginPageClientProps) {
  const showDemoLogin = process.env.NODE_ENV === 'development';
  const [googleLoginError, setGoogleLoginError] = useState<string | null>(null);
  const [devLoginError, setDevLoginError] = useState<string | null>(null);
  const [isGoogleSignInPending, startGoogleSignInTransition] = useTransition();
  const [isDevLoginPending, startDevLoginTransition] = useTransition();

  const description = 'Googleアカウントでログインしてください';

  const handleGoogleSignIn = () => {
    setGoogleLoginError(null);

    if (!isGoogleSignInEnabled) {
      setGoogleLoginError(
        'Googleログインは現在利用できません。管理者へ設定状況を確認してください。',
      );
      return;
    }

    startGoogleSignInTransition(async () => {
      try {
        const result = await loginWithGoogleAction();
        if (result?.error) {
          setGoogleLoginError(result.error);
        }
      } catch (error) {
        if (isRedirectError(error)) {
          throw error;
        }
        setGoogleLoginError('予期せぬエラーが発生しました。');
      }
    });
  };

  const handleDevLogin = (
    action: () => Promise<{ error?: string } | undefined>,
  ) => {
    setDevLoginError(null);

    startDevLoginTransition(async () => {
      try {
        const result = await action();
        if (result?.error) {
          setDevLoginError(result.error);
        }
      } catch (error) {
        if (isRedirectError(error)) {
          throw error;
        }
        setDevLoginError('予期せぬエラーが発生しました。');
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm space-y-6 text-center">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">ログイン</h1>
          <p className="text-sm text-zinc-500">{description}</p>
        </header>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleSignInPending}
          className="w-full py-4 bg-white border border-zinc-300 text-zinc-900 rounded-xl font-bold hover:bg-zinc-50 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
        >
          Googleでログイン
        </button>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed px-2">
          ログインまたは新規登録を行うことで、Pan for PLAYの
          <Link
            href="/terms"
            className="text-emerald-600 dark:text-emerald-400 hover:underline mx-0.5"
          >
            利用規約
          </Link>
          および
          <Link
            href="/privacy"
            className="text-emerald-600 dark:text-emerald-400 hover:underline mx-0.5"
          >
            プライバシーポリシー
          </Link>
          に同意したものとみなされます。
        </p>
        {googleLoginError && (
          <div className="p-3 border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20 rounded-xl text-left">
            <p
              role="alert"
              className="text-xs text-rose-600 dark:text-rose-400 font-mono leading-relaxed whitespace-pre-wrap"
            >
              {googleLoginError}
            </p>
          </div>
        )}
        {showDemoLogin && (
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div className="mb-4 text-center">
              <span className="px-2 bg-white dark:bg-zinc-900 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                Dev Mode Only
              </span>
            </div>

            {devLoginError && (
              <div className="mb-4 p-3 border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20 rounded-xl text-left">
                <p
                  role="alert"
                  className="text-xs text-rose-600 dark:text-rose-400 font-mono leading-relaxed whitespace-pre-wrap"
                >
                  {devLoginError}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDevLogin(loginAsUserAction)}
                disabled={isDevLoginPending}
                className="py-3 px-2 bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-xl text-[11px] font-bold hover:bg-zinc-100 hover:text-zinc-900 transition shadow-sm dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-50"
              >
                一般ユーザー
              </button>
              <button
                type="button"
                onClick={() => handleDevLogin(loginAsAdminAction)}
                disabled={isDevLoginPending}
                className="py-3 px-2 bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-xl text-[11px] font-bold hover:bg-zinc-100 hover:text-zinc-900 transition shadow-sm dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-50"
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
