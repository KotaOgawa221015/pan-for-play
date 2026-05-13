'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  isProductStatus,
  type Product,
  type ProductStatus,
} from '@/types/inventory';

export async function getInventoryProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
  });

  return products.map((product) => {
    const status = product.status;

    if (!isProductStatus(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    return {
      id: product.id,
      name: product.name,
      status,
      updatedAt: product.updatedAt.toISOString(),
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

  await prisma.product.update({
    where: { id: productId },
    data: { status },
  });

  revalidatePath('/', 'layout');
}
