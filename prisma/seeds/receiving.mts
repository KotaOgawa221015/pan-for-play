import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PrismaClient, Product, User } from '@prisma/client';

const fixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../fixtures/receiving-history.json',
);
const receivingHistoryFixture: {
  batches: Array<{
    originalFileName: string;
    processedMinutesAgo: number | null;
    publishedMinutesAgo: number | null;
    products: Array<{ name: string; count: number }>;
  }>;
} = JSON.parse(readFileSync(fixturePath, 'utf8'));

export type PublicationLine = {
  productId: string;
  count: number;
};

export type PublicationSeed = {
  batchId: string;
  publishedAt: Date;
  publicationLines: PublicationLine[];
};

function minutesAgo(now: Date, minutes: number | null | undefined) {
  if (minutes === null || minutes === undefined) return null;
  return new Date(now.getTime() - minutes * 60000);
}

export async function seedReceivingHistory(
  prisma: PrismaClient,
  adminUser: User,
  productByName: Map<string, Product>,
): Promise<PublicationSeed[]> {
  const now = new Date();
  const publications: PublicationSeed[] = [];

  for (const history of receivingHistoryFixture.batches) {
    const processedAt = minutesAgo(now, history.processedMinutesAgo);

    const batch = await prisma.uploadBatch.create({
      data: {
        uploadedByUserId: adminUser.id,
        originalFileName: history.originalFileName,
        storagePath: null,
        processingStatus: 'PROCESSED',
        processedAt,
      },
    });

    const publicationLines: PublicationLine[] = [];

    for (const [index, product] of history.products.entries()) {
      const matchedProduct = productByName.get(product.name);

      if (!matchedProduct) {
        throw new Error(
          `Seed receiving product is missing from catalog: ${product.name}`,
        );
      }

      await prisma.uploadBatchLine.create({
        data: {
          uploadBatchId: batch.id,
          lineNumber: index + 1,
          rawText: product.name,
          count: product.count,
          matchedProductId: matchedProduct.id,
          matchStatus: 'MATCHED',
        },
      });

      publicationLines.push({
        productId: matchedProduct.id,
        count: product.count,
      });
    }

    const publishedAt = minutesAgo(now, history.publishedMinutesAgo);
    if (!publishedAt) {
      throw new Error(
        `Seed receiving publication time is required: ${history.originalFileName}`,
      );
    }

    publications.push({
      batchId: batch.id,
      publishedAt,
      publicationLines,
    });
  }

  publications.sort(
    (left, right) => left.publishedAt.getTime() - right.publishedAt.getTime(),
  );

  return publications;
}
