import { createClient } from '@libsql/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to initialize Prisma Client.');
}

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    if (databaseUrl.startsWith('file:') || databaseUrl.startsWith('sqlite:')) {
      return new PrismaClient({
        adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
      });
    }

    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!authToken) {
      throw new Error(
        'TURSO_AUTH_TOKEN is required for Turso database connection.',
      );
    }

    const libsql = createClient({
      url: databaseUrl,
      authToken,
    });

    return new PrismaClient({
      adapter: new PrismaLibSQL(libsql),
    });
  })();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
