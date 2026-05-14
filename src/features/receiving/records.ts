import { prisma } from '@/lib/prisma';
import type { CatalogProduct } from '@/features/product-catalog/products';
import type { HistoryEntry, ReviewDraft, ReviewLine } from './types';

type DraftLineInput = Omit<ReviewLine, 'lineId'>;

export async function createReviewBatch(input: {
  userId: string;
  fileName: string;
  processedAt: Date;
  catalog: CatalogProduct[];
  lines: DraftLineInput[];
}): Promise<ReviewDraft> {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.uploadBatch.create({
      data: {
        uploadedByUserId: input.userId,
        originalFileName: input.fileName,
        storagePath: null,
        processingStatus: 'PENDING',
      },
    });

    const createdLines = await Promise.all(
      input.lines.map((line, index) =>
        tx.uploadBatchLine.create({
          data: {
            uploadBatchId: batch.id,
            lineNumber: index + 1,
            rawText: line.name,
            count: line.count,
            matchedProductId: line.selectedProductId,
            matchStatus: line.matchStatus,
          },
        }),
      ),
    );

    const categoryByLineNumber = new Map(
      input.lines.map((line, index) => [index + 1, line.category]),
    );

    const products: ReviewLine[] = createdLines
      .toSorted((left, right) => left.lineNumber - right.lineNumber)
      .map((createdLine) => {
        const category = categoryByLineNumber.get(createdLine.lineNumber);

        if (!category) {
          throw new Error('レビュー行のカテゴリを取得できませんでした。');
        }

        return {
          lineId: createdLine.id,
          name: createdLine.rawText,
          category,
          count: createdLine.count,
          selectedProductId: createdLine.matchedProductId,
          matchStatus: createdLine.matchStatus,
        };
      });

    await tx.uploadBatch.update({
      where: { id: batch.id },
      data: {
        processingStatus: 'PROCESSED',
        processedAt: input.processedAt,
      },
    });

    return {
      batchId: batch.id,
      originalFileName: batch.originalFileName,
      processedAt: input.processedAt.toISOString(),
      catalog: input.catalog,
      products,
    };
  });
}

export async function getRecentReceivingHistory(): Promise<HistoryEntry[]> {
  const [currentPublication, batches] = await Promise.all([
    prisma.inventoryPublication.findFirst({
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      select: {
        uploadBatchId: true,
      },
    }),
    prisma.uploadBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        lines: {
          orderBy: { lineNumber: 'asc' },
          include: {
            matchedProduct: {
              select: {
                name: true,
              },
            },
          },
        },
        inventoryPublications: {
          orderBy: [
            { publishedAt: 'desc' },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
          include: {
            publishedByUser: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return batches.map((batch) => ({
    id: batch.id,
    originalFileName: batch.originalFileName,
    processingStatus: batch.processingStatus,
    createdAt: batch.createdAt.toISOString(),
    processedAt: batch.processedAt?.toISOString() ?? null,
    lineCount: batch.lines.length,
    publicationCount: batch.inventoryPublications.length,
    lastPublishedAt:
      batch.inventoryPublications[0]?.publishedAt.toISOString() ?? null,
    lastPublishedByName:
      batch.inventoryPublications[0]?.publishedByUser.name ?? null,
    isCurrent: currentPublication?.uploadBatchId === batch.id,
    lines: batch.lines.map((line) => ({
      id: line.id,
      name: line.rawText,
      count: line.count,
      matchedProductName: line.matchedProduct?.name ?? null,
    })),
  }));
}
