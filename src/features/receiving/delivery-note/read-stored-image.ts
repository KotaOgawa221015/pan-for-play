import { prisma } from '@/lib/prisma';

export async function readStoredDeliveryNoteImage(batchId: string) {
  const batch = await prisma.uploadBatch.findUnique({
    where: { id: batchId },
    select: {
      sourceImageBytes: true,
      sourceImageMimeType: true,
    },
  });

  if (!batch?.sourceImageBytes || !batch.sourceImageMimeType) {
    return null;
  }

  return {
    imageBuffer: Buffer.from(batch.sourceImageBytes),
    mimeType: batch.sourceImageMimeType,
  };
}
