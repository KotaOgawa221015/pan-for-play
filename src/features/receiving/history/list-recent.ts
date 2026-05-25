import { prisma } from '@/lib/prisma';
import type { HistoryEntry } from '../types';

export async function getRecentReceivingHistory(): Promise<HistoryEntry[]> {
  const [currentPublication, batches] = await Promise.all([
    prisma.inventoryPublication.findFirst({
      where: {
        uploadBatch: {
          is: {
            deletedAt: null,
          },
        },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      select: {
        uploadBatchId: true,
      },
    }),
    prisma.uploadBatch.findMany({
      where: {
        deletedAt: null,
      },
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
            fridge: {
              select: {
                name: true,
              },
            },
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

  return batches.map((batch) => {
    const appliedFridgeNames = [
      ...new Set(
        batch.inventoryPublications.map(
          (publication) => publication.fridge.name,
        ),
      ),
    ];

    return {
      id: batch.id,
      originalFileName: batch.originalFileName,
      createdAt: batch.createdAt.toISOString(),
      processedAt: batch.processedAt?.toISOString() ?? null,
      hasPublication: batch.inventoryPublications.length > 0,
      appliedFridgeNames,
      lastPublishedByName:
        batch.inventoryPublications[0]?.publishedByUser.name ?? null,
      isCurrent: currentPublication?.uploadBatchId === batch.id,
      lines: batch.lines.map((line) => ({
        id: line.id,
        name: line.rawText,
        count: line.count,
        matchedProductName: line.matchedProduct?.name ?? null,
      })),
    };
  });
}
