import type { Metadata } from 'next';
import { FlashMessage } from '@/app/_components/FlashMessage';
import { InventoryPublicationPanel } from '@/app/_components/InventoryPublicationPanel';
import { ProductCard } from '@/app/_components/ProductCard';
import { UserMenu } from '@/app/_components/UserMenu';
import { getInventoryProducts } from '@/features/inventory/product-inventory';
import { getCurrentInventoryPublicationSummary } from '@/features/inventory/publication-summary';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'パンコレ',
  description: '冷凍庫のパンとスープの在庫を管理するアプリ',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ msg }, products, publicationSummary] = await Promise.all([
    searchParams,
    getInventoryProducts(),
    getCurrentInventoryPublicationSummary(),
  ]);

  const availableProducts = products.filter((p) => p.status !== 'SOLD_OUT');
  const soldOutProducts = products.filter((p) => p.status === 'SOLD_OUT');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-12">
      <FlashMessage msg={msg} />
      <header className="relative p-6 border-b bg-white dark:bg-zinc-950 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto relative flex items-center justify-center min-h-16">
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

        <div
          className="absolute ri
        
        
        
        
        ght-6 top-1/2 -translate-y-1/2 flex items-center gap-4"
        >
          <UserMenu />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-10">
        <section>
          {products.length === 0 ? (
            <p className="text-sm text-zinc-400">商品がありません</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {soldOutProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {publicationSummary ? (
          <InventoryPublicationPanel summary={publicationSummary} />
        ) : null}
      </main>
    </div>
  );
}
