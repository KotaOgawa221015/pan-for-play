import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type PrismaClient,
  type Product,
  ProductCategory,
} from '@prisma/client';

const fixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../fixtures/catalog-products.json',
);
const catalogFixture: { products: Array<{ name: string; category: string }> } =
  JSON.parse(readFileSync(fixturePath, 'utf8'));

const productCategories = new Set(Object.values(ProductCategory));

function isProductCategory(value: string): value is ProductCategory {
  return productCategories.has(value as ProductCategory);
}

export async function seedProductsData(
  prisma: PrismaClient,
): Promise<Map<string, Product>> {
  const products = await Promise.all(
    catalogFixture.products.map((product) => {
      if (!product.name) throw new Error('Seed product name is required.');
      if (!isProductCategory(product.category)) {
        throw new Error(`Seed product category is invalid: ${product.name}`);
      }

      const category = product.category;

      return prisma.product.create({
        data: {
          name: product.name,
          category,
          isActive: true,
        },
      });
    }),
  );

  return new Map(products.map((product) => [product.name, product]));
}
