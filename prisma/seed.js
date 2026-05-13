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

  await prisma.uploadBatchLine.deleteMany({});
  await prisma.inventoryCheck.deleteMany({});
  await prisma.uploadBatch.deleteMany({});
  await prisma.product.deleteMany({
    where: {
      name: { notIn: seedNames },
    },
  });

  // 2. ユーザーの作成
  const users = await Promise.all(
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
    })
  );

  const adminUser = users.find((u) => u.role === 'ADMIN');

  const createdProducts = [];
  for (const p of seedProducts) {
    const product = await prisma.product.upsert({
      where: { name: p.name },
      update: { isActive: p.isActive },
      create: {
        name: p.name,
        isActive: p.isActive,
        inventoryChecks: {
          create: {
            status: 'PLENTIFUL',
            sourceType: 'MANUAL',
            checkedAt: new Date(),
            checkedByUserId: adminUser.id,
          },
        },
      },
    });
    createdProducts.push(product);
  }

  await prisma.uploadBatch.create({
    data: {
      originalFileName: 'seed_invoice.png',
      storagePath: '/tmp/seed.png',
      processingStatus: 'APPLIED',
      uploadedByUserId: adminUser.id,
      lines: {
        create: {
          lineNumber: 1,
          rawText: createdProducts[0].name,
          matchedProductId: createdProducts[0].id,
          matchStatus: 'MATCHED',
          appliedStatus: 'PLENTIFUL',
        },
      },
    },
  });

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