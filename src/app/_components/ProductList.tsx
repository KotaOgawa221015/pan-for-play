'use client';

import { motion } from 'framer-motion';
import { ProductCard } from '@/app/_components/ProductCard';
import type { Product } from '@/types/inventory';

type Props = {
  products: Product[];
};

export function ProductList({ products }: Props) {
  const sortedProducts = [...products].sort((a, b) => {
    const aIsSoldOut = a.status === 'SOLD_OUT';
    const bIsSoldOut = b.status === 'SOLD_OUT';

    if (aIsSoldOut && !bIsSoldOut) return 1;
    if (!aIsSoldOut && bIsSoldOut) return -1;

    return a.name.localeCompare(b.name, 'ja');
  });

  const dynamicSpring = {
    type: 'spring',
    stiffness: 85,
    damping: 14,
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
            zIndex: product.status === 'SOLD_OUT' ? 0 : 10,
          }}
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </div>
  );
}
