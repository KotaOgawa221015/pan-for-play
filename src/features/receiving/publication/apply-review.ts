'use server';

import { revalidatePath } from 'next/cache';
import { adminAction } from '@/features/account/session-user';
import { publishInventorySnapshot } from '@/features/inventory/publication';
import {
  createCatalogProduct,
  listCatalogProducts,
  normalizeProductName,
} from '@/features/product-catalog/products';
import { prisma } from '@/lib/prisma';
import {
  ReviewInputSchema,
  validateReviewProducts,
} from '../review-draft/validate-products';
import type { ReviewInput } from '../types';

async function applyReceivingReviewInternal(
  admin: { id: string },
  input: ReviewInput,
) {
  const parsedInput = ReviewInputSchema.parse(input);
  const catalog = await listCatalogProducts();
  const reviewedProducts = validateReviewProducts(parsedInput.products);
  const catalogByName = new Map(
    catalog.map((product) => [normalizeProductName(product.name), product]),
  );
  const publishedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const batch = await tx.uploadBatch.findUnique({
      where: { id: parsedInput.batchId },
      include: {
        lines: {
          orderBy: { lineNumber: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new Error('対象の納品書履歴が存在しません。');
    }

    if (batch.processingStatus !== 'PROCESSED') {
      throw new Error('レビュー待ちの納品書だけを適用できます。');
    }

    const batchLineIds = new Set(batch.lines.map((line) => line.id));
    const missingLine = reviewedProducts.find(
      (product) => !batchLineIds.has(product.lineId),
    );
    if (missingLine) {
      throw new Error('別の納品書行が混在しています。');
    }

    const newProductByNormalizedName = new Map<
      string,
      { name: string; category: (typeof reviewedProducts)[number]['category'] }
    >();
    for (const product of reviewedProducts) {
      const normalizedProductName = normalizeProductName(product.name);

      if (catalogByName.has(normalizedProductName)) {
        continue;
      }

      const existing = newProductByNormalizedName.get(normalizedProductName);

      if (existing && existing.category !== product.category) {
        throw new Error(`同名の商品でカテゴリが一致しません: ${product.name}`);
      }

      if (!existing) {
        newProductByNormalizedName.set(normalizedProductName, {
          name: product.name,
          category: product.category,
        });
      }
    }

    const createdProducts = await Promise.all(
      [...newProductByNormalizedName.values()].map((product) =>
        createCatalogProduct(tx, product.name, product.category),
      ),
    );

    const createdProductIdByNormalizedName = new Map<string, string>();
    for (const createdProduct of createdProducts) {
      createdProductIdByNormalizedName.set(
        normalizeProductName(createdProduct.name),
        createdProduct.id,
      );
    }

    const nextPublicationLines: Array<{
      matchedProductId: string;
      count: number;
    }> = [];

    const productCategoryUpdates = reviewedProducts.map(async (product) => {
      const existingProduct = catalogByName.get(
        normalizeProductName(product.name),
      );

      if (!existingProduct || existingProduct.category === product.category) {
        return;
      }

      await tx.product.update({
        where: { id: existingProduct.id },
        data: { category: product.category },
      });
    });

    const batchLineUpdates = reviewedProducts.map(async (product) => {
      const existingProduct = catalogByName.get(
        normalizeProductName(product.name),
      );
      const matchedProductId =
        existingProduct?.id ??
        createdProductIdByNormalizedName.get(
          normalizeProductName(product.name),
        );

      if (!matchedProductId) {
        throw new Error(`商品の紐付けに失敗しました: ${product.name}`);
      }

      nextPublicationLines.push({
        matchedProductId,
        count: product.count,
      });

      await tx.uploadBatchLine.update({
        where: { id: product.lineId },
        data: {
          rawText: product.name,
          count: product.count,
          matchedProductId,
          matchStatus: 'MATCHED',
        },
      });
    });

    await Promise.all([
      Promise.all(productCategoryUpdates),
      Promise.all(batchLineUpdates),
    ]);

    await publishInventorySnapshot(tx, {
      fridgeId: batch.fridgeId,
      uploadBatchId: batch.id,
      publishedByUserId: admin.id,
      publishedAt,
      lines: nextPublicationLines.map((line) => ({
        productId: line.matchedProductId,
        count: line.count,
      })),
    });
  });

  revalidatePath('/');
  revalidatePath('/admin');
}
export const applyReceivingReview = adminAction(applyReceivingReviewInternal);
