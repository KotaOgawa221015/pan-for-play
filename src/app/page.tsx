import { ItemCard } from '@/components/ItemCard';
import { getInventoryItems } from '@/app/actions';
import { logoutAction } from '@/app/actions';
import Link from 'next/link';
import {
  CATEGORY_LABELS,
  ITEM_CATEGORIES,
  type InventoryItem,
  type ItemCategory,
} from '@/types/inventory';

export default async function Page() {
  const items = await getInventoryItems();
  const itemsByCategory: Record<ItemCategory, InventoryItem[]> = {
    BREAD: [],
    SOUP: [],
  };

  for (const item of items) {
    itemsByCategory[item.category].push(item);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-12">
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
            <Link href="/admin" className="...">
              管理者用
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 space-y-10">
        {ITEM_CATEGORIES.map((category) => {
          const categoryItems = itemsByCategory[category];

          return (
            <section key={category}>
              <h2 className="text-zinc-400 text-xs font-bold mb-4 uppercase tracking-widest">
                {CATEGORY_LABELS[category]}
              </h2>
              {categoryItems.length === 0 ? (
                <p className="text-sm text-zinc-400">アイテムがありません</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categoryItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
