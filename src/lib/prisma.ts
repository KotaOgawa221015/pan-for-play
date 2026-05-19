import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';
import { getPrismaEnv } from './environment';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const { databaseUrl, tursoAuthToken } = getPrismaEnv();

function createPrismaClient() {
  // Use LibSQL adapter for all connections (including local file: URLs)
  // This satisfies the requirement for an adapter when using engineType="client"
  return new PrismaClient({
    log: ['error'],
    adapter: new PrismaLibSql({
      url: databaseUrl,
      authToken: tursoAuthToken,
    }),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
