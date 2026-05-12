import { ProductCard } from '@/components/ProductCard';
import { getInventoryProducts } from '@/app/actions';
import Link from 'next/link';
import { UserMenu } from '@/components/UserMenu';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'パンコレ',
  description: '冷凍庫のパンとスープの在庫を管理するアプリ',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ msg }, products] = await Promise.all([
    searchParams,
    getInventoryProducts(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-12">
      {(msg === 'login_success' || msg === 'signup_success') && (
        <div className="bg-emerald-50 border-b border-emerald-100 text-emerald-700 text-center py-1.5 text-xs font-medium dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400">
          {msg === 'login_success'
            ? 'ログインしました'
            : 'アカウントを作成しました'}
        </div>
      )}
      <header className="relative p-6 border-b bg-white dark:bg-zinc-950 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto relative flex items-center justify-center min-h-16">
          <div className="flex flex-col items-center justify-center leading-none mt-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-lg">🍞</span>
              <h1 className="font-semibold text-xl">パンコレ</h1>
            </div>

            <span className="text-[13.5px] text-zinc-500 font-mono uppercase tracking-widest">
              ~冷凍庫のパンとスープ、いつでもひと目で~
            </span>
          </div>
        </div>

        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
          <UserMenu />

          <Link
            href="/admin"
            className="bg-white text-xs font-medium px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 hover:border-zinc-900 hover:text-zinc-900 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shadow-sm"
          >
            管理者用
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-10">
        <section>
          {products.length === 0 ? (
            <p className="text-sm text-zinc-400">商品がありません</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
