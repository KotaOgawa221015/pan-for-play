import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  transaction,
  uploadBatchCreate,
  uploadBatchUpdate,
  uploadBatchFindFirst,
  uploadBatchFindUnique,
  uploadBatchDelete,
  uploadBatchLineCreate,
  uploadBatchLineUpdate,
  uploadBatchLineDeleteMany,
  revalidatePath,
  requireAdminUser,
  listCatalogProducts,
  normalizeProductName,
  extractProductsFromDeliveryNote,
  readDeliveryNoteUpload,
  storeReviewBatchSourceImage,
  auth,
} = vi.hoisted(() => ({
  transaction: vi.fn(),
  uploadBatchCreate: vi.fn(),
  uploadBatchUpdate: vi.fn(),
  uploadBatchFindFirst: vi.fn(),
  uploadBatchFindUnique: vi.fn(),
  uploadBatchDelete: vi.fn(),
  uploadBatchLineCreate: vi.fn(),
  uploadBatchLineUpdate: vi.fn(),
  uploadBatchLineDeleteMany: vi.fn(),
  revalidatePath: vi.fn(),
  requireAdminUser: vi.fn(),
  listCatalogProducts: vi.fn(),
  normalizeProductName: vi.fn((value: string) =>
    value.trim().replace(/\s+/g, ' '),
  ),
  extractProductsFromDeliveryNote: vi.fn(),
  readDeliveryNoteUpload: vi.fn(),
  storeReviewBatchSourceImage: vi.fn(),
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: transaction,
    uploadBatch: {
      create: uploadBatchCreate,
      update: uploadBatchUpdate,
      findFirst: uploadBatchFindFirst,
      findUnique: uploadBatchFindUnique,
      delete: uploadBatchDelete,
    },
    uploadBatchLine: {
      create: uploadBatchLineCreate,
      update: uploadBatchLineUpdate,
      deleteMany: uploadBatchLineDeleteMany,
    },
  },
}));

vi.mock('@/features/account/auth', () => ({
  auth,
}));

vi.mock('@/features/account/session-user', () => ({
  adminAction:
    (action: (admin: { id: string }, ...args: unknown[]) => Promise<unknown>) =>
    async (...args: unknown[]) =>
      action(await requireAdminUser(), ...args),
  requireAdminUser,
}));

vi.mock('@/features/product-catalog/products', () => ({
  listCatalogProducts,
  normalizeProductName,
}));

vi.mock('@/features/receiving/delivery-note/extract-products', () => ({
  extractProductsFromDeliveryNote,
}));

vi.mock('@/features/receiving/delivery-note/read-upload', () => ({
  readDeliveryNoteUpload,
}));

vi.mock('@/features/receiving/review-draft/store-source-image', () => ({
  storeReviewBatchSourceImage,
}));

vi.mock('next/cache', () => ({
  revalidatePath,
}));

import { UnreadableDeliveryNoteImageError } from '@/features/receiving/delivery-note/unreadable-image-error';
import { startReceivingReview } from '@/features/receiving/start-review';

describe('receiving start review', () => {
  beforeEach(() => {
    transaction.mockReset();
    uploadBatchCreate.mockReset();
    uploadBatchUpdate.mockReset();
    uploadBatchFindFirst.mockReset();
    uploadBatchFindUnique.mockReset();
    uploadBatchDelete.mockReset();
    uploadBatchLineCreate.mockReset();
    uploadBatchLineUpdate.mockReset();
    uploadBatchLineDeleteMany.mockReset();
    revalidatePath.mockReset();
    requireAdminUser.mockReset();
    listCatalogProducts.mockReset();
    normalizeProductName.mockClear();
    extractProductsFromDeliveryNote.mockReset();
    readDeliveryNoteUpload.mockReset();
    storeReviewBatchSourceImage.mockReset();
    auth.mockReset();

    auth.mockResolvedValue({ user: { id: 'user-1', role: 'ADMIN' } });

    transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        uploadBatch: {
          create: uploadBatchCreate,
          update: uploadBatchUpdate,
          findFirst: uploadBatchFindFirst,
          findUnique: uploadBatchFindUnique,
          delete: uploadBatchDelete,
        },
        uploadBatchLine: {
          create: uploadBatchLineCreate,
          update: uploadBatchLineUpdate,
          deleteMany: uploadBatchLineDeleteMany,
        },
      }),
    );
  });

  it('creates a review draft from extracted products', async () => {
    requireAdminUser.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
    listCatalogProducts.mockResolvedValue([
      { id: 'product-1', name: 'クラムチャウダー', category: 'SOUP' },
    ]);
    readDeliveryNoteUpload.mockResolvedValue({
      fileName: 'invoice.png',
      imageBuffer: Buffer.from('png'),
      mimeType: 'image/png',
    });
    storeReviewBatchSourceImage.mockResolvedValue(undefined);
    extractProductsFromDeliveryNote.mockResolvedValue([
      { name: 'クラムチャウダー', count: 4 },
      { name: '新作パン', count: 9 },
    ]);
    uploadBatchCreate.mockResolvedValue({
      id: 'batch-1',
      originalFileName: 'invoice.png',
    });
    uploadBatchFindUnique.mockResolvedValue({
      id: 'batch-1',
      originalFileName: 'invoice.png',
    });
    uploadBatchLineCreate.mockImplementation(async ({ data }) => ({
      id: `line-${data.lineNumber}`,
      lineNumber: data.lineNumber,
      rawText: data.rawText,
      count: data.count,
      matchedProductId: data.matchedProductId ?? null,
      matchStatus: data.matchStatus,
    }));
    uploadBatchUpdate.mockResolvedValue({});

    const formData = new FormData();

    formData.set('fridgeId', 'fridge-1');

    formData.set(
      'file',
      new File(['png'], 'invoice.png', { type: 'image/png' }),
    );

    const result = await startReceivingReview(formData);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error);
    }
    expect(result.draft.batchId).toBe('batch-1');
    expect(result.draft.originalFileName).toBe('invoice.png');
    expect(result.draft.sourceImageUrl).toBe('/admin/receiving-images/batch-1');
    expect(result.draft.catalog).toEqual([
      { id: 'product-1', name: 'クラムチャウダー', category: 'SOUP' },
    ]);
    expect(result.draft.products.map((product) => product.name)).toEqual([
      'クラムチャウダー',
      '新作パン',
    ]);
    expect(result.draft.products.map((product) => product.category)).toEqual([
      'SOUP',
      'BREAD',
    ]);
    expect(uploadBatchCreate).toHaveBeenCalledWith({
      data: {
        fridgeId: 'fridge-1',
        uploadedByUserId: 'user-1',
        originalFileName: 'invoice.png',
      },
      select: {
        id: true,
        originalFileName: true,
      },
    });
    expect(uploadBatchUpdate).toHaveBeenCalledTimes(1);
    expect(uploadBatchUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 'batch-1' },
      data: {
        processedAt: expect.any(Date),
      },
    });
    expect(storeReviewBatchSourceImage).toHaveBeenCalledWith({
      batchId: 'batch-1',
      imageBuffer: Buffer.from('png'),
      mimeType: 'image/png',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('returns a retake request when the delivery note image is unreadable', async () => {
    requireAdminUser.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
    readDeliveryNoteUpload.mockResolvedValue({
      fileName: 'invoice.png',
      imageBuffer: Buffer.from('png'),
      mimeType: 'image/png',
    });
    storeReviewBatchSourceImage.mockResolvedValue(undefined);
    extractProductsFromDeliveryNote.mockRejectedValue(
      new UnreadableDeliveryNoteImageError(
        '商品名行数と数量行数が一致しません: invoice.png (3件 / 7件)',
      ),
    );
    uploadBatchCreate.mockResolvedValue({
      id: 'batch-1',
      originalFileName: 'invoice.png',
    });
    uploadBatchFindUnique.mockResolvedValue({
      id: 'batch-1',
      _count: {
        inventoryPublications: 0,
      },
    });
    uploadBatchUpdate.mockResolvedValue({});

    const formData = new FormData();

    formData.set('fridgeId', 'fridge-1');

    formData.set(
      'file',
      new File(['png'], 'invoice.png', { type: 'image/png' }),
    );

    await expect(startReceivingReview(formData)).resolves.toEqual({
      ok: false,
      error:
        '納品書を読み取れませんでした。見本のように納品書全体が写るよう撮影し直して、もう一度アップロードしてください。',
    });
    expect(uploadBatchUpdate).not.toHaveBeenCalled();
    expect(uploadBatchLineDeleteMany).toHaveBeenCalledWith({
      where: { uploadBatchId: 'batch-1' },
    });
    expect(uploadBatchDelete).toHaveBeenCalledWith({
      where: { id: 'batch-1' },
    });
    expect(storeReviewBatchSourceImage).toHaveBeenCalledWith({
      batchId: 'batch-1',
      imageBuffer: Buffer.from('png'),
      mimeType: 'image/png',
    });
  });
});
