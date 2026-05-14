'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminUser } from '@/features/auth/account-access';
import { getProductStatusFromCount } from '@/features/inventory/counts';
import { extractProductsFromMock } from '@/features/product-list-extraction/mock';
import {
  createCatalogProduct,
  listCatalogProducts,
} from '@/features/product-catalog/products';
import { prisma } from '@/lib/prisma';
import { createReviewBatch } from './records';
import {
  prepareReviewDraft,
  normalizeProductName,
  validateReviewProducts,
} from './review';
import type { ReviewInput } from './types';

async function requireCurrentUserId() {
  return (await requireAdminUser()).id;
}

export async function startReceivingReview(fileName: string) {
  await requireCurrentUserId();
  const draft = await prepareReviewDraft(fileName, {
    getCurrentUserId: requireCurrentUserId,
    extractProducts: extractProductsFromMock,
    listCatalogProducts,
  });

  const persistedDraft = await createReviewBatch(draft);

  revalidatePath('/admin');

  return persistedDraft;
}

export async function applyReceivingReview(input: ReviewInput) {
  await requireCurrentUserId();
  const catalog = await listCatalogProducts();
  const reviewedProducts = validateReviewProducts(input.products, catalog);
  const catalogById = new Map(catalog.map((product) => [product.id, product]));
  const appliedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const batch = await tx.uploadBatch.findUnique({
      where: { id: input.batchId },
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

    await tx.uploadBatch.updateMany({
      where: {
        processingStatus: 'APPLIED',
      },
      data: {
        processingStatus: 'REVERTED',
        revertedAt: appliedAt,
      },
    });

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

      const status = getProductStatusFromCount(product.count);

      await tx.uploadBatchLine.update({
        where: { id: product.lineId },
        data: {
          rawText: product.name,
          count: product.count,
          matchedProductId,
          matchStatus: 'MATCHED',
          appliedStatus: status,
        },
      });
    });

    await Promise.all([
      Promise.all(productCategoryUpdates),
      Promise.all(batchLineUpdates),
    ]);

    await tx.uploadBatch.update({
      where: { id: batch.id },
      data: {
        processingStatus: 'APPLIED',
        appliedAt,
        revertedAt: null,
      },
    });
  });

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function reapplyReceivingBatch(batchId: string) {
  await requireCurrentUserId();
  const appliedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const batch = await tx.uploadBatch.findUnique({
      where: { id: batchId },
      include: {
        lines: {
          orderBy: { lineNumber: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new Error('対象の納品書履歴が存在しません。');
    }

    if (batch.processingStatus !== 'REVERTED') {
      throw new Error(
        '入れ替えできるのは過去の反映として残っている納品書だけです。',
      );
    }

    await tx.uploadBatch.updateMany({
      where: {
        processingStatus: 'APPLIED',
      },
      data: {
        processingStatus: 'REVERTED',
        revertedAt: appliedAt,
      },
    });

    for (const line of batch.lines) {
      if (!line.matchedProductId) {
        throw new Error('紐付けが未確定の行があるため再適用できません。');
      }
    }

    await tx.uploadBatch.update({
      where: { id: batch.id },
      data: {
        processingStatus: 'APPLIED',
        appliedAt,
        revertedAt: null,
      },
    });
  });

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function deleteReceivingBatch(batchId: string) {
  await requireCurrentUserId();

  await prisma.$transaction(async (tx) => {
    const batch = await tx.uploadBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error('対象の納品書履歴が存在しません。');
    }

    if (batch.processingStatus === 'APPLIED') {
      throw new Error(
        '現在反映中の納品書は削除できません。別の納品書を適用してください。',
      );
    }

    await tx.uploadBatchLine.deleteMany({
      where: { uploadBatchId: batch.id },
    });
    await tx.uploadBatch.delete({
      where: { id: batch.id },
    });
  });

  revalidatePath('/admin');
}
