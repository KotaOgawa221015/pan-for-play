import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  transaction,
  uploadBatchFindFirst,
  uploadBatchLineUpdate,
  inventoryPublicationFindFirst,
  inventoryPublicationCreate,
  inventoryStatusChangeFindMany,
  inventoryStatusChangeCreate,
  productCreate,
  productUpdate,
  revalidatePath,
  requireAdminUser,
  listCatalogProducts,
  normalizeProductName,
  auth,
} = vi.hoisted(() => ({
  transaction: vi.fn(),
  uploadBatchFindFirst: vi.fn(),
  uploadBatchLineUpdate: vi.fn(),
  inventoryPublicationFindFirst: vi.fn(),
  inventoryPublicationCreate: vi.fn(),
  inventoryStatusChangeFindMany: vi.fn(),
  inventoryStatusChangeCreate: vi.fn(),
  productCreate: vi.fn(),
  productUpdate: vi.fn(),
  revalidatePath: vi.fn(),
  requireAdminUser: vi.fn(),
  listCatalogProducts: vi.fn(),
  normalizeProductName: vi.fn((value: string) =>
    value.trim().replace(/\s+/g, ' '),
  ),
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: transaction,
    uploadBatch: {
      findFirst: uploadBatchFindFirst,
    },
    uploadBatchLine: {
      update: uploadBatchLineUpdate,
    },
    inventoryPublication: {
      findFirst: inventoryPublicationFindFirst,
      create: inventoryPublicationCreate,
    },
    inventoryStatusChange: {
      findMany: inventoryStatusChangeFindMany,
      create: inventoryStatusChangeCreate,
    },
    product: {
      create: productCreate,
      update: productUpdate,
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

vi.mock('next/cache', () => ({
  revalidatePath,
}));

import { applyReceivingReview } from '@/features/receiving/publication/apply-review';

describe('receiving apply review', () => {
  beforeEach(() => {
    transaction.mockReset();
    uploadBatchFindFirst.mockReset();
    uploadBatchLineUpdate.mockReset();
    inventoryPublicationFindFirst.mockReset();
    inventoryPublicationCreate.mockReset();
    inventoryStatusChangeFindMany.mockReset();
    inventoryStatusChangeCreate.mockReset();
    productCreate.mockReset();
    productUpdate.mockReset();
    revalidatePath.mockReset();
    requireAdminUser.mockReset();
    listCatalogProducts.mockReset();
    normalizeProductName.mockClear();
    auth.mockReset();

    auth.mockResolvedValue({ user: { id: 'user-1', role: 'ADMIN' } });

    transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        uploadBatch: {
          findFirst: uploadBatchFindFirst,
        },
        uploadBatchLine: {
          update: uploadBatchLineUpdate,
        },
        inventoryPublication: {
          findFirst: inventoryPublicationFindFirst,
          create: inventoryPublicationCreate,
        },
        inventoryStatusChange: {
          findMany: inventoryStatusChangeFindMany,
          create: inventoryStatusChangeCreate,
        },
        product: {
          create: productCreate,
          update: productUpdate,
        },
      }),
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
});
