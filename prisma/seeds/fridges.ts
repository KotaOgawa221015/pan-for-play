import type { Fridge, PrismaClient } from '@prisma/client';

export async function seedFridgesData(prisma: PrismaClient): Promise<Fridge> {
  const defaultFridge = await prisma.fridge.create({
    data: {
      name: 'メイン冷蔵庫（16F）',
      isDefault: true,
    },
  });

  // テスト用に非デフォルトの冷蔵庫も1つ作っておく
  await prisma.fridge.create({
    data: {
      name: 'サブ冷蔵庫（15F）',
      isDefault: false,
    },
  });

  return defaultFridge;
}
