'use client';

import { motion } from 'framer-motion';
import { ProductCard } from '@/app/_components/ProductCard';
import type { Product } from '@/types/inventory';

type Props = {
  products: Product[];
};

export function ProductList({ products }: Props) {
  // 💡 在庫ありを上（先）、売り切れを下（後）にするように「1つの配列内」でソートします
  // これによりループが分断されず、Framer Motionが移動ルートを完全に補間できるようになります
  const sortedProducts = [...products].sort((a, b) => {
    const aIsSoldOut = a.status === 'SOLD_OUT';
    const bIsSoldOut = b.status === 'SOLD_OUT';

    if (aIsSoldOut && !bIsSoldOut) return 1; // 売り切れ(a)を後ろに
    if (!aIsSoldOut && bIsSoldOut) return -1; // 在庫あり(a)を前に

    // 同じステータス（例: 在庫あり同士、売り切れ同士）の中では名前順で綺麗に並べます
    return a.name.localeCompare(b.name, 'ja');
  });

  // 移動の軌跡を目でしっかり追えるように調整したスプリング
  const dynamicSpring = {
    type: 'spring',
    stiffness: 85, // 移動スピードを心地よい速度に調整（ハッキリ動くのが見えます）
    damping: 14, // 到着したときのプルンとした弾みを残しつつ、スムーズに着地させます
    mass: 0.7,
  } as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {sortedProducts.map((product) => (
        <motion.div
          key={product.id}
          layout
          transition={dynamicSpring}
          initial={false}
          style={{
            // 💡 移動中のカードが他のカードの下を潜らないよう、重なり順（zIndex）をコントロールします
            zIndex: product.status === 'SOLD_OUT' ? 0 : 10,
          }}
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </div>
  );
}
