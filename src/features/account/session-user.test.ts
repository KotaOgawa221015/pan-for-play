import { beforeEach, describe, expect, it, vi } from 'vitest';

const { auth, redirect, userFindUnique } = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock('./auth', () => ({
  auth,
}));

vi.mock('next/navigation', () => ({
  redirect,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: userFindUnique,
    },
  },
}));

import { requireCurrentUser } from './session-user';

describe('session user', () => {
  beforeEach(() => {
    auth.mockReset();
    redirect.mockReset();
    userFindUnique.mockReset();
    redirect.mockImplementation(() => {
      throw new Error('REDIRECT');
    });
  });

  it('returns the user from the database when the session is valid', async () => {
    auth.mockResolvedValue({ user: { id: 'user-1' } });
    userFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      role: 'MEMBER',
      deletedAt: null,
    });

    await expect(requireCurrentUser()).resolves.toEqual({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      role: 'MEMBER',
    });
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        deletedAt: true,
      },
    });
  });

  it('redirects to login when session user does not exist in database', async () => {
    auth.mockResolvedValue({ user: { id: 'missing-user' } });
    userFindUnique.mockResolvedValue(null);

    await expect(requireCurrentUser()).rejects.toThrow('REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to login when session user is soft deleted', async () => {
    auth.mockResolvedValue({ user: { id: 'deleted-user' } });
    userFindUnique.mockResolvedValue({
      id: 'deleted-user',
      email: 'deleted@example.com',
      name: 'Deleted',
      role: 'MEMBER',
      deletedAt: new Date(),
    });

    await expect(requireCurrentUser()).rejects.toThrow('REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/login');
  });
});
