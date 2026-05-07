import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script.');
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
});

const seedItems = [
  { name: 'クロワッサン', category: 'BREAD' },
  { name: 'カレーパン', category: 'BREAD' },
  { name: '食パン', category: 'BREAD' },
  { name: 'メロンパン', category: 'BREAD' },
  { name: 'コーンポタージュ', category: 'SOUP' },
  { name: 'ミネストローネ', category: 'SOUP' },
  { name: 'クラムチャウダー', category: 'SOUP' },
  { name: 'オニオンスープ', category: 'SOUP' },
] as const;

async function main() {
  for (const item of seedItems) {
    await prisma.item.upsert({
      where: { name: item.name },
      update: { category: item.category },
      create: { name: item.name, category: item.category },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
