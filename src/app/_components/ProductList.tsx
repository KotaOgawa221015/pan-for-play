'use client';

import { domAnimation, LazyMotion, m, useReducedMotion } from 'framer-motion';
import { ProductCard } from '@/app/_components/ProductCard';
import type { Product } from '@/types/inventory';

type Props = {
  fridgeId: string;
  products: Product[];
};

export function ProductList({ fridgeId, products }: Props) {
  const sortedProducts = products.toSorted((a, b) => {
    const aIsSoldOut = a.status === 'SOLD_OUT';
    const bIsSoldOut = b.status === 'SOLD_OUT';

    if (aIsSoldOut && !bIsSoldOut) return 1;
    if (!aIsSoldOut && bIsSoldOut) return -1;

    return a.name.localeCompare(b.name, 'ja');
  });

  const shouldReduceMotion = useReducedMotion();

  const dynamicSpring = {
    type: 'spring',
    stiffness: 85,
    damping: 14,
    mass: 0.7,
  } as const;

  return (
    <LazyMotion features={domAnimation}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
        {sortedProducts.map((product) => (
          <m.div
            key={product.id}
            layout={!shouldReduceMotion}
            transition={shouldReduceMotion ? { duration: 0 } : dynamicSpring}
            initial={false}
            style={{
              zIndex: product.status === 'SOLD_OUT' ? 0 : 10,
            }}
          >
            <ProductCard fridgeId={fridgeId} product={product} />
          </m.div>
        ))}
      </div>
    </LazyMotion>
  );
}
