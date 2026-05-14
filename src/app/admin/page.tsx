import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionStatus } from '@/features/auth/account-access';
import { getRecentReceivingHistory } from '@/features/receiving/records';
import { Dashboard } from './_receiving/Dashboard';

export default async function UploadPage() {
  const session = await getSessionStatus();

  if (session.status === 'invalid') {
    redirect('/session/clear');
  }

  if (session.status !== 'authenticated') {
    redirect('/login');
  }

  const user = session.user;

  if (user.role !== 'ADMIN') {
    redirect('/');
  }

  const recentHistory = await getRecentReceivingHistory();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-800 pb-4 mt-2">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            納品書読み込み
          </h1>
          <Link href="/" className="text-sm text-zinc-500 hover:underline">
            戻る
          </Link>
        </header>

        <Dashboard recentHistory={recentHistory} />
      </div>
    </div>
  );
}
