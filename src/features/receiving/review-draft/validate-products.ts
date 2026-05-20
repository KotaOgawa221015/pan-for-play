import { ProductCategorySchema } from '@/features/product-catalog/category';
import { normalizeProductName } from '@/features/product-catalog/products';
import { z } from 'zod';
import type { ReviewInput } from '../types';

const ReviewProductSchema = z.object({
  lineId: z.string().min(1),
  name: z.string(),
  category: ProductCategorySchema,
  count: z.number(),
});

const ReviewProductsSchema = z
  .array(ReviewProductSchema)
  .min(1, { message: '納品書に商品がありません。' })
  .superRefine((products, ctx) => {
    const seenNames = new Set<string>();

    products.forEach((product, index) => {
      const name = normalizeProductName(product.name);

      if (!name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '商品名が空の行があります。',
          path: [index, 'name'],
        });
        return;
      }

      if (!Number.isInteger(product.count) || product.count <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `数量は 1 以上の整数である必要があります: ${name}`,
          path: [index, 'count'],
        });
      }

      if (!ProductCategorySchema.safeParse(product.category).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `カテゴリが不正です: ${name}`,
          path: [index, 'category'],
        });
      }

      if (seenNames.has(name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `同じ商品が複数回含まれています: ${name}`,
          path: [index, 'name'],
        });
      }

      seenNames.add(name);
    });
  });

export const ReviewInputSchema = z.object({
  batchId: z
    .string()
    .min(1, { message: 'レビュー対象を取得できませんでした。' }),
  products: z.array(ReviewProductSchema),
});

export function validateReviewProducts(products: ReviewInput['products']) {
  const parsed = ReviewProductsSchema.parse(products);

  return parsed.map((product) => ({
    lineId: product.lineId,
    name: normalizeProductName(product.name),
    category: product.category as ReviewInput['products'][number]['category'],
    count: product.count,
  }));
}
