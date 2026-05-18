'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/features/auth/auth';
import { requireAdminUser } from '@/features/auth/account-access';
import {
  createCatalogProduct,
  listCatalogProducts,
} from '@/features/product-catalog/products';
import { prisma } from '@/lib/prisma';
import type { ReviewInput } from '../types';
import { normalizeProductName } from '../review-draft/normalize-product-name';
import { validateReviewProducts } from '../review-draft/validate-products';
import { createInventoryPublication } from './create-publication';

export async function applyReceivingReview(input: ReviewInput) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  const [currentUserId, catalog] = await Promise.all([
    requireAdminUser().then((user) => user.id),
    listCatalogProducts(),
  ]);
  const reviewedProducts = validateReviewProducts(input.products, catalog);

  const catalogById = new Map(catalog.map((product) => [product.id, product]));
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
      if (product.selectedProductId) {
        continue;
      }
      const normalizedProductName = normalizeProductName(product.name);
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
      if (!product.selectedProductId) {
        return;
      }

      const selectedProduct = catalogById.get(product.selectedProductId);

      if (!selectedProduct) {
        throw new Error(`選択された商品が存在しません: ${product.name}`);
      }

      if (selectedProduct.category === product.category) {
        return;
      }

      await tx.product.update({
        where: { id: selectedProduct.id },
        data: { category: product.category },
      });
    });

    const batchLineUpdates = reviewedProducts.map(async (product) => {
      const matchedProductId =
        product.selectedProductId ??
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
      publishedByUserId: currentUserId,
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
