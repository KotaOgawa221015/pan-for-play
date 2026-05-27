import { prisma } from '@/lib/prisma';
import { deleteExpiredFridges } from './fridges';
import { deleteExpiredStatusChanges } from './status-changes';
import { deleteExpiredUploadBatches } from './upload-batches';
import { deleteExpiredUsers } from './users';

const RETENTION_DAYS = 30;
const BATCH_LIMIT = 200;

export type CleanupResult = {
  cutoff: string;
  deletedStatusChanges: number;
  deletedFridges: number;
  deletedUsers: number;
  deletedUploadBatches: number;
};

function resolveCutoff(inputNow: Date) {
  return new Date(inputNow.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

export async function runRetentionCleanup(): Promise<CleanupResult> {
  const cutoff = resolveCutoff(new Date());

  const result = await prisma.$transaction(async (tx) => {
    const deletedStatusChanges = await deleteExpiredStatusChanges({
      tx,
      cutoff,
      batchLimit: BATCH_LIMIT,
    });

    const deletedFridges = await deleteExpiredFridges({
      tx,
      cutoff,
      batchLimit: BATCH_LIMIT,
    });
    const deletedUsers = await deleteExpiredUsers({
      tx,
      cutoff,
      batchLimit: BATCH_LIMIT,
    });

    const deletedUploadBatches = await deleteExpiredUploadBatches({
      tx,
      cutoff,
      batchLimit: BATCH_LIMIT,
    });

    return {
      deletedStatusChanges,
      deletedFridges,
      deletedUsers,
      deletedUploadBatches,
    };
  });

  return {
    cutoff: cutoff.toISOString(),
    ...result,
  };
}
