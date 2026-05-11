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
  { name: 'ふわふわコーヒーメロンパン' },
  { name: 'ふわとろチーズパン' },
  { name: '天然酵母ガーリックフランス' },
  { name: '3種のチーズパン' },
  { name: 'ふんわりツナマヨパン' },
  { name: 'ゲランドの塩パン' },
  { name: '枝豆チーズフランス' },
  { name: 'ペッパーマヨとベーコンのエピ' },
  { name: 'クラムチャウダー' },
  { name: 'オニオングラタンスープ' },
  { name: 'ミネストローネ' },
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
      update: {},
      create: { name: item.name },
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
