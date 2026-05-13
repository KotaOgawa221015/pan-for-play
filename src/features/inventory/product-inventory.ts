'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/features/auth/account-access';
import { prisma } from '@/lib/prisma';
import {
  isProductStatus,
  type Product,
  type ProductStatus,
} from '@/types/inventory';

export async function getInventoryProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    include: {
      inventoryChecks: {
        orderBy: { checkedAt: 'desc' },
        take: 1,
      },
    },
  });

  return products.map((product) => {
    const latestCheck = product.inventoryChecks[0];

    // 在庫確認データがない場合は、エラーを投げずにデフォルト値を返す
    if (!latestCheck) {
      return {
        id: product.id,
        name: product.name,
        status: 'SOLD_OUT' as ProductStatus, // デフォルト値
        updatedAt: product.createdAt.toISOString(),
      };
    }

    const status = latestCheck.status;

    if (!isProductStatus(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    return {
      id: product.id,
      name: product.name,
      status,
      updatedAt: latestCheck.checkedAt.toISOString(),
    };
  });
}

export async function updateProductStatus(
  productId: string,
  status: ProductStatus,
) {
  if (!isProductStatus(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('Authentication required.');
  }

  await prisma.inventoryCheck.create({
    data: {
      productId,
      checkedByUserId: userId,
      status,
      sourceType: 'MANUAL',
      checkedAt: new Date(),
    },
  });

  revalidatePath('/', 'layout');
}
