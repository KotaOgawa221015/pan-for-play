import Link from 'next/link';
import { getRecentReceivingHistory } from '@/features/receiving/history/list-recent';
import { Dashboard } from './_receiving/Dashboard';
import { listEligibleUsers } from '@/features/account/admin-management';
import { UserManagementPanel } from './_receiving/UserManagementPanel';
import { requireAdminUser } from '@/features/account/session-user';

export const dynamic = 'force-dynamic';

export default async function UploadPage() {
  const currentAdmin = await requireAdminUser();

  // eslint-disable-next-line react-doctor/async-parallel react-doctor/server-sequential-independent-await
  const [recentHistory, users] = await Promise.all([
    getRecentReceivingHistory(),
    listEligibleUsers(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-800 pb-4 mt-2">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            管理画面
          </h1>
          <Link href="/" className="text-sm text-zinc-500 hover:underline">
            戻る
          </Link>
        </header>
        <UserManagementPanel users={users} currentAdminId={currentAdmin.id} />

        <Dashboard recentHistory={recentHistory} />
      </div>
    </div>
  );
}
