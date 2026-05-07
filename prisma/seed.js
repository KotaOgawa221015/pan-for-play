require('dotenv/config');

const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script.');
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
});

const seedItems = [
  { name: 'ふわふわコーヒーメロンパン', category: 'BREAD' },
  { name: 'ふわとろチーズパン', category: 'BREAD' },
  { name: '天然酵母ガーリックフランス', category: 'BREAD' },
  { name: '3種のチーズパン', category: 'BREAD' },
  { name: 'ふんわりツナマヨパン', category: 'BREAD' },
  { name: 'ゲランドの塩パン', category: 'BREAD' },
  { name: '枝豆チーズフランス', category: 'BREAD' },
  { name: 'ペッパーマヨとベーコンのエピ', category: 'BREAD' },
  { name: 'クラムチャウダー', category: 'SOUP' },
  { name: 'オニオングラタンスープ', category: 'SOUP' },
  { name: 'ミネストローネ', category: 'SOUP' },
];

async function main() {
  const seedNames = seedItems.map((item) => item.name);

  await prisma.item.deleteMany({
    where: {
      name: { notIn: seedNames },
    },
  });

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
