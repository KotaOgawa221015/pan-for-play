'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ProductCard } from '@/app/_components/ProductCard';
import type { Product } from '@/types/inventory';

type Props = {
  fridgeId: string;
  products: Product[];
};

export function ProductList({ fridgeId, products }: Props) {
  const shouldReduceMotion = useReducedMotion();

  const sortedProducts = products.toSorted((a, b) => {
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-6">
      {' '}
      {sortedProducts.map((product) => (
        <motion.div
          key={product.id}
          layout={!shouldReduceMotion}
          transition={dynamicSpring}
          initial={false}
          style={{
            zIndex: product.status === 'SOLD_OUT' ? 0 : 10,
          }}
        >
          <ProductCard fridgeId={fridgeId} product={product} />
        </motion.div>
      ))}
    </div>
  );
}
