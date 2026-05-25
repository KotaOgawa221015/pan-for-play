import { beforeEach, describe, expect, it, vi } from 'vitest';

const { auth, requireCurrentUser, userUpdate, revalidatePath } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    requireCurrentUser: vi.fn(),
    userUpdate: vi.fn(),
    revalidatePath: vi.fn(),
  }),
);

vi.mock('./auth', () => ({
  auth,
  signOut: vi.fn(),
}));

vi.mock('./session-user', () => ({
  requireCurrentUser,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: userUpdate,
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath,
}));

import { updateProfileAction } from './profile';

describe('profile action', () => {
  beforeEach(() => {
    auth.mockReset();
    requireCurrentUser.mockReset();
    userUpdate.mockReset();
    revalidatePath.mockReset();

    auth.mockResolvedValue({ user: { id: 'user-1' } });
    requireCurrentUser.mockResolvedValue({ id: 'user-1' });
    userUpdate.mockResolvedValue({});
  });

  it('updates favorite fridge selection', async () => {
    const formData = new FormData();
    formData.set('name', 'User');
    formData.set('favoriteFridgeId', 'fridge-2');

    await expect(updateProfileAction(null, formData)).resolves.toEqual({
      success: 'プロフィールを更新しました',
    });

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'User', favoriteFridgeId: 'fridge-2' },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/profile');
  });

  it('clears favorite fridge when not selected', async () => {
    const formData = new FormData();
    formData.set('name', 'User');
    formData.set('favoriteFridgeId', '');

    await expect(updateProfileAction(null, formData)).resolves.toEqual({
      success: 'プロフィールを更新しました',
    });

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'User', favoriteFridgeId: null },
    });
  });
});
