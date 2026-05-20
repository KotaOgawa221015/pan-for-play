import { ProductCategory } from '@prisma/client';
import { z } from 'zod';

export const ProductCategorySchema = z.nativeEnum(ProductCategory);

export const PRODUCT_CATEGORIES = Object.values(
  ProductCategory,
) as ProductCategory[];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.BREAD]: 'パン',
  [ProductCategory.SOUP]: 'スープ',
};

export function isProductCategory(value: string): value is ProductCategory {
  return ProductCategorySchema.safeParse(value).success;
}
