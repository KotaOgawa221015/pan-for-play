import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b pb-4 dark:border-zinc-800">
          <h1 className="text-xl font-semibold">管理者ページ</h1>
          <Link href="/" className="text-sm text-zinc-500 hover:underline">
            ボードへ戻る
          </Link>
        </header>

        <main className="grid gap-4 md:grid-cols-2">
          <Link
            href="/admin/upload"
            className="flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:ring-2 hover:ring-zinc-200 transition"
          >
            <span className="text-2xl mb-2">📄</span>
            <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
              納品書読み込み
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              画像をアップロードして在庫を一括更新します
            </p>
          </Link>

          {/* 今後追加される機能のプレースホルダー */}
          <div className="flex flex-col items-center justify-center p-8 bg-zinc-100 dark:bg-zinc-800/50 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl opacity-50 cursor-not-allowed">
            <h2 className="font-semibold text-zinc-400">（Coming Soon）</h2>
          </div>
        </main>
      </div>
    </div>
  );
}
