import { ItemCard } from '@/components/ItemCard';
import { getInventoryItems } from '@/app/actions';
import Link from 'next/link';
import type { InventoryItem } from '@/types/inventory';
import { UserMenu } from '@/components/UserMenu';

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
          <div className="flex flex-col items-center justify-center leading-none mt-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🍞</span>
              <h1 className="font-extrabold text-xl">パンコレ</h1>
            </div>

            <span className="text-[13.5px] text-zinc-500 font-mono uppercase tracking-widest">
              ~冷凍庫のパンとスープ、いつでもひと目で~
            </span>

            <div className="absolute -right-48 flex items-center gap-10">
              <UserMenu />

              <Link
                href="/admin"
                className="bg-white text-xs font-medium px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-blue-50 hover:border-zinc-900 hover:text-zinc-900 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shadow-sm"
              >
                管理者用
              </Link>
            </div>
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
