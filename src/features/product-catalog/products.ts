import type { ProductCategory } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type CatalogProduct = {
  id: string;
  name: string;
  category: ProductCategory;
};

type ProductCreator = {
  product: {
    create(args: {
      data: { name: string; category: ProductCategory };
    }): Promise<CatalogProduct>;
  };
};

export async function listCatalogProducts(): Promise<CatalogProduct[]> {
  return prisma.product.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      category: true,
    },
  });
}

export async function createCatalogProduct(
  writer: ProductCreator,
  name: string,
  category: ProductCategory,
): Promise<CatalogProduct> {
  return writer.product.create({
    data: {
      name,
      category,
    },
  });
}
