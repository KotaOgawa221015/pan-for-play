'use server';

import { revalidatePath } from 'next/cache';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { adminAction } from '@/features/account/session-user';
import { prisma } from '@/lib/prisma';

const createTargetUserIdSchema = (currentAdminId: string) =>
  z
    .string()
    .min(1, 'ユーザーIDが不正です。')
    .refine((id) => id !== currentAdminId, {
      message: '自分自身の権限は変更できません。',
    });

export async function listEligibleUsers() {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

export const promoteToAdmin = adminAction(
  async (currentAdmin, userId: string) => {
    const targetUserId = createTargetUserIdSchema(currentAdmin.id).parse(
      userId,
    );

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        role: UserRole.ADMIN,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true };
  },
);

export const demoteFromAdmin = adminAction(
  async (currentAdmin, userId: string) => {
    const targetUserId = createTargetUserIdSchema(currentAdmin.id).parse(
      userId,
    );

    const adminCount = await prisma.user.count({
      where: {
        role: UserRole.ADMIN,
        deletedAt: null,
      },
    });

    if (adminCount <= 1) {
      throw new Error(
        'システムに最低1人の管理者が存在する必要があります。最後の管理者の権限を剥奪することはできません。',
      );
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        role: UserRole.MEMBER,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true };
  },
);
