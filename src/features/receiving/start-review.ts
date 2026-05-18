'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/features/auth/auth';
import { requireAdminUser } from '@/features/auth/session-user';
import { listCatalogProducts } from '@/features/product-catalog/products';
import { extractProductsFromDeliveryNote } from './delivery-note/extract-products';
import { readDeliveryNoteUpload } from './delivery-note/read-upload';
import { storeDeliveryNoteImage } from './delivery-note/store-image';
import { UnreadableDeliveryNoteImageError } from './delivery-note/unreadable-image-error';
import { completeReviewBatch } from './review-draft/complete-batch';
import { createPendingReviewBatch } from './review-draft/create-pending-batch';
import { failReviewBatch } from './review-draft/fail-batch';
import { prepareReviewDraft } from './review-draft/prepare';
import { storeReviewBatchImagePath } from './review-draft/store-image-path';

export async function startReceivingReview(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  const currentUserId = (await requireAdminUser()).id;
  const uploadedDeliveryNote = await readDeliveryNoteUpload(formData);
  const batch = await createPendingReviewBatch({
    userId: currentUserId,
    fileName: uploadedDeliveryNote.fileName,
  });

  try {
    const storagePath = await storeDeliveryNoteImage({
      batchId: batch.id,
      fileName: batch.originalFileName,
      imageBuffer: uploadedDeliveryNote.imageBuffer,
    });
    await storeReviewBatchImagePath(batch.id, storagePath);

    const draft = await prepareReviewDraft(
      {
        fileName: batch.originalFileName,
        imageBuffer: uploadedDeliveryNote.imageBuffer,
      },
      {
        getCurrentUserId: async () => currentUserId,
        extractProducts: extractProductsFromDeliveryNote,
        listCatalogProducts,
      },
    );

    const persistedDraft = await completeReviewBatch({
      batchId: batch.id,
      originalFileName: batch.originalFileName,
      sourceImageUrl: `/admin/receiving-images/${batch.id}`,
      processedAt: draft.processedAt,
      catalog: draft.catalog,
      lines: draft.lines,
    });

    revalidatePath('/admin');

    return persistedDraft;
  } catch (error) {
    await failReviewBatch(batch.id);
    revalidatePath('/admin');

    if (error instanceof UnreadableDeliveryNoteImageError) {
      console.error('Failed to read delivery note image:', error);
      throw new Error(error.userMessage);
    }

    throw error;
  }
}
