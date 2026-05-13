'use server';

import { getProductStatusFromCount } from '@/features/inventory/counts';
import { prisma } from '@/lib/prisma';
import type { Product } from '@/types/inventory';

export async function getInventoryProducts(): Promise<Product[]> {
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

  return appliedBatch.lines
    .map((line) => {
      const product = line.matchedProduct;

      if (!product || line.count === 0) {
        return null;
      }

      return {
        id: product.id,
        name: product.name,
        count: line.count,
        status: getProductStatusFromCount(line.count),
        updatedAt,
      } satisfies Product;
    })
    .filter((product): product is Product => product !== null)
    .sort((left, right) => left.name.localeCompare(right.name, 'ja'));
}
