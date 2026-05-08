import Link from 'next/link';
import { UploadForm } from './UploadForm';

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">納品書読み込み</h1>
          <Link href="/admin" className="text-sm text-zinc-500 hover:underline">戻る</Link>
        </header>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">画像アップロード</h2>
            <p className="text-xs text-zinc-500 mt-1">
              撮影した納品書の画像をアップロードしてください。
            </p>
          </div>
          
          {/* フォームコンポーネント */}
          <UploadForm />
        </div>
      </div>
    </div>
  );
}