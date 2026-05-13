import { prisma } from '@/lib/prisma';

export type CatalogProduct = {
  id: string;
  name: string;
};

type ProductCreator = {
  product: {
    create(args: { data: { name: string } }): Promise<CatalogProduct>;
  };
};

export async function listCatalogProducts(): Promise<CatalogProduct[]> {
  return prisma.product.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function createCatalogProduct(
  writer: ProductCreator,
  name: string,
): Promise<CatalogProduct> {
  return writer.product.create({
    data: {
      name,
    },
  });
}
