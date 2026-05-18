import Link from 'next/link';
import { getRecentReceivingHistory } from '@/features/receiving/history/list-recent';
import { Dashboard } from './_receiving/Dashboard';

export default async function UploadPage() {
  const recentHistory = await getRecentReceivingHistory();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-800 pb-4 mt-2">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            管理画面
          </h1>
          <Link
            href="/admin/qr"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg transition"
          >
            サイトのQRコードを発行
          </Link>
          <Link href="/" className="text-sm text-zinc-500 hover:underline">
            戻る
          </Link>
        </header>

        <Dashboard recentHistory={recentHistory} />
      </div>
    </div>
  );
}
