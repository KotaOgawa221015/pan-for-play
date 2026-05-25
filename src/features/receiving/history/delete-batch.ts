'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/features/account/auth';
import { requireAdminUser } from '@/features/account/session-user';
import { prisma } from '@/lib/prisma';

export async function deleteReceivingBatch(batchId: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  await requireAdminUser();

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const batch = await tx.uploadBatch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (!batch || batch.deletedAt) {
      throw new Error('対象の納品書履歴が存在しません。');
    }

    await tx.uploadBatch.update({
      where: { id: batch.id },
      data: {
        deletedAt: now,
      },
    });
  });

  revalidatePath('/admin');
}
