import { prisma } from '@/lib/prisma';

export async function storeReviewBatchSourceImage(input: {
  batchId: string;
  imageBuffer: Buffer;
  mimeType: string;
}) {
  await prisma.uploadBatch.update({
    where: { id: input.batchId },
    data: {
      sourceImageBytes: Uint8Array.from(input.imageBuffer),
      sourceImageMimeType: input.mimeType,
    },
  });
}
