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

    // デフォルトで正常な管理者セッションを返すよう設定
    requireAdminUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
  });

  describe('createFridge', () => {
    it('重複する名前がなければ、新しい冷蔵庫を正常に作成できること', async () => {
      fridgeFindFirst.mockResolvedValue(null);
      fridgeCreate.mockResolvedValue({ id: 'new-fridge-id' });

      const result = await createFridge('2Fの冷蔵庫');
      expect(result).toEqual({ success: true });
      expect(fridgeFindFirst).toHaveBeenCalledWith({
        where: { name: '2Fの冷蔵庫' },
      });
      expect(fridgeCreate).toHaveBeenCalledWith({
        data: { name: '2Fの冷蔵庫', isDefault: false },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/admin');
    });

    it('過去に削除されたものも含め、同名の冷蔵庫が存在する場合、指定のエラーメッセージをスローすること', async () => {
      // 過去に消された（deletedAtが入っている）レコードが存在すると仮定
      fridgeFindFirst.mockResolvedValue({
        id: 'old-deleted-id',
        name: '2Fの冷蔵庫',
        deletedAt: new Date(),
      });

      await expect(createFridge('2Fの冷蔵庫')).rejects.toThrow(
        'その名前は追加できません。',
      );
      expect(fridgeCreate).not.toHaveBeenCalled();
    });

    it('冷蔵庫名が空文字、またはスペースのみの場合はバリデーションエラーとなること', async () => {
      await expect(createFridge('   ')).rejects.toThrow(
        '冷蔵庫名を入力してください。',
      );
      expect(fridgeFindFirst).not.toHaveBeenCalled();
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

      const result = await renameFridge({ id: 'fridge-1', name: '新冷蔵庫' });
      expect(result).toEqual({ success: true });
      expect(fridgeFindFirst).toHaveBeenCalledWith({
        where: { name: '新冷蔵庫', id: { not: 'fridge-1' } },
      });
      expect(fridgeUpdate).toHaveBeenCalledWith({
        where: { id: 'fridge-1' },
        data: { name: '新冷蔵庫' },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/admin');
    });

    it('リネーム先の名前が、過去に削除された他の冷蔵庫の名前と重複する場合、指定のエラーメッセージをスローすること', async () => {
      fridgeFindUnique.mockResolvedValue({
        id: 'fridge-1',
        name: '旧冷蔵庫',
        deletedAt: null,
      });
      fridgeFindFirst.mockResolvedValue({
        id: 'deleted-fridge-id',
        name: '重複冷蔵庫',
        deletedAt: new Date(),
      });

      await expect(
        renameFridge({ id: 'fridge-1', name: '重複冷蔵庫' }),
      ).rejects.toThrow('その名前には変更できません。');
      expect(fridgeUpdate).not.toHaveBeenCalled();
    });

    it('対象の冷蔵庫がすでに論理削除されている場合、エラーをスローすること', async () => {
      fridgeFindUnique.mockResolvedValue({
        id: 'fridge-1',
        name: '旧冷蔵庫',
        deletedAt: new Date(),
      });

      await expect(
        renameFridge({ id: 'fridge-1', name: '新冷蔵庫' }),
      ).rejects.toThrow('対象の冷蔵庫が存在しません。');
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

      const result = await deleteFridge('fridge-1');
      expect(result).toEqual({ success: true });
      expect(fridgeUpdate).toHaveBeenCalledWith({
        where: { id: 'fridge-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/admin');
    });

    it('デフォルトの冷蔵庫を削除しようとした場合、ビジネスルールに則りエラーをスローすること', async () => {
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
