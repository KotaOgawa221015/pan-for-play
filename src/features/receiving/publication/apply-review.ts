'use server';

import { revalidatePath } from 'next/cache';
import {
  createCatalogProduct,
  listCatalogProducts,
} from '@/features/product-catalog/products';
import { prisma } from '@/lib/prisma';
import type { ReviewInput } from '../types';
import { normalizeProductName } from '../review-draft/normalize-product-name';
import { validateReviewProducts } from '../review-draft/validate-products';
import { createInventoryPublication } from './create-publication';
import { adminAction } from '@/features/auth/safe-actions';

async function applyReceivingReviewInternal(
  admin: { id: string },
  input: ReviewInput,
) {
  const catalog = await listCatalogProducts();
  const reviewedProducts = validateReviewProducts(input.products);
  const catalogByName = new Map(
    catalog.map((product) => [normalizeProductName(product.name), product]),
  );
  const publishedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const [batch, currentPublication] = await Promise.all([
      tx.uploadBatch.findUnique({
        where: { id: input.batchId },
        include: {
          lines: {
            orderBy: { lineNumber: 'asc' },
          },
        },
      }),
      tx.inventoryPublication.findFirst({
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        include: {
          uploadBatch: {
            include: {
              lines: {
                select: {
                  count: true,
                  matchedProductId: true,
                },
              },
            },
          },
        },
      }),
    ]);

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

    await createInventoryPublication(tx, {
      uploadBatchId: batch.id,
      publishedByUserId: admin.id,
      publishedAt,
      previousLines:
        currentPublication?.uploadBatch.lines.flatMap((line) =>
          line.matchedProductId
            ? [
              {
                matchedProductId: line.matchedProductId,
                count: line.count,
              },
            ]
            : [],
        ) ?? [],
      nextLines: nextPublicationLines,
    });
  });

  revalidatePath('/');
  revalidatePath('/admin');
}
export const applyReceivingReview = adminAction(applyReceivingReviewInternal);
