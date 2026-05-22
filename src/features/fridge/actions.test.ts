import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  fridgeFindFirst,
  fridgeFindUnique,
  fridgeCreate,
  fridgeUpdate,
  revalidatePath,
  requireAdminUser,
} = vi.hoisted(() => ({
  fridgeFindFirst: vi.fn(),
  fridgeFindUnique: vi.fn(),
  fridgeCreate: vi.fn(),
  fridgeUpdate: vi.fn(),
  revalidatePath: vi.fn(),
  requireAdminUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fridge: {
      findFirst: fridgeFindFirst,
      findUnique: fridgeFindUnique,
      create: fridgeCreate,
      update: fridgeUpdate,
    },
  },
}));

vi.mock('@/features/account/session-user', () => ({
  adminAction:
    (action: (admin: { id: string }, ...args: unknown[]) => Promise<unknown>) =>
    async (...args: unknown[]) =>
      action(await requireAdminUser(), ...args),
  requireAdminUser,
}));

vi.mock('next/cache', () => ({
  revalidatePath,
}));

import { createFridge, deleteFridge, renameFridge } from './actions';

describe('fridge actions', () => {
  beforeEach(() => {
    fridgeFindFirst.mockReset();
    fridgeFindUnique.mockReset();
    fridgeCreate.mockReset();
    fridgeUpdate.mockReset();
    revalidatePath.mockReset();
    requireAdminUser.mockReset();

    requireAdminUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
  });

  describe('createFridge', () => {
    it('重複する名前がなければ、新しい冷蔵庫を正常に作成できること', async () => {
      fridgeFindFirst.mockResolvedValue(null);
      fridgeCreate.mockResolvedValue({ id: 'new-fridge-id' });

      await expect(createFridge('2Fの冷蔵庫')).resolves.toEqual({
        success: true,
      });
      expect(fridgeCreate).toHaveBeenCalledWith({
        data: { name: '2Fの冷蔵庫', isDefault: false },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(revalidatePath).toHaveBeenCalledWith('/admin');
    });

    it('同名の有効な冷蔵庫が存在する場合、エラーをスローすること', async () => {
      fridgeFindFirst.mockResolvedValue({
        id: 'existing-id',
        name: '2Fの冷蔵庫',
      });

      await expect(createFridge('2Fの冷蔵庫')).rejects.toThrow(
        '同名の冷蔵庫が既に存在します。',
      );
      expect(fridgeCreate).not.toHaveBeenCalled();
    });
  });

  describe('renameFridge', () => {
    it('正常に対象の冷蔵庫の名前を変更できること', async () => {
      fridgeFindUnique.mockResolvedValue({
        id: 'fridge-1',
        name: '旧冷蔵庫',
        deletedAt: null,
      });
      fridgeFindFirst.mockResolvedValue(null);
      fridgeUpdate.mockResolvedValue({});

      await expect(
        renameFridge({ id: 'fridge-1', name: '新冷蔵庫' }),
      ).resolves.toEqual({ success: true });
      expect(fridgeUpdate).toHaveBeenCalledWith({
        where: { id: 'fridge-1' },
        data: { name: '新冷蔵庫' },
      });
    });
  });

  describe('deleteFridge', () => {
    it('デフォルトではない冷蔵庫を正常に論理削除できること', async () => {
      fridgeFindUnique.mockResolvedValue({
        id: 'fridge-1',
        isDefault: false,
        deletedAt: null,
      });
      fridgeUpdate.mockResolvedValue({});

      await expect(deleteFridge('fridge-1')).resolves.toEqual({
        success: true,
      });
      expect(fridgeUpdate).toHaveBeenCalledWith({
        where: { id: 'fridge-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('デフォルトの冷蔵庫を削除しようとした場合、エラーをスローすること', async () => {
      fridgeFindUnique.mockResolvedValue({
        id: 'fridge-default',
        isDefault: true,
        deletedAt: null,
      });

      await expect(deleteFridge('fridge-default')).rejects.toThrow(
        'デフォルトの冷蔵庫は削除できません。',
      );
      expect(fridgeUpdate).not.toHaveBeenCalled();
    });
  });
});
