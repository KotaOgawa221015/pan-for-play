'use server';

import { revalidatePath } from 'next/cache';
import { adminAction } from '@/features/account/session-user';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

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
        if (!userId) {
            throw new Error('ユーザーIDが不正です。');
        }

        if (currentAdmin.id === userId) {
            throw new Error('自分自身の権限は変更できません。');
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                role: UserRole.ADMIN,
            },
        });

        revalidatePath('/');
        revalidatePath('/admin');

        return { success: true };
    }
);