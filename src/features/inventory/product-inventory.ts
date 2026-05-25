import { prisma } from '@/lib/prisma';
import type { Product } from '@/types/inventory';
import { getProductStatusFromCount } from './counts';

export async function getInventoryProducts(
  fridgeId: string,
): Promise<Product[]> {
  const currentPublication = await prisma.inventoryPublication.findFirst({
    where: {
      fridgeId,
      uploadBatch: {
        is: {
          deletedAt: null,
        },
      },
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    select: {
      publishedAt: true,
      uploadBatch: {
        select: {
          lines: {
            orderBy: { lineNumber: 'asc' },
            include: {
              matchedProduct: {
                select: { id: true, name: true, category: true },
              },
            },
          },
        },
      },
    },
  });

  if (!currentPublication) return [];

  const visibleLines = currentPublication.uploadBatch.lines.filter(
    (line) => line.matchedProduct && line.count > 0,
  );

  if (visibleLines.length === 0) return [];

  const latestStatusChanges = await prisma.inventoryStatusChange.findMany({
    where: {
      fridgeId,
      productId: {
        in: visibleLines.flatMap((line) =>
          line.matchedProduct ? [line.matchedProduct.id] : [],
        ),
      },
    },
    orderBy: [{ changedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    include: {
      changedByUser: { select: { name: true } },
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
    if (!product) return [];

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
        lastPublishedAt: currentPublication.publishedAt.toISOString(),
      },
    ];
  });

  return products.sort((left, right) =>
    left.name.localeCompare(right.name, 'ja'),
  );
}
