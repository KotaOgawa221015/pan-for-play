import { readFile } from 'node:fs/promises';
import { prisma } from '@/lib/prisma';

export async function readStoredDeliveryNoteImage(batchId: string) {
  const batch = await prisma.uploadBatch.findUnique({
    where: { id: batchId },
    select: {
      storagePath: true,
    },
  });

  if (!batch?.storagePath) {
    return null;
  }

  return readFile(batch.storagePath);
}
