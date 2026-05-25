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
  inventoryPublicationFindFirst,
  inventoryPublicationCreate,
  inventoryStatusChangeFindMany,
  inventoryStatusChangeCreate,
  inventoryStatusChangeDeleteMany,
  productCreate,
  productUpdate,
  fridgeFindFirst,
  revalidatePath,
  requireAdminUser,
  listCatalogProducts,
  normalizeProductName,
  extractProductsFromDeliveryNote,
  readDeliveryNoteUpload,
  storeDeliveryNoteImage,
  deleteStoredDeliveryNoteImage,
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
  inventoryPublicationFindFirst: vi.fn(),
  inventoryPublicationCreate: vi.fn(),
  inventoryStatusChangeFindMany: vi.fn(),
  inventoryStatusChangeCreate: vi.fn(),
  inventoryStatusChangeDeleteMany: vi.fn(),
  productCreate: vi.fn(),
  productUpdate: vi.fn(),
  fridgeFindFirst: vi.fn(),
  revalidatePath: vi.fn(),
  requireAdminUser: vi.fn(),
  listCatalogProducts: vi.fn(),
  normalizeProductName: vi.fn((value: string) =>
    value.trim().replace(/\s+/g, ' '),
  ),
  extractProductsFromDeliveryNote: vi.fn(),
  readDeliveryNoteUpload: vi.fn(),
  storeDeliveryNoteImage: vi.fn(),
  deleteStoredDeliveryNoteImage: vi.fn(),
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
    inventoryPublication: {
      findFirst: inventoryPublicationFindFirst,
      create: inventoryPublicationCreate,
    },
    inventoryStatusChange: {
      findMany: inventoryStatusChangeFindMany,
      create: inventoryStatusChangeCreate,
      deleteMany: inventoryStatusChangeDeleteMany,
    },
    product: {
      create: productCreate,
      update: productUpdate,
    },
    fridge: {
      findFirst: fridgeFindFirst,
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
  createCatalogProduct: vi.fn(async (_writer, name: string, category: string) =>
    productCreate({
      data: {
        name,
        category,
      },
    }),
  ),
}));

vi.mock('@/features/receiving/delivery-note/extract-products', () => ({
  extractProductsFromDeliveryNote,
}));

vi.mock('@/features/receiving/delivery-note/read-upload', () => ({
  readDeliveryNoteUpload,
}));

vi.mock('@/features/receiving/delivery-note/store-image', () => ({
  storeDeliveryNoteImage,
}));

vi.mock('@/features/receiving/delivery-note/delete-stored-image', () => ({
  deleteStoredDeliveryNoteImage,
}));

vi.mock('next/cache', () => ({
  revalidatePath,
}));

import { UnreadableDeliveryNoteImageError } from '@/features/receiving/delivery-note/unreadable-image-error';
import { deleteReceivingBatch } from '@/features/receiving/history/delete-batch';
import { applyReceivingReview } from '@/features/receiving/publication/apply-review';
import { reapplyReceivingBatch } from '@/features/receiving/publication/reapply-batch';
import { startReceivingReview } from '@/features/receiving/start-review';

describe('receiving actions', () => {
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
    inventoryPublicationFindFirst.mockReset();
    inventoryPublicationCreate.mockReset();
    inventoryStatusChangeFindMany.mockReset();
    inventoryStatusChangeCreate.mockReset();
    inventoryStatusChangeDeleteMany.mockReset();
    productCreate.mockReset();
    productUpdate.mockReset();
    fridgeFindFirst.mockReset();
    revalidatePath.mockReset();
    requireAdminUser.mockReset();
    listCatalogProducts.mockReset();
    normalizeProductName.mockClear();
    extractProductsFromDeliveryNote.mockReset();
    readDeliveryNoteUpload.mockReset();
    storeDeliveryNoteImage.mockReset();
    deleteStoredDeliveryNoteImage.mockReset();
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
        inventoryPublication: {
          findFirst: inventoryPublicationFindFirst,
          create: inventoryPublicationCreate,
        },
        inventoryStatusChange: {
          findMany: inventoryStatusChangeFindMany,
          create: inventoryStatusChangeCreate,
          deleteMany: inventoryStatusChangeDeleteMany,
        },
        product: {
          create: productCreate,
          update: productUpdate,
        },
        fridge: {
          findFirst: fridgeFindFirst,
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
    });
    storeDeliveryNoteImage.mockResolvedValue('/tmp/project/.tmp/invoice.png');
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

    const draft = await startReceivingReview(formData);

    expect(draft.batchId).toBe('batch-1');
    expect(draft.originalFileName).toBe('invoice.png');
    expect(draft.sourceImageUrl).toBe('/admin/receiving-images/batch-1');
    expect(draft.catalog).toEqual([
      { id: 'product-1', name: 'クラムチャウダー', category: 'SOUP' },
    ]);
    expect(draft.products.map((product) => product.name)).toEqual([
      'クラムチャウダー',
      '新作パン',
    ]);
    expect(draft.products.map((product) => product.category)).toEqual([
      'SOUP',
      'BREAD',
    ]);
    expect(uploadBatchCreate).toHaveBeenCalledWith({
      data: {
        fridgeId: 'fridge-1',
        uploadedByUserId: 'user-1',
        originalFileName: 'invoice.png',
        storagePath: null,
      },
      select: {
        id: true,
        originalFileName: true,
      },
    });
    expect(uploadBatchUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 'batch-1' },
      data: {
        storagePath: '/tmp/project/.tmp/invoice.png',
      },
    });
    expect(uploadBatchUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 'batch-1' },
      data: {
        processedAt: expect.any(Date),
      },
    });
    expect(deleteStoredDeliveryNoteImage).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('returns a retake request when the delivery note image is unreadable', async () => {
    requireAdminUser.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
    readDeliveryNoteUpload.mockResolvedValue({
      fileName: 'invoice.png',
      imageBuffer: Buffer.from('png'),
    });
    storeDeliveryNoteImage.mockResolvedValue('/tmp/project/.tmp/invoice.png');
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

    await expect(startReceivingReview(formData)).rejects.toThrow(
      '納品書を読み取れませんでした。見本のように納品書全体が写るよう撮影し直して、もう一度アップロードしてください。',
    );
    expect(uploadBatchUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 'batch-1' },
      data: {
        storagePath: '/tmp/project/.tmp/invoice.png',
      },
    });
    expect(uploadBatchLineDeleteMany).toHaveBeenCalledWith({
      where: { uploadBatchId: 'batch-1' },
    });
    expect(uploadBatchDelete).toHaveBeenCalledWith({
      where: { id: 'batch-1' },
    });
    expect(deleteStoredDeliveryNoteImage).toHaveBeenCalledWith(
      '/tmp/project/.tmp/invoice.png',
    );
  });

  it('applies reviewed lines and creates a publication with status changes', async () => {
    requireAdminUser.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
    listCatalogProducts.mockResolvedValue([
      { id: 'existing-1', name: 'クラムチャウダー', category: 'BREAD' },
    ]);
    uploadBatchFindFirst.mockResolvedValue({
      id: 'batch-1',
      fridgeId: 'fridge-1',
      lines: [
        { id: 'line-1', lineNumber: 1 },
        { id: 'line-2', lineNumber: 2 },
      ],
    });
    inventoryPublicationFindFirst.mockResolvedValue({
      uploadBatch: {
        lines: [
          {
            matchedProductId: 'existing-1',
            count: 8,
          },
        ],
      },
    });
    inventoryPublicationCreate.mockResolvedValue({
      id: 'publication-1',
    });
    inventoryStatusChangeFindMany.mockResolvedValue([]);
    productCreate.mockResolvedValue({
      id: 'created-1',
      name: '新作パン',
      category: 'BREAD',
    });
    uploadBatchLineUpdate.mockResolvedValue({});
    inventoryStatusChangeCreate.mockResolvedValue({});

    await applyReceivingReview({
      batchId: 'batch-1',
      products: [
        {
          lineId: 'line-1',
          name: 'クラムチャウダー',
          category: 'SOUP',
          count: 4,
        },
        {
          lineId: 'line-2',
          name: '新作パン',
          category: 'BREAD',
          count: 9,
        },
      ],
    });

    expect(productCreate).toHaveBeenCalledWith({
      data: {
        name: '新作パン',
        category: 'BREAD',
      },
    });
    expect(productUpdate).toHaveBeenCalledWith({
      where: { id: 'existing-1' },
      data: { category: 'SOUP' },
    });
    expect(uploadBatchLineUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 'line-1' },
      data: expect.objectContaining({
        rawText: 'クラムチャウダー',
        count: 4,
        matchedProductId: 'existing-1',
        matchStatus: 'MATCHED',
      }),
    });
    expect(uploadBatchLineUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 'line-2' },
      data: expect.objectContaining({
        rawText: '新作パン',
        count: 9,
        matchedProductId: 'created-1',
        matchStatus: 'MATCHED',
      }),
    });
    expect(inventoryPublicationCreate).toHaveBeenCalledWith({
      data: {
        fridgeId: 'fridge-1',
        uploadBatchId: 'batch-1',
        publishedByUserId: 'user-1',
        publishedAt: expect.any(Date),
      },
    });
    expect(inventoryStatusChangeCreate).toHaveBeenNthCalledWith(1, {
      data: {
        fridgeId: 'fridge-1',
        publicationId: 'publication-1',
        productId: 'existing-1',
        changedByUserId: 'user-1',
        previousStatus: 'PLENTIFUL',
        nextStatus: 'FEW_LEFT',
        changedAt: expect.any(Date),
      },
    });
    expect(inventoryStatusChangeCreate).toHaveBeenNthCalledWith(2, {
      data: {
        fridgeId: 'fridge-1',
        publicationId: 'publication-1',
        productId: 'created-1',
        changedByUserId: 'user-1',
        previousStatus: null,
        nextStatus: 'PLENTIFUL',
        changedAt: expect.any(Date),
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('does not mark missing previous products as sold out during publication', async () => {
    requireAdminUser.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
    listCatalogProducts.mockResolvedValue([
      { id: 'existing-1', name: 'クラムチャウダー', category: 'SOUP' },
    ]);
    uploadBatchFindFirst.mockResolvedValue({
      id: 'batch-1',
      fridgeId: 'fridge-1',
      lines: [{ id: 'line-1', lineNumber: 1 }],
    });
    inventoryPublicationFindFirst.mockResolvedValue({
      uploadBatch: {
        lines: [
          {
            matchedProductId: 'missing-from-next-invoice',
            count: 3,
          },
        ],
      },
    });
    inventoryPublicationCreate.mockResolvedValue({
      id: 'publication-1',
    });
    inventoryStatusChangeFindMany.mockResolvedValue([]);
    uploadBatchLineUpdate.mockResolvedValue({});
    inventoryStatusChangeCreate.mockResolvedValue({});

    await applyReceivingReview({
      batchId: 'batch-1',
      products: [
        {
          lineId: 'line-1',
          name: 'クラムチャウダー',
          category: 'SOUP',
          count: 4,
        },
      ],
    });

    expect(inventoryStatusChangeCreate).toHaveBeenCalledTimes(1);
    expect(inventoryStatusChangeCreate).toHaveBeenCalledWith({
      data: {
        fridgeId: 'fridge-1',
        publicationId: 'publication-1',
        productId: 'existing-1',
        changedByUserId: 'user-1',
        previousStatus: null,
        nextStatus: 'FEW_LEFT',
        changedAt: expect.any(Date),
      },
    });
  });

  it('compares publication-derived status with the latest visible manual status', async () => {
    requireAdminUser.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
    listCatalogProducts.mockResolvedValue([
      { id: 'existing-1', name: '食パン', category: 'BREAD' },
    ]);
    uploadBatchFindFirst.mockResolvedValue({
      id: 'batch-1',
      lines: [{ id: 'line-1', lineNumber: 1 }],
    });
    inventoryPublicationFindFirst.mockResolvedValue({
      uploadBatch: {
        lines: [
          {
            matchedProductId: 'existing-1',
            count: 8,
          },
        ],
      },
    });
    inventoryPublicationCreate.mockResolvedValue({
      id: 'publication-1',
    });
    inventoryStatusChangeFindMany.mockResolvedValue([
      {
        productId: 'existing-1',
        nextStatus: 'SOLD_OUT',
      },
      {
        productId: 'existing-1',
        nextStatus: 'FEW_LEFT',
      },
    ]);
    uploadBatchLineUpdate.mockResolvedValue({});
    inventoryStatusChangeCreate.mockResolvedValue({});

    await applyReceivingReview({
      batchId: 'batch-1',
      products: [
        {
          lineId: 'line-1',
          name: '食パン',
          category: 'BREAD',
          count: 8,
        },
      ],
    });

    expect(inventoryStatusChangeCreate).toHaveBeenCalledTimes(1);
    expect(inventoryStatusChangeCreate).toHaveBeenCalledWith({
      data: {
        publicationId: 'publication-1',
        productId: 'existing-1',
        changedByUserId: 'user-1',
        previousStatus: 'SOLD_OUT',
        nextStatus: 'PLENTIFUL',
        changedAt: expect.any(Date),
      },
    });
  });

  it('rejects duplicate reviewed products before persistence', async () => {
    requireAdminUser.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
    listCatalogProducts.mockResolvedValue([
      { id: 'existing-1', name: 'クラムチャウダー', category: 'SOUP' },
    ]);

    await expect(
      applyReceivingReview({
        batchId: 'batch-1',
        products: [
          {
            lineId: 'line-1',
            name: 'クラムチャウダー',
            category: 'SOUP',
            count: 4,
          },
          {
            lineId: 'line-2',
            name: 'クラムチャウダー',
            category: 'BREAD',
            count: 2,
          },
        ],
      }),
    ).rejects.toThrow('同じ商品が複数回含まれています: クラムチャウダー');

    expect(transaction).not.toHaveBeenCalled();
  });

  it('reapplies and deletes batches through history actions', async () => {
    requireAdminUser.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
    fridgeFindFirst.mockResolvedValue({
      id: 'fridge-2',
    });
    inventoryPublicationFindFirst
      .mockResolvedValueOnce({
        uploadBatchId: 'batch-2',
        uploadBatch: {
          lines: [
            {
              matchedProductId: 'product-2',
              count: 9,
            },
          ],
        },
      })
      .mockResolvedValueOnce(null);
    inventoryPublicationCreate.mockResolvedValue({
      id: 'publication-2',
    });
    inventoryStatusChangeFindMany.mockResolvedValue([]);
    inventoryStatusChangeCreate.mockResolvedValue({});
    uploadBatchFindFirst.mockResolvedValueOnce({
      id: 'batch-1',
      fridgeId: 'fridge-1',
      lines: [
        {
          matchedProductId: 'product-1',
          count: 3,
        },
      ],
    });
    uploadBatchFindUnique.mockResolvedValueOnce({
      id: 'batch-1',
      deletedAt: null,
    });
    uploadBatchLineDeleteMany.mockResolvedValue({});
    uploadBatchUpdate.mockResolvedValue({});

    await reapplyReceivingBatch({
      batchId: 'batch-1',
      fridgeId: 'fridge-2',
    });
    await deleteReceivingBatch('batch-1');

    expect(inventoryPublicationCreate).toHaveBeenCalledWith({
      data: {
        fridgeId: 'fridge-2',
        uploadBatchId: 'batch-1',
        publishedByUserId: 'user-1',
        publishedAt: expect.any(Date),
      },
    });
    expect(uploadBatchUpdate).toHaveBeenCalledWith({
      where: { id: 'batch-1' },
      data: {
        deletedAt: expect.any(Date),
      },
    });
  });
});
