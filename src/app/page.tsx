import type { Metadata } from 'next';
import Link from 'next/link';
import { FlashMessage } from '@/app/_components/FlashMessage';
import { InventoryPublicationPanel } from '@/app/_components/InventoryPublicationPanel';
import { ProductCard } from '@/app/_components/ProductCard';
import { UserMenu } from '@/app/_components/UserMenu';
import { requireCurrentUser } from '@/features/account/session-user';
import { getInventoryProducts } from '@/features/inventory/product-inventory';
import { getCurrentInventoryPublicationSummary } from '@/features/inventory/publication-summary';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'パンコレ',
  description: '冷凍庫のパンとスープの在庫を管理するアプリ',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; fridgeId?: string }>;
}) {
  const user = await requireCurrentUser();
  const [{ msg, fridgeId: queryFridgeId }] = await Promise.all([searchParams]);

  const fridges = await prisma.fridge.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  });
  const activeFridgeId =
    queryFridgeId ||
    user.favoriteFridgeId ||
    fridges.find((f) => f.isDefault)?.id ||
    fridges[0]?.id;

  const activeFridge = fridges.find((f) => f.id === activeFridgeId);

  const products = activeFridgeId
    ? await getInventoryProducts(activeFridgeId)
    : [];
  const publicationSummary = activeFridgeId
    ? await getCurrentInventoryPublicationSummary(activeFridgeId)
    : null;

  const availableProducts = products.filter((p) => p.status !== 'SOLD_OUT');
  const soldOutProducts = products.filter((p) => p.status === 'SOLD_OUT');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-12">
      <FlashMessage msg={msg} />
      <header className="relative p-6 border-b bg-white dark:bg-zinc-950 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto relative flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-lg">🍞</span>
            <h1 className="font-semibold text-xl">パンコレ</h1>
          </div>
          <span className="text-[13.5px] text-zinc-500 font-mono uppercase tracking-widest mb-4">
            ~冷凍庫のパンとスープ、いつでもひと目で~
          </span>

          {fridges.length > 0 && (
            <div className="flex gap-2 overflow-x-auto w-full max-w-xl justify-center pb-2">
              {fridges.map((fridge) => (
                <Link
                  key={fridge.id}
                  href={`/?fridgeId=${fridge.id}`}
                  className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
                    fridge.id === activeFridgeId
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  {fridge.name}
                  {fridge.id === user.favoriteFridgeId && ' ⭐️'}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="absolute right-6 top-6 flex items-center gap-4">
          <UserMenu />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-10">
        <section>
          {!activeFridge ? (
            <p className="text-sm text-zinc-400 text-center py-10">
              冷蔵庫が登録されていません
            </p>
          ) : products.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-10">
              商品がありません
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  fridgeId={activeFridge.id}
                  product={product}
                />
              ))}
              {soldOutProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  fridgeId={activeFridge.id}
                  product={product}
                />
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
