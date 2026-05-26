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

export const runtime = 'nodejs';

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ msg }, currentAdmin, recentHistory, users, fridges] =
    await Promise.all([
      searchParams,
      requireAdminUser(),
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
          <header className="mt-2 grid items-center gap-3 border-b border-zinc-300 pb-4 dark:border-zinc-800 md:grid-cols-[1fr_auto_1fr]">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 md:justify-self-start">
              管理画面
            </h1>
            <Link
              href="/admin/qr"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60 md:justify-self-center"
            >
              サイトのQRコードを発行
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-end gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 md:justify-self-end"
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

          <Dashboard recentHistory={recentHistory} fridges={fridges} />
          <UserManagementPanel users={users} currentAdminId={currentAdmin.id} />
          <FridgeManagementPanel fridges={fridges} />
          <CleanupPanel />
        </div>
      </div>
    </>
  );
}
