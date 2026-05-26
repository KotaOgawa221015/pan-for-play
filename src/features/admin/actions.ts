'use server';

import { auth } from '@/features/account/auth';
import { prisma } from '@/lib/prisma';

async function verifyAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('この操作を行う権限がありません。');
  }
}

export async function cleanupFridgesAction() {
  await verifyAdmin();

  try {
    const message = await prisma.$transaction(async (tx) => {
      const targetFridges = await tx.fridge.findMany({
        where: {
          deletedAt: { not: null },
        },
        select: { id: true, name: true },
      });

      if (targetFridges.length === 0) {
        return '対象となる削除済みの冷蔵庫データはありませんでした。';
      }

      const fridgeIds = targetFridges.map((f) => f.id);

      await tx.user.updateMany({
        where: { favoriteFridgeId: { in: fridgeIds } },
        data: { favoriteFridgeId: null },
      });
      await tx.inventoryStatusChange.deleteMany({
        where: { fridgeId: { in: fridgeIds } },
      });
      await tx.inventoryPublication.deleteMany({
        where: { fridgeId: { in: fridgeIds } },
      });
      await tx.uploadBatchLine.deleteMany({
        where: { uploadBatch: { fridgeId: { in: fridgeIds } } },
      });
      await tx.uploadBatch.deleteMany({
        where: { fridgeId: { in: fridgeIds } },
      });
      await tx.fridge.deleteMany({ where: { id: { in: fridgeIds } } });

      return `${targetFridges.length}件の削除済み冷蔵庫データを完全に消去しました。`;
    });

    return { success: true, message };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: '冷蔵庫のクリーンアップ中にエラーが発生しました。',
    };
  }
}

export async function cleanupUsersAction() {
  await verifyAdmin();

  try {
    const message = await prisma.$transaction(async (tx) => {
      const targetUsers = await tx.user.findMany({
        where: {
          deletedAt: { not: null },
        },
        select: { id: true, name: true },
      });

      if (targetUsers.length === 0) {
        return '対象となる退会済みユーザーデータはありませんでした。';
      }

      const userIds = targetUsers.map((u) => u.id);

      let placeholderUser = await tx.user.findUnique({
        where: { email: 'deleted-user@pancolle.local' },
      });

      if (!placeholderUser) {
        placeholderUser = await tx.user.create({
          data: {
            id: 'deleted-user-placeholder',
            name: '削除済みユーザー',
            email: 'deleted-user@pancolle.local',
            role: 'MEMBER',
          },
        });
      }

      await tx.uploadBatch.updateMany({
        where: { uploadedByUserId: { in: userIds } },
        data: { uploadedByUserId: placeholderUser.id },
      });
      await tx.inventoryPublication.updateMany({
        where: { publishedByUserId: { in: userIds } },
        data: { publishedByUserId: placeholderUser.id },
      });
      await tx.inventoryStatusChange.updateMany({
        where: { changedByUserId: { in: userIds } },
        data: { changedByUserId: placeholderUser.id },
      });

      await tx.account.deleteMany({ where: { userId: { in: userIds } } });
      await tx.session.deleteMany({ where: { userId: { in: userIds } } });
      await tx.user.deleteMany({ where: { id: { in: userIds } } });

      return `${targetUsers.length}名の退会ユーザーデータをクリーンアップしました。`;
    });

    return { success: true, message };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'ユーザークリーンアップ中にエラーが発生しました。',
    };
  }
}
