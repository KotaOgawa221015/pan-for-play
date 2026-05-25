import { existsSync } from 'node:fs';
import { prisma } from '../src/lib/prisma';

const loadEnvFile = (process as typeof process & { loadEnvFile?: () => void })
  .loadEnvFile;
if (existsSync('.env')) {
  loadEnvFile?.();
}

async function main() {
  console.log(
    '退会から30日が経過したユーザーデータのクリーンアップを開始します...',
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await prisma.$transaction(async (tx) => {
    const targetUsers = await tx.user.findMany({
      where: {
        deletedAt: {
          lt: thirtyDaysAgo,
          not: null,
        },
      },
      select: { id: true, name: true },
    });

    if (targetUsers.length === 0) {
      console.log('対象となる古い退会ユーザーデータはありませんでした。');
      return;
    }

    const userIds = targetUsers.map((u) => u.id);
    console.log(`対象ユーザー: ${targetUsers.map((u) => u.name).join(', ')}`);

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

    await tx.account.deleteMany({
      where: { userId: { in: userIds } },
    });

    await tx.session.deleteMany({
      where: { userId: { in: userIds } },
    });

    await tx.user.deleteMany({
      where: { id: { in: userIds } },
    });

    console.log('データベースからのユーザーデータ物理削除が完了しました。');
  });

  console.log('クリーンアップ処理がすべて正常に終了しました。');
}

main()
  .catch((error) => {
    console.error('クリーンアップ中にエラーが発生しました:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
