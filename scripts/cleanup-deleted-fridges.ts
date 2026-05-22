import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';

const loadEnvFile = (process as typeof process & { loadEnvFile?: () => void })
  .loadEnvFile;
if (existsSync('.env')) {
  loadEnvFile?.();
}

async function main() {
  console.log(
    '削除から30日が経過した冷蔵庫データのクリーンアップを開始します...',
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await prisma.$transaction(async (tx) => {
    const targetFridges = await tx.fridge.findMany({
      where: {
        deletedAt: {
          lt: thirtyDaysAgo,
          not: null,
        },
      },
      select: { id: true, name: true },
    });

    if (targetFridges.length === 0) {
      console.log('対象となる古い冷蔵庫データはありませんでした。');
      return;
    }

    const fridgeIds = targetFridges.map((f) => f.id);
    console.log(`対象冷蔵庫: ${targetFridges.map((f) => f.name).join(', ')}`);

    const batches = await tx.uploadBatch.findMany({
      where: { fridgeId: { in: fridgeIds } },
      select: { storagePath: true },
    });
    const filePaths = batches
      .map((b) => b.storagePath)
      .filter(Boolean) as string[];

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
      where: {
        uploadBatch: {
          fridgeId: { in: fridgeIds },
        },
      },
    });

    await tx.uploadBatch.deleteMany({
      where: { fridgeId: { in: fridgeIds } },
    });

    await tx.fridge.deleteMany({
      where: { id: { in: fridgeIds } },
    });

    console.log(
      'データベースからのデータ削除が完了しました。物理ファイルの削除を行います...',
    );

    for (const filePath of filePaths) {
      try {
        await rm(filePath, { force: true });
        const dirPath = path.dirname(filePath);
        await rm(dirPath, { force: true, recursive: true });
      } catch (fileErr) {
        console.error(`ファイルの削除に失敗しました (${filePath}):`, fileErr);
      }
    }
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
