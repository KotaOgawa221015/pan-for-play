import { getCurrentUser } from '@/features/auth/account-access';
import { ProfileForm } from './profile-form';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'マイページ | パンコレ',
  description: 'プロフィール情報を管理します。',
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Authenticated user is required.');
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* 在庫管理（トップページ）へ戻るボタン */}
        <Link
          href="/"
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
          在庫一覧に戻る
        </Link>

        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">マイページ</h1>
          <p className="text-zinc-500">アカウント情報の管理</p>
        </header>

        <ProfileForm user={user} />
      </div>
    </div>
  );
}
