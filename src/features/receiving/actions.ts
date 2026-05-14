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

type PublicationLine = {
  matchedProductId: string;
  count: number;
};

function getLineStatuses(lines: PublicationLine[]) {
  return new Map(
    lines.map((line) => [
      line.matchedProductId,
      getProductStatusFromCount(line.count),
    ]),
  );
}

function buildStatusChanges(input: {
  currentStatuses: Map<string, ReturnType<typeof getProductStatusFromCount>>;
  nextLines: PublicationLine[];
  changedByUserId: string;
  changedAt: Date;
}): Array<{
  productId: string;
  changedByUserId: string;
  previousStatus: ReturnType<typeof getProductStatusFromCount> | null;
  nextStatus: ReturnType<typeof getProductStatusFromCount>;
  changedAt: Date;
}> {
  const nextStatuses = getLineStatuses(input.nextLines);

  return [...nextStatuses.keys()].flatMap((productId) => {
    const previousStatus = input.currentStatuses.get(productId) ?? null;
    const nextStatus = nextStatuses.get(productId);

    if (!nextStatus) {
      return [];
    }

    if (previousStatus === nextStatus) {
      return [];
    }

    return [
      {
        productId,
        changedByUserId: input.changedByUserId,
        previousStatus,
        nextStatus,
        changedAt: input.changedAt,
      },
    ];
  });
}

async function createInventoryPublication(
  tx: {
    inventoryPublication: {
      create(args: {
        data: {
          uploadBatchId: string;
          publishedByUserId: string;
          publishedAt: Date;
        };
      }): Promise<{ id: string }>;
    };
    inventoryStatusChange: {
      findMany(args: {
        where: {
          productId: {
            in: string[];
          };
        };
        orderBy: Array<
          | { changedAt: 'asc' | 'desc' }
          | { createdAt: 'asc' | 'desc' }
          | { id: 'asc' | 'desc' }
        >;
        select: {
          productId: true;
          nextStatus: true;
        };
      }): Promise<
        Array<{
          productId: string;
          nextStatus: ReturnType<typeof getProductStatusFromCount>;
        }>
      >;
      create(args: {
        data: {
          publicationId: string;
          productId: string;
          changedByUserId: string;
          previousStatus: ReturnType<typeof getProductStatusFromCount> | null;
          nextStatus: ReturnType<typeof getProductStatusFromCount>;
          changedAt: Date;
        };
      }): Promise<unknown>;
    };
  },
  input: {
    uploadBatchId: string;
    publishedByUserId: string;
    publishedAt: Date;
    previousLines: PublicationLine[];
    nextLines: PublicationLine[];
  },
) {
  const publication = await tx.inventoryPublication.create({
    data: {
      uploadBatchId: input.uploadBatchId,
      publishedByUserId: input.publishedByUserId,
      publishedAt: input.publishedAt,
    },
  });

  const previousPublishedStatuses = getLineStatuses(input.previousLines);
  const productIds = [
    ...new Set(input.nextLines.map((line) => line.matchedProductId)),
  ];
  const latestStatusChanges = productIds.length
    ? await tx.inventoryStatusChange.findMany({
        where: {
          productId: {
            in: productIds,
          },
        },
        orderBy: [{ changedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        select: {
          productId: true,
          nextStatus: true,
        },
      })
    : [];

  const currentStatuses = new Map(previousPublishedStatuses);
  const changedProductIds = new Set<string>();
  for (const change of latestStatusChanges) {
    if (
      !previousPublishedStatuses.has(change.productId) ||
      changedProductIds.has(change.productId)
    ) {
      continue;
    }

    currentStatuses.set(change.productId, change.nextStatus);
    changedProductIds.add(change.productId);
  }

  const statusChanges = buildStatusChanges({
    currentStatuses,
    nextLines: input.nextLines,
    changedByUserId: input.publishedByUserId,
    changedAt: input.publishedAt,
  });

  await Promise.all(
    statusChanges.map((change) =>
      tx.inventoryStatusChange.create({
        data: {
          publicationId: publication.id,
          productId: change.productId,
          changedByUserId: change.changedByUserId,
          previousStatus: change.previousStatus,
          nextStatus: change.nextStatus,
          changedAt: change.changedAt,
        },
      }),
    ),
  );
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
  const currentUserId = await requireCurrentUserId();
  const catalog = await listCatalogProducts();
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

    const nextPublicationLines: PublicationLine[] = [];

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

export async function reapplyReceivingBatch(batchId: string) {
  const currentUserId = await requireCurrentUserId();
  const publishedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const [batch, currentPublication] = await Promise.all([
      tx.uploadBatch.findUnique({
        where: { id: batchId },
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
      throw new Error('公開できるのはレビュー済みの納品書だけです。');
    }

    if (currentPublication?.uploadBatchId === batch.id) {
      throw new Error('この納品書はすでに現在の在庫として公開されています。');
    }

    for (const line of batch.lines) {
      if (!line.matchedProductId) {
        throw new Error('紐付けが未確定の行があるため再適用できません。');
      }
    }

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
      nextLines: batch.lines.flatMap((line) =>
        line.matchedProductId
          ? [
              {
                matchedProductId: line.matchedProductId,
                count: line.count,
              },
            ]
          : [],
      ),
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
      include: {
        _count: {
          select: {
            inventoryPublications: true,
          },
        },
      },
    });

    if (!batch) {
      throw new Error('対象の納品書履歴が存在しません。');
    }

    if (batch._count.inventoryPublications > 0) {
      throw new Error('公開履歴から参照されている納品書は削除できません。');
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
