import { prisma } from '@/lib/prisma';
import type { Product } from '@/types/inventory';

export async function getInventoryProducts(
  fridgeId: string,
): Promise<Product[]> {
  const currentInventories = await prisma.currentInventory.findMany({
    where: {
      fridgeId,
      isVisible: true,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
      lastChangedByUser: {
        select: {
          name: true,
        },
      },
    },
  });

  const products: Product[] = currentInventories.map((inventory) => ({
    id: inventory.product.id,
    name: inventory.product.name,
    category: inventory.product.category,
    count: inventory.count,
    status: inventory.status,
    lastStatusChangedAt: inventory.lastChangedAt?.toISOString() ?? null,
    lastStatusChangedByName: inventory.lastChangedByUser?.name ?? null,
    lastPublishedAt: inventory.lastPublishedAt.toISOString(),
  }));

  return products.sort((left, right) =>
    left.name.localeCompare(right.name, 'ja'),
  );
}
