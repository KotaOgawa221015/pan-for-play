import 'dotenv/config';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';
import { cleanDatabase } from './seeds/clean.mts';
import { seedUsersData } from './seeds/users.mts';
import { seedProductsData } from './seeds/products.mts';
import { seedReceivingHistory } from './seeds/receiving.mts';
import { seedPublications } from './seeds/publications.mts';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script.');
}
const resolvedDatabaseUrl = databaseUrl;

function createPrismaClient() {
  const authToken = process.env.TURSO_AUTH_TOKEN;

  return new PrismaClient({
    log: ['error'],
    adapter: new PrismaLibSql({
      url: resolvedDatabaseUrl,
      authToken: authToken || undefined,
    }),
  });
}

const prisma = createPrismaClient();

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
