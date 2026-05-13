require('dotenv/config');
const bcrypt = require('bcryptjs');

const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { PrismaClient } = require('@prisma/client');

function createPrismaClient(databaseUrl) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run the seed script.');
  }

  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
  });
}

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
    password: 'password123',
    role: 'ADMIN',
  },
  {
    name: 'user',
    email: 'user@example.com',
    password: 'password456',
    role: 'MEMBER',
  },
];

async function seed() {
  const prisma = createPrismaClient(process.env.DATABASE_URL);

  try {
    await prisma.inventoryCheck.deleteMany();
    await prisma.uploadBatchLine.deleteMany();
    await prisma.uploadBatch.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    const createdUsers = [];
    for (const user of seedUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      const createdUser = await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          passwordHash,
          role: user.role,
        },
      });
      createdUsers.push(createdUser);
    }

    const adminUser = createdUsers.find((user) => user.role === 'ADMIN');
    const memberUser = createdUsers.find((user) => user.role === 'MEMBER');

    if (!adminUser || !memberUser) {
      throw new Error('Seed users are missing required roles.');
    }

    const products = await Promise.all(
      seedProducts.map((product) => prisma.product.create({ data: product })),
    );

    const now = new Date();
    const statusCycle = ['PLENTIFUL', 'FEW_LEFT', 'SOLD_OUT'];
    const manualChecks = [];

    products.forEach((product, index) => {
      manualChecks.push({
        productId: product.id,
        checkedByUserId: adminUser.id,
        status: statusCycle[index % statusCycle.length],
        sourceType: 'MANUAL',
        checkedAt: new Date(
          now.getTime() - (products.length - index) * 3600000,
        ),
      });

      if (index % 4 === 0) {
        manualChecks.push({
          productId: product.id,
          checkedByUserId: memberUser.id,
          status: 'PLENTIFUL',
          sourceType: 'MANUAL',
          checkedAt: new Date(now.getTime() - (48 + index) * 3600000),
          note: null,
        });
      }
    });

    await prisma.inventoryCheck.createMany({ data: manualChecks });

    const uploadBatch = await prisma.uploadBatch.create({
      data: {
        uploadedByUserId: adminUser.id,
        originalFileName: 'invoice-2026-05-10.jpg',
        storagePath: 'uploads/invoices/invoice-2026-05-10.jpg',
        processingStatus: 'APPLIED',
        processedAt: new Date(now.getTime() - 45 * 60000),
      },
    });

    const productByName = new Map(
      products.map((product) => [product.name, product]),
    );

    const uploadLines = [
      {
        lineNumber: 1,
        rawText: 'ふわふわコーヒーメロンパン x2',
        matchedProductId: productByName.get('ふわふわコーヒーメロンパン')?.id,
        matchStatus: 'MATCHED',
        appliedStatus: 'PLENTIFUL',
      },
      {
        lineNumber: 2,
        rawText: 'クラムチャウダー x1',
        matchedProductId: productByName.get('クラムチャウダー')?.id,
        matchStatus: 'MATCHED',
        appliedStatus: 'FEW_LEFT',
      },
      {
        lineNumber: 3,
        rawText: '商品名不明 x1',
        matchedProductId: null,
        matchStatus: 'NEEDS_REVIEW',
        appliedStatus: 'FEW_LEFT',
      },
    ];

    await prisma.uploadBatchLine.createMany({
      data: uploadLines.map((line) => ({
        uploadBatchId: uploadBatch.id,
        lineNumber: line.lineNumber,
        rawText: line.rawText,
        matchedProductId: line.matchedProductId || null,
        matchStatus: line.matchStatus,
        appliedStatus: line.appliedStatus,
      })),
    });

    const uploadChecks = uploadLines
      .filter((line) => line.matchedProductId)
      .map((line, index) => ({
        productId: line.matchedProductId,
        checkedByUserId: adminUser.id,
        uploadBatchId: uploadBatch.id,
        status: line.appliedStatus,
        sourceType: 'UPLOAD',
        checkedAt: new Date(now.getTime() - (30 - index) * 60000),
      }));

    if (uploadChecks.length > 0) {
      await prisma.inventoryCheck.createMany({ data: uploadChecks });
    }
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { seed };

if (require.main === module) {
  seed().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
