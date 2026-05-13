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

const seedProducts = [
  { name: 'ふわふわコーヒーメロンパン', isActive: true },
  { name: 'ふわとろチーズパン', isActive: true },
  { name: '天然酵母ガーリックフランス', isActive: true },
  { name: '3種のチーズパン', isActive: true },
  { name: 'ふんわりツナマヨパン', isActive: true },
  { name: 'ゲランドの塩パン', isActive: true },
  { name: '枝豆チーズフランス', isActive: true },
  { name: 'ペッパーマヨとベーコンのエピ', isActive: true },
  { name: 'クラムチャウダー', isActive: true },
  { name: 'オニオングラタンスープ', isActive: true },
  { name: 'ミネストローネ', isActive: true },
];

const seedUsers = [
  {
    name: 'admin',
    email: 'admin@example.com',
    role: 'ADMIN',
  },
  {
    name: 'user',
    email: 'user@example.com',
  },
];

async function main() {
  const seedNames = seedProducts.map((product) => product.name);

  await Promise.all([
    prisma.product.deleteMany({
      where: {
        name: { notIn: seedNames },
      },
    }),

    Promise.all(
      seedProducts.map((product) =>
        prisma.product.upsert({
          where: { name: product.name },
          update: {},
          create: { name: product.name },
        }),
      ),
    ),

    Promise.all(
      seedUsers.map(async (user) => {
        return prisma.user.upsert({
          where: { email: user.email },
          update: {
            role: user.role,
          },
          create: {
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }),
    ),
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
