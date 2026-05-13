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
    const createdProductIds = new Map<string, string>();

    for (const product of reviewedProducts) {
      if (!batchLineIds.has(product.lineId)) {
        throw new Error('別の納品書行が混在しています。');
      }

      let matchedProductId = product.selectedProductId;

      if (!matchedProductId) {
        const normalizedProductName = normalizeProductName(product.name);
        const cachedProductId = createdProductIds.get(normalizedProductName);

        if (cachedProductId) {
          matchedProductId = cachedProductId;
        } else {
          const createdProduct = await createCatalogProduct(tx, product.name);
          matchedProductId = createdProduct.id;
          createdProductIds.set(normalizedProductName, createdProduct.id);
        }
      }

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
