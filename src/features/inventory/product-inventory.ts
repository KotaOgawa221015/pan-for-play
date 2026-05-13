'use server';

import { requireCurrentUser } from '@/features/auth/account-access';
import { getProductStatusFromCount } from '@/features/inventory/counts';
import { prisma } from '@/lib/prisma';
import type { Product } from '@/types/inventory';

export async function getInventoryProducts(): Promise<Product[]> {
  await requireCurrentUser();
  const appliedBatch = await prisma.uploadBatch.findFirst({
    where: {
      processingStatus: 'APPLIED',
    },
    orderBy: {
      appliedAt: 'desc',
    },
    include: {
      lines: {
        orderBy: {
          lineNumber: 'asc',
        },
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
  });

  if (!appliedBatch) {
    return [];
  }

  const updatedAt =
    appliedBatch.appliedAt?.toISOString() ??
    appliedBatch.processedAt?.toISOString() ??
    appliedBatch.createdAt.toISOString();

  const products: Product[] = [];
  for (const line of appliedBatch.lines) {
    const product = line.matchedProduct;
    if (!product || line.count === 0) {
      continue;
    }

    products.push({
      id: product.id,
      name: product.name,
      category: product.category,
      count: line.count,
      status: getProductStatusFromCount(line.count),
      updatedAt,
    });
  }

  return products.sort((left, right) =>
    left.name.localeCompare(right.name, 'ja'),
  );
}
