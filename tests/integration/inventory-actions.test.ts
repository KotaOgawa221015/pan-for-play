import { beforeEach, describe, expect, it, vi } from 'vitest';
import { redirect } from 'next/navigation';

const { uploadBatchFindFirst, requireCurrentUser } = vi.hoisted(() => ({
  uploadBatchFindFirst: vi.fn(),
  requireCurrentUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    uploadBatch: {
      findFirst: uploadBatchFindFirst,
    },
  },
}));

vi.mock('@/features/auth/account-access', () => ({
  requireCurrentUser,
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

import { getInventoryProducts } from '@/features/inventory/product-inventory';

describe('inventory server actions', () => {
  beforeEach(() => {
    uploadBatchFindFirst.mockReset();
    requireCurrentUser.mockReset();
    vi.mocked(redirect).mockReset();
    // デフォルトで認証済みとする
    requireCurrentUser.mockResolvedValue({ id: 'user-1', role: 'MEMBER' });
  });

  it('未認証の場合はログインページにリダイレクトされる（またはエラーになる）', async () => {
    // 認証失敗の挙動を再現
    requireCurrentUser.mockRejectedValue(new Error('Unauthorized'));

    await expect(getInventoryProducts()).rejects.toThrow('Unauthorized');
  });

  it('認証済みの場合は適用されたバッチから製品を読み込む', async () => {
    // 認証成功のモック
    requireCurrentUser.mockResolvedValue({ id: 'user-1', role: 'MEMBER' });

    uploadBatchFindFirst.mockResolvedValue({
      appliedAt: new Date('2026-05-12T12:00:00.000Z'),
      processedAt: new Date('2026-05-12T11:00:00.000Z'),
      createdAt: new Date('2026-05-12T10:00:00.000Z'),
      lines: [
        {
          count: 8,
          matchedProduct: { id: 'bread', name: '食パン', category: 'BREAD' },
        },
      ],
    });

    const result = await getInventoryProducts();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('食パン');
    expect(requireCurrentUser).toHaveBeenCalled();
  });

  it('loads products from the applied receiving batch and sorts them', async () => {
    uploadBatchFindFirst.mockResolvedValue({
      appliedAt: new Date('2026-05-12T12:00:00.000Z'),
      processedAt: new Date('2026-05-12T11:00:00.000Z'),
      createdAt: new Date('2026-05-12T10:00:00.000Z'),
      lines: [
        {
          count: 8,
          matchedProduct: { id: 'bread', name: '食パン', category: 'BREAD' },
        },
        {
          count: 4,
          matchedProduct: { id: 'soup', name: 'スープ', category: 'SOUP' },
        },
      ],
    });

    const result = await getInventoryProducts();

    // ソート順の確認 (スープ -> 食パン)
    expect(result).toEqual([
      {
        id: 'soup',
        name: 'スープ',
        category: 'SOUP',
        count: 4,
        status: 'FEW_LEFT',
        updatedAt: '2026-05-12T12:00:00.000Z',
      },
      {
        id: 'bread',
        name: '食パン',
        category: 'BREAD',
        count: 8,
        status: 'PLENTIFUL',
        updatedAt: '2026-05-12T12:00:00.000Z',
      },
    ]);
  });

  it('hides zero-count lines and returns empty when no applied batch exists', async () => {
    uploadBatchFindFirst.mockResolvedValueOnce({
      appliedAt: new Date('2026-05-12T12:00:00.000Z'),
      processedAt: null,
      createdAt: new Date('2026-05-12T10:00:00.000Z'),
      lines: [
        {
          count: 0,
          matchedProduct: { id: 'bread', name: '食パン', category: 'BREAD' },
        },
      ],
    });

    await expect(getInventoryProducts()).resolves.toEqual([]);

    uploadBatchFindFirst.mockResolvedValueOnce(null);
    await expect(getInventoryProducts()).resolves.toEqual([]);
  });
});
