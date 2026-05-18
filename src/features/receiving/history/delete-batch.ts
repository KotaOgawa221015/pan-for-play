'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/features/auth/auth';
import { requireAdminUser } from '@/features/auth/session-user';
import { prisma } from '@/lib/prisma';

export async function deleteReceivingBatch(batchId: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  await requireAdminUser();

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
