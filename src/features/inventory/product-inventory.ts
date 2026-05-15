'use server';

import { prisma } from '@/lib/prisma';
import { getProductStatusFromCount } from './counts';
import type { Product } from '@/types/inventory';

export async function getInventoryProducts(): Promise<Product[]> {

  const currentPublication = await prisma.inventoryPublication.findFirst({
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    include: {
      uploadBatch: {
        include: {
          lines: {
            orderBy: { lineNumber: 'asc' },
            include: {
              matchedProduct: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!currentPublication) {
    return [];
  }

  const visibleLines = currentPublication.uploadBatch.lines.filter(
    (line) => line.matchedProduct && line.count > 0,
  );

  if (visibleLines.length === 0) {
    return [];
  }

  const latestStatusChanges = await prisma.inventoryStatusChange.findMany({
    where: {
      productId: {
        in: visibleLines.flatMap((line) =>
          line.matchedProduct ? [line.matchedProduct.id] : [],
        ),
      },
    },
    orderBy: [{ changedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    include: {
      changedByUser: {
        select: {
          name: true,
        },
      },
    },
  });

  const latestChangeByProductId = new Map();
  for (const change of latestStatusChanges) {
    if (!latestChangeByProductId.has(change.productId)) {
      latestChangeByProductId.set(change.productId, change);
    }
  }

  const products: Product[] = visibleLines.flatMap((line) => {
    const product = line.matchedProduct;

    if (!product) {
      return [];
    }

    const latestChange = latestChangeByProductId.get(product.id);

    return [
      {
        id: product.id,
        name: product.name,
        category: product.category,
        count: line.count,
        status:
          latestChange?.nextStatus ?? getProductStatusFromCount(line.count),
        lastStatusChangedAt: latestChange?.changedAt.toISOString() ?? null,
        lastStatusChangedByName: latestChange?.changedByUser.name ?? null,
      },
    ];
  });

  return products.sort((left, right) =>
    left.name.localeCompare(right.name, 'ja'),
  );
}
