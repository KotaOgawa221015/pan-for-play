// src/app/page.tsx
import { ProductCard } from '@/app/_components/ProductCard';
import { getInventoryProducts } from '@/features/inventory/product-inventory';
import type { Metadata } from 'next';
import { FlashMessage } from '@/app/_components/FlashMessage';
import { Header } from '@/app/_components/Header'; // ← 追加

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
      <FlashMessage msg={msg} />

      {/* 切り出したヘッダーを1行で呼び出し */}
      <Header />

      <main className="max-w-6xl mx-auto p-4 space-y-10">
        <section>
          {products.length === 0 ? (
            <p className="text-sm text-zinc-400">商品がありません</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
