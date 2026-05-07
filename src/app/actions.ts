'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  isItemCategory,
  isItemStatus,
  type InventoryItem,
  type ItemStatus,
} from '@/types/inventory';

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const items = await prisma.item.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  return items.map((item) => {
    const category = item.category;
    const status = item.status;

    if (!isItemCategory(category)) {
      throw new Error(`Invalid category: ${category}`);
    }

    if (!isItemStatus(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    return {
      id: item.id,
      name: item.name,
      category,
      status,
      updatedAt: item.updatedAt.toISOString(),
    };
  });
}

export async function updateItemStatus(itemId: string, status: ItemStatus) {
  if (!isItemStatus(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  await prisma.item.update({
    where: { id: itemId },
    data: { status },
  });

  revalidatePath('/');
}
