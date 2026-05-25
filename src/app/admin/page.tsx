import Link from 'next/link';
import { FlashMessage } from '@/app/_components/FlashMessage';
import { listEligibleUsers } from '@/features/account/admin-management';
import { requireAdminUser } from '@/features/account/session-user';
import { getRecentReceivingHistory } from '@/features/receiving/history/list-recent';
import { prisma } from '@/lib/prisma';
import { CleanupPanel } from './_components/CleanupPanel';
import { Dashboard } from './_receiving/Dashboard';
import { FridgeManagementPanel } from './_receiving/FridgeManagementPanel';
import { UserManagementPanel } from './_receiving/UserManagementPanel';

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  const currentAdmin = await requireAdminUser();

  const [recentHistory, users, fridges] = await Promise.all([
    getRecentReceivingHistory(),
    listEligibleUsers(),
    prisma.fridge.findMany({
      where: { deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    }),
  ]);

  return (
    <>
      <FlashMessage msg={msg} />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <header className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-800 pb-4 mt-2">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              管理画面
            </h1>
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
          </header>

          <UserManagementPanel users={users} currentAdminId={currentAdmin.id} />
          <FridgeManagementPanel fridges={fridges} />
          <Dashboard recentHistory={recentHistory} fridges={fridges} />
          <CleanupPanel />
        </div>
      </div>
    </>
  );
}
