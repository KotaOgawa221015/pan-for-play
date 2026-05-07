'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ItemCard } from '@/components/ItemCard';
import { NavigationButton } from '@/components/NavigationButton';

const ITEMS = {
  bread: ['クロワッサン', 'カレーパン', '食パン', 'メロンパン'],
  soup: [
    'コーンポタージュ',
    'ミネストローネ',
    'クラムチャウダー',
    'オニオンスープ',
  ],
};

export default function InputPage() {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      [...ITEMS.bread, ...ITEMS.soup].map((name) => [name, 0]),
    ),
  );

  const updateQuantity = (name: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [name]: Math.max(0, prev[name] + delta),
    }));
  };

  const goToConfirm = () => {
    const params = new URLSearchParams();
    Object.entries(quantities).forEach(([name, count]) => {
      if (count > 0) params.append(name, count.toString());
    });
    router.push(`/confirm?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
      <header className="p-6 text-center border-b bg-white dark:bg-black dark:border-zinc-800">
        <h1 className="font-bold text-lg">冷凍庫注文</h1>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-8">
        <section>
          <h2 className="text-zinc-400 text-xs font-bold mb-4 uppercase tracking-widest">
            パン
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ITEMS.bread.map((name) => (
              <ItemCard
                key={name}
                name={name}
                count={quantities[name]}
                onUpdate={updateQuantity}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-zinc-400 text-xs font-bold mb-4 uppercase tracking-widest">
            スープ
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ITEMS.soup.map((name) => (
              <ItemCard
                key={name}
                name={name}
                count={quantities[name]}
                onUpdate={updateQuantity}
              />
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-8 left-0 right-0 flex justify-center px-4 pointer-events-none">
        <NavigationButton onClick={goToConfirm} className="pointer-events-auto">
          入力完了
        </NavigationButton>
      </div>
    </div>
  );
}
