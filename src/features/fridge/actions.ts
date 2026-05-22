'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminAction } from '@/features/account/session-user';
import { prisma } from '@/lib/prisma';

const fridgeNameSchema = z
  .string()
  .trim()
  .min(1, { message: '冷蔵庫名を入力してください。' })
  .max(50, { message: '冷蔵庫名は50文字以内で入力してください。' });

export const createFridge = adminAction(async (_admin, name: string) => {
  const validatedName = fridgeNameSchema.parse(name);

  const existing = await prisma.fridge.findFirst({
    where: { name: validatedName, deletedAt: null },
  });
  if (existing) {
    throw new Error('同名の冷蔵庫が既に存在します。');
  }

  await prisma.fridge.create({
    data: {
      name: validatedName,
      isDefault: false,
    },
  });

  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
});

export const renameFridge = adminAction(
  async (_admin, { id, name }: { id: string; name: string }) => {
    const validatedName = fridgeNameSchema.parse(name);

    const fridge = await prisma.fridge.findUnique({
      where: { id },
    });
    if (!fridge || fridge.deletedAt) {
      throw new Error('対象の冷蔵庫が存在しません。');
    }

    const existing = await prisma.fridge.findFirst({
      where: { name: validatedName, id: { not: id }, deletedAt: null },
    });
    if (existing) {
      throw new Error('同名の冷蔵庫が既に存在します。');
    }

    await prisma.fridge.update({
      where: { id },
      data: { name: validatedName },
    });

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  },
);

export const deleteFridge = adminAction(async (_admin, id: string) => {
  const fridge = await prisma.fridge.findUnique({
    where: { id },
  });

  if (!fridge || fridge.deletedAt) {
    throw new Error('対象の冷蔵庫が存在しません。');
  }

  if (fridge.isDefault) {
    throw new Error('デフォルトの冷蔵庫は削除できません。');
  }

  await prisma.fridge.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
});
