import type { Metadata } from 'next';
import Link from 'next/link';
import { FlashMessage } from '@/app/_components/FlashMessage';
import { requireCurrentUser } from '@/features/account/session-user';
import { prisma } from '@/lib/prisma';
import { ProfileForm } from './profile-form';

export const metadata: Metadata = {
  title: 'マイページ | パンコレ',
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ msg }, user, fridges] = await Promise.all([
    searchParams,
    requireCurrentUser(),
    prisma.fridge.findMany({
      where: { deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    }),
  ]);

  return (
    <>
      <FlashMessage msg={msg} />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
        <div className="max-w-xl mx-auto space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
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
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            戻る
          </Link>
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold">マイページ</h1>
          </header>
          <ProfileForm user={user} fridges={fridges} />
        </div>
      </div>
    </>
  );
}
