import type { PrismaClient } from '@prisma/client';

export async function cleanDatabase(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.inventoryStatusChange.deleteMany(),
    prisma.inventoryPublication.deleteMany(),
    prisma.uploadBatchLine.deleteMany(),
    prisma.uploadBatch.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.product.deleteMany(),
    prisma.user.deleteMany(),
    prisma.fridge.deleteMany(),
  ]);
}
