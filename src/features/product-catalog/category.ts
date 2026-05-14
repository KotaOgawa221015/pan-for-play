import { ProductCategory } from '@prisma/client';

export const PRODUCT_CATEGORIES = Object.values(
  ProductCategory,
) as ProductCategory[];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.BREAD]: 'パン',
  [ProductCategory.SOUP]: 'スープ',
};

export function isProductCategory(value: string): value is ProductCategory {
  return PRODUCT_CATEGORIES.includes(value as ProductCategory);
}
