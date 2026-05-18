import type { CatalogProduct } from '@/features/product-catalog/products';
import { prisma } from '@/lib/prisma';
import type { ReviewDraft, ReviewLine } from '../types';
import { normalizeProductName } from './normalize-product-name';

type DraftLineInput = Omit<ReviewLine, 'lineId'>;

export async function completeReviewBatch(input: {
  batchId: string;
  originalFileName: string;
  processedAt: Date;
  catalog: CatalogProduct[];
  lines: DraftLineInput[];
}): Promise<ReviewDraft> {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.uploadBatch.findUnique({
      where: { id: input.batchId },
      select: {
        id: true,
        originalFileName: true,
        processingStatus: true,
      },
    });

    if (!batch) {
      throw new Error('レビュー対象の納品書履歴が存在しません。');
    }

    if (batch.processingStatus !== 'PENDING') {
      throw new Error('未処理の納品書だけをレビュー作成できます。');
    }

    const catalogByName = new Map(
      input.catalog.map((product) => [
        normalizeProductName(product.name),
        product,
      ]),
    );
    const createdLines = await Promise.all(
      input.lines.map((line, index) => {
        const matchedProduct =
          catalogByName.get(normalizeProductName(line.name)) ?? null;

        return tx.uploadBatchLine.create({
          data: {
            uploadBatchId: input.batchId,
            lineNumber: index + 1,
            rawText: line.name,
            count: line.count,
            matchedProductId: matchedProduct?.id ?? null,
            matchStatus: matchedProduct ? 'MATCHED' : 'NEEDS_REVIEW',
          },
        });
      }),
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
        };
      });

    await tx.uploadBatch.update({
      where: { id: input.batchId },
      data: {
        processingStatus: 'PROCESSED',
        processedAt: input.processedAt,
      },
    });

    return {
      batchId: input.batchId,
      originalFileName: input.originalFileName,
      processedAt: input.processedAt.toISOString(),
      catalog: input.catalog,
      products,
    };
  });
}
