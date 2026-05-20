import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  userFindMany,
  userUpdate,
  userCount,
  revalidatePath,
  requireAdminUser,
} = vi.hoisted(() => ({
  userFindMany: vi.fn(),
  userUpdate: vi.fn(),
  userCount: vi.fn(),
  revalidatePath: vi.fn(),
  requireAdminUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: userFindMany,
      update: userUpdate,
      count: userCount,
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath,
}));

vi.mock('@/features/account/session-user', () => ({
  adminAction:
    (
      action: (
        admin: { id: string; role: string },
        ...args: unknown[]
      ) => Promise<unknown>,
    ) =>
    async (...args: unknown[]) =>
      action(await requireAdminUser(), ...args),
  requireAdminUser,
}));

import {
  demoteFromAdmin,
  listEligibleUsers,
  promoteToAdmin,
} from './admin-management';

describe('admin management', () => {
  beforeEach(() => {
    userFindMany.mockReset();
    userUpdate.mockReset();
    userCount.mockReset();
    revalidatePath.mockReset();
    requireAdminUser.mockReset();

    requireAdminUser.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'ADMIN',
    });
  });

  it('lists eligible users in name order with the expected projection', async () => {
    userFindMany.mockResolvedValue([]);

    await expect(listEligibleUsers()).resolves.toEqual([]);

    expect(userFindMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  });

  it('promotes another user to admin and revalidates the relevant paths', async () => {
    userUpdate.mockResolvedValue({});

    await expect(promoteToAdmin('user-1')).resolves.toEqual({ success: true });

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { role: 'ADMIN' },
    });
    expect(revalidatePath).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('rejects empty target ids before updating', async () => {
    await expect(promoteToAdmin('')).rejects.toThrow('ユーザーIDが不正です。');

    expect(userUpdate).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('rejects self-targeted admin changes', async () => {
    await expect(promoteToAdmin('admin-1')).rejects.toThrow(
      '自分自身の権限は変更できません。',
    );

    expect(userUpdate).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('demotes another admin when at least two admins exist', async () => {
    userCount.mockResolvedValue(2);
    userUpdate.mockResolvedValue({});

    await expect(demoteFromAdmin('user-1')).resolves.toEqual({ success: true });

    expect(userCount).toHaveBeenCalledWith({
      where: {
        role: 'ADMIN',
        deletedAt: null,
      },
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { role: 'MEMBER' },
    });
    expect(revalidatePath).toHaveBeenCalledTimes(2);
  });

  it('prevents removing the final admin', async () => {
    userCount.mockResolvedValue(1);

    await expect(demoteFromAdmin('user-1')).rejects.toThrow(
      'システムに最低1人の管理者が存在する必要があります。最後の管理者の権限を剥奪することはできません。',
    );

    expect(userUpdate).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
