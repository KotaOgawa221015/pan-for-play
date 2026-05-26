'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/features/account/auth';
import { requireAdminUser } from '@/features/account/session-user';
import { listCatalogProducts } from '@/features/product-catalog/products';
import { extractProductsFromDeliveryNote } from './delivery-note/extract-products';
import { readDeliveryNoteUpload } from './delivery-note/read-upload';
import { UnreadableDeliveryNoteImageError } from './delivery-note/unreadable-image-error';
import { completeReviewBatch } from './review-draft/complete-batch';
import { createPendingReviewBatch } from './review-draft/create-pending-batch';
import { failReviewBatch } from './review-draft/fail-batch';
import { prepareReviewDraft } from './review-draft/prepare';
import { storeReviewBatchSourceImage } from './review-draft/store-source-image';
import type { ReviewDraft } from './types';

export type StartReceivingReviewResult =
  | { ok: true; draft: ReviewDraft }
  | { ok: false; error: string };

export async function startReceivingReview(
  formData: FormData,
): Promise<StartReceivingReviewResult> {
  try {
    const draft = await runReceivingReviewStart(formData);
    return { ok: true, draft };
  } catch (error) {
    console.error('Failed to start receiving review:', error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : '納品書の読み取りに失敗しました。',
    };
  }
}

async function runReceivingReviewStart(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  const currentUserId = (await requireAdminUser()).id;

  const fridgeId = formData.get('fridgeId');
  if (typeof fridgeId !== 'string' || !fridgeId.trim()) {
    throw new Error('対象の冷蔵庫が選択されていません。');
  }

  const uploadedDeliveryNote = await readDeliveryNoteUpload(formData);
  const batch = await createPendingReviewBatch({
    userId: currentUserId,
    fridgeId,
    fileName: uploadedDeliveryNote.fileName,
  });

  try {
    await storeReviewBatchSourceImage({
      batchId: batch.id,
      imageBuffer: uploadedDeliveryNote.imageBuffer,
      mimeType: uploadedDeliveryNote.mimeType,
    });

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
    try {
      await failReviewBatch(batch.id);
    } catch (cleanupError) {
      console.error('Failed to roll back review batch after read error:', {
        batchId: batch.id,
        cleanupError,
      });
    }

    revalidatePath('/admin');

    if (error instanceof UnreadableDeliveryNoteImageError) {
      console.error('Failed to read delivery note image:', error);
      throw new Error(error.userMessage);
    }

    throw error;
  }
}
