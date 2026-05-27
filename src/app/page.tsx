import type { Metadata } from 'next';
import Link from 'next/link';
import { FlashMessage } from '@/app/_components/FlashMessage';
import { InventoryPublicationPanel } from '@/app/_components/InventoryPublicationPanel';
import { ProductList } from '@/app/_components/ProductList';
import { UserMenu } from '@/app/_components/UserMenu';
import { requireCurrentUser } from '@/features/account/session-user';
import { getInventoryProducts } from '@/features/inventory/product-inventory';
import { getCurrentInventoryPublicationSummary } from '@/features/inventory/publication-summary';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pan for PLAY',
  description: '冷凍庫のパンとスープの在庫を管理するアプリ',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; fridgeId?: string }>;
}) {
  const [user, { msg, fridgeId: queryFridgeId }, fridges] = await Promise.all([
    requireCurrentUser(),
    searchParams,
    prisma.fridge.findMany({
      where: { deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    }),
  ]);

  const activeFridgeId =
    queryFridgeId ||
    user.favoriteFridgeId ||
    fridges.find((f) => f.isDefault)?.id ||
    fridges[0]?.id;

  const activeFridge = fridges.find((f) => f.id === activeFridgeId);

  const [products, publicationSummary] = activeFridgeId
    ? await Promise.all([
        getInventoryProducts(activeFridgeId),
        getCurrentInventoryPublicationSummary(activeFridgeId),
      ])
    : [[], null];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-12">
      <FlashMessage msg={msg} />
      <header className="relative p-6 border-b bg-white dark:bg-zinc-950 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto relative flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-lg">🍞</span>
            <h1 className="font-semibold text-xl">Pan for PLAY</h1>
          </div>
          <span className="text-[13.5px] text-zinc-500 font-mono uppercase tracking-widest mb-6">
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

          <div className="flex flex-wrap gap-4 items-center justify-center mt-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-50 text-emerald-700">
                十分
              </span>
              <span>6個以上</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-amber-50 text-amber-700">
                わずか
              </span>
              <span>1〜5個</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-rose-50 text-rose-700">
                完売
              </span>
              <span>0個</span>
            </div>
          </div>
        </div>

        <div className="absolute right-6 top-6 flex items-center gap-4">
          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="group bg-white p-2 border border-zinc-300 text-zinc-500 hover:text-zinc-800 hover:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm flex items-center justify-center"
              aria-label="管理者ページ"
            >
              <span
                aria-hidden="true"
                className="block h-5 w-5 bg-zinc-500 transition-colors group-hover:bg-zinc-800 dark:bg-zinc-400 dark:group-hover:bg-zinc-200"
                style={{
                  WebkitMask:
                    "url('/admin-gear.svg') center / contain no-repeat",
                  mask: "url('/admin-gear.svg') center / contain no-repeat",
                }}
              />
            </Link>
          )}
          <UserMenu />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-10">
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
            <ProductList fridgeId={activeFridgeId} products={products} />
          )}
        </section>

        {publicationSummary ? (
          <InventoryPublicationPanel summary={publicationSummary} />
        ) : null}
      </main>
    </div>
  );
}
