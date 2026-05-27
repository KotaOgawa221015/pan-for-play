import type { Fridge, PrismaClient } from '@prisma/client';

export async function seedFridgesData(prisma: PrismaClient): Promise<Fridge> {
  const defaultFridge = await prisma.fridge.create({
    data: {
      name: '16Fの冷蔵庫',
      isDefault: true,
    },
  });

  // テスト用に非デフォルトの冷蔵庫も1つ作っておく
  await prisma.fridge.create({
    data: {
      name: '15Fの冷蔵庫',
      isDefault: false,
    },
  });

  return defaultFridge;
}
