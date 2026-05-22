import { existsSync } from 'node:fs';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';
import { cleanDatabase } from './seeds/clean.ts';
import { seedProductsData } from './seeds/products.ts';
import { seedPublications } from './seeds/publications.ts';
import { seedReceivingHistory } from './seeds/receiving.ts';
import { seedUsersData } from './seeds/users.ts';

const loadEnvFile = (
  process as typeof process & {
    loadEnvFile?: () => void;
  }
).loadEnvFile;

if (existsSync('.env')) {
  loadEnvFile?.();
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script.');
}

function createPrismaClient(databaseUrl: string) {
  const authToken = process.env.TURSO_AUTH_TOKEN;

  return new PrismaClient({
    log: ['error'],
    adapter: new PrismaLibSql({
      url: databaseUrl,
      authToken: authToken || undefined,
    }),
  });
}

const prisma = createPrismaClient(databaseUrl);

async function main() {
  await cleanDatabase(prisma);

  const adminUser = await seedUsersData(prisma);
  const productByName = await seedProductsData(prisma);

  const publications = await seedReceivingHistory(
    prisma,
    adminUser,
    productByName,
  );
  await seedPublications(prisma, adminUser, publications);

  console.log('Seed data created successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
