import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  transaction,
  uploadBatchCreate,
  uploadBatchUpdate,
  uploadBatchUpdateMany,
  uploadBatchFindUnique,
  uploadBatchDelete,
  uploadBatchLineCreate,
  uploadBatchLineUpdate,
  uploadBatchLineDeleteMany,
  productCreate,
  revalidatePath,
  requireAdminUser,
  listCatalogProducts,
  extractProductsFromMock,
} = vi.hoisted(() => ({
  transaction: vi.fn(),
  uploadBatchCreate: vi.fn(),
  uploadBatchUpdate: vi.fn(),
  uploadBatchUpdateMany: vi.fn(),
  uploadBatchFindUnique: vi.fn(),
  uploadBatchDelete: vi.fn(),
  uploadBatchLineCreate: vi.fn(),
  uploadBatchLineUpdate: vi.fn(),
  uploadBatchLineDeleteMany: vi.fn(),
  productCreate: vi.fn(),
  revalidatePath: vi.fn(),
  requireAdminUser: vi.fn(),
  listCatalogProducts: vi.fn(),
  extractProductsFromMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: transaction,
    uploadBatch: {
      create: uploadBatchCreate,
      update: uploadBatchUpdate,
      updateMany: uploadBatchUpdateMany,
      findUnique: uploadBatchFindUnique,
      delete: uploadBatchDelete,
    },
    uploadBatchLine: {
      create: uploadBatchLineCreate,
      update: uploadBatchLineUpdate,
      deleteMany: uploadBatchLineDeleteMany,
    },
    product: {
      create: productCreate,
    },
  },
}));

vi.mock('@/features/auth/account-access', () => ({
  requireAdminUser,
}));

vi.mock('@/features/product-catalog/products', () => ({
  listCatalogProducts,
  createCatalogProduct: vi.fn(async (_writer, name: string) =>
    productCreate({
      data: {
        name,
      },
    }),
  ),
}));

vi.mock('@/features/product-list-extraction/mock', () => ({
  extractProductsFromMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath,
}));

import {
  applyReceivingReview,
  deleteReceivingBatch,
  reapplyReceivingBatch,
  startReceivingReview,
} from '@/features/receiving/actions';

describe('receiving actions', () => {
  beforeEach(() => {
    transaction.mockReset();
    uploadBatchCreate.mockReset();
    uploadBatchUpdate.mockReset();
    uploadBatchUpdateMany.mockReset();
    uploadBatchFindUnique.mockReset();
    uploadBatchDelete.mockReset();
    uploadBatchLineCreate.mockReset();
    uploadBatchLineUpdate.mockReset();
    uploadBatchLineDeleteMany.mockReset();
    productCreate.mockReset();
    revalidatePath.mockReset();
    requireAdminUser.mockReset();
    listCatalogProducts.mockReset();
    extractProductsFromMock.mockReset();

    transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        uploadBatch: {
          create: uploadBatchCreate,
          update: uploadBatchUpdate,
          updateMany: uploadBatchUpdateMany,
          findUnique: uploadBatchFindUnique,
          delete: uploadBatchDelete,
        },
        uploadBatchLine: {
          create: uploadBatchLineCreate,
          update: uploadBatchLineUpdate,
          deleteMany: uploadBatchLineDeleteMany,
        },
        product: {
          create: productCreate,
        },
      }),
    );
  });

  it('creates a review draft from extracted products', async () => {
    requireAdminUser.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
    listCatalogProducts.mockResolvedValue([
      { id: 'product-1', name: 'クラムチャウダー' },
    ]);
    extractProductsFromMock.mockResolvedValue([
      { name: 'クラムチャウダー', count: 4 },
      { name: '新作パン', count: 9 },
    ]);
    uploadBatchCreate.mockResolvedValue({
      id: 'batch-1',
      originalFileName: 'invoice.jpg',
    });
    uploadBatchLineCreate.mockImplementation(async ({ data }) => ({
      id: `line-${data.lineNumber}`,
      rawText: data.rawText,
      count: data.count,
      matchedProductId: data.matchedProductId ?? null,
      matchStatus: data.matchStatus,
      appliedStatus: data.appliedStatus,
    }));
    uploadBatchUpdate.mockResolvedValue({});

    const draft = await startReceivingReview('invoice.jpg');

    expect(draft.batchId).toBe('batch-1');
    expect(draft.originalFileName).toBe('invoice.jpg');
    expect(draft.catalog).toEqual([
      { id: 'product-1', name: 'クラムチャウダー' },
    ]);
    expect(draft.products.map((product) => product.name)).toEqual([
      'クラムチャウダー',
      '新作パン',
    ]);
    expect(uploadBatchCreate).toHaveBeenCalledWith({
      data: {
        uploadedByUserId: 'user-1',
        originalFileName: 'invoice.jpg',
        storagePath: null,
        processingStatus: 'PENDING',
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('applies reviewed lines and updates current receiving batch', async () => {
    requireAdminUser.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
    listCatalogProducts.mockResolvedValue([
      { id: 'existing-1', name: 'クラムチャウダー' },
    ]);
    uploadBatchFindUnique.mockResolvedValue({
      id: 'batch-1',
      processingStatus: 'PROCESSED',
      lines: [
        { id: 'line-1', lineNumber: 1 },
        { id: 'line-2', lineNumber: 2 },
      ],
    });
    productCreate.mockResolvedValue({
      id: 'created-1',
      name: '新作パン',
    });
    uploadBatchLineUpdate.mockResolvedValue({});
    uploadBatchUpdate.mockResolvedValue({});
    uploadBatchUpdateMany.mockResolvedValue({});

    await applyReceivingReview({
      batchId: 'batch-1',
      products: [
        {
          lineId: 'line-1',
          name: 'クラムチャウダー',
          count: 4,
          selectedProductId: 'existing-1',
        },
        {
          lineId: 'line-2',
          name: '新作パン',
          count: 9,
          selectedProductId: null,
        },
      ],
    });

    expect(productCreate).toHaveBeenCalledWith({
      data: {
        name: '新作パン',
      },
    });
    expect(uploadBatchLineUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 'line-1' },
      data: expect.objectContaining({
        rawText: 'クラムチャウダー',
        count: 4,
        matchedProductId: 'existing-1',
        matchStatus: 'MATCHED',
        appliedStatus: 'FEW_LEFT',
      }),
    });
    expect(uploadBatchLineUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 'line-2' },
      data: expect.objectContaining({
        rawText: '新作パン',
        count: 9,
        matchedProductId: 'created-1',
        matchStatus: 'MATCHED',
        appliedStatus: 'PLENTIFUL',
      }),
    });
    expect(uploadBatchUpdate).toHaveBeenCalledWith({
      where: { id: 'batch-1' },
      data: expect.objectContaining({
        processingStatus: 'APPLIED',
        appliedAt: expect.any(Date),
        revertedAt: null,
      }),
    });
    expect(uploadBatchUpdateMany).toHaveBeenCalledWith({
      where: {
        processingStatus: 'APPLIED',
      },
      data: {
        processingStatus: 'REVERTED',
        revertedAt: expect.any(Date),
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('rejects duplicate reviewed products before persistence', async () => {
    requireAdminUser.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
    listCatalogProducts.mockResolvedValue([
      { id: 'existing-1', name: 'クラムチャウダー' },
    ]);

    await expect(
      applyReceivingReview({
        batchId: 'batch-1',
        products: [
          {
            lineId: 'line-1',
            name: 'クラムチャウダー',
            count: 4,
            selectedProductId: 'existing-1',
          },
          {
            lineId: 'line-2',
            name: 'クラムチャウダー',
            count: 2,
            selectedProductId: null,
          },
        ],
      }),
    ).rejects.toThrow(
      '既存商品と同名の商品は新規登録できません: クラムチャウダー',
    );

    expect(transaction).not.toHaveBeenCalled();
  });

  it('reapplies and deletes batches through history actions', async () => {
    requireAdminUser.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
    uploadBatchFindUnique
      .mockResolvedValueOnce({
        id: 'batch-1',
        processingStatus: 'REVERTED',
        lines: [
          {
            matchedProductId: 'product-1',
            appliedStatus: 'FEW_LEFT',
            count: 3,
          },
        ],
      })
      .mockResolvedValueOnce({
        id: 'batch-1',
        processingStatus: 'REVERTED',
      });
    uploadBatchUpdate.mockResolvedValue({});
    uploadBatchUpdateMany.mockResolvedValue({});
    uploadBatchLineDeleteMany.mockResolvedValue({});
    uploadBatchDelete.mockResolvedValue({});

    await reapplyReceivingBatch('batch-1');
    await deleteReceivingBatch('batch-1');

    expect(uploadBatchUpdateMany).toHaveBeenCalledWith({
      where: {
        processingStatus: 'APPLIED',
      },
      data: {
        processingStatus: 'REVERTED',
        revertedAt: expect.any(Date),
      },
    });
    expect(uploadBatchLineDeleteMany).toHaveBeenCalledWith({
      where: { uploadBatchId: 'batch-1' },
    });
    expect(uploadBatchDelete).toHaveBeenCalledWith({
      where: { id: 'batch-1' },
    });
  });
});
