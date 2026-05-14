import Database from 'better-sqlite3';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaLibSql } from '@prisma/adapter-libsql';
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
      const dbPath = databaseUrl.replace(/^(file:|sqlite:)/, '');
      // Set WAL mode via a temporary connection (persistent in DB file)
      const sqlite = new Database(dbPath);
      sqlite.pragma('journal_mode = WAL');
      sqlite.close();

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

    return new PrismaClient({
      adapter: new PrismaLibSql({
        url: databaseUrl,
        authToken,
      }),
    });
  })();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
