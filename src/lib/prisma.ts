import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to initialize Prisma Client.');
}

function createPrismaClient() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to initialize Prisma Client.');
  }

  const authToken = process.env.TURSO_AUTH_TOKEN;

  // Use LibSQL adapter for all connections (including local file: URLs)
  // This satisfies the requirement for an adapter when using engineType="client"
  return new PrismaClient({
    log: ['error'],
    adapter: new PrismaLibSql({
      url: databaseUrl,
      authToken: authToken || undefined,
    }),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
