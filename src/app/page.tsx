import { ItemCard } from '@/components/ItemCard';
import { getInventoryItems } from '@/app/actions';
import { logoutAction } from '@/app/actions';
import Link from 'next/link';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  const items = await getInventoryItems();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-12">
      {(msg === 'login_success' || msg === 'signup_success') && (
        <div className="bg-emerald-50 border-b border-emerald-100 text-emerald-700 text-center py-1.5 text-xs font-medium dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400">
          {msg === 'login_success'
            ? 'ログインしました'
            : 'アカウントを作成しました'}
        </div>
      )}
      <header className="relative p-6 border-b bg-white dark:bg-black dark:border-zinc-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between relative">
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs text-zinc-400 hover:text-zinc-600 underline"
            >
              ログアウト
            </button>
          </form>

          <h1 className="font-bold text-lg">冷凍庫在庫</h1>

          <div className="flex gap-2">
            <Link
              href="/admin"
              className="text-xs text-zinc-400 hover:text-zinc-600 underline"
            >
              管理者用
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 space-y-10">
        <section>
          {items.length === 0 ? (
            <p className="text-sm text-zinc-400">アイテムがありません</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
