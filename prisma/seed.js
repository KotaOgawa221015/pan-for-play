require('dotenv/config');
const bcrypt = require('bcryptjs');

const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const catalogFixture = require('./fixtures/catalog-products.json');
const receivingHistoryFixture = require('./fixtures/receiving-history.json');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script.');
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
});

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

function statusFromCount(count) {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`Invalid inventory count in seed fixture: ${count}`);
  }

  if (count === 0) {
    return 'SOLD_OUT';
  }

  if (count <= 5) {
    return 'FEW_LEFT';
  }

  return 'PLENTIFUL';
}

function minutesAgo(now, minutes) {
  if (minutes === null || minutes === undefined) {
    return null;
  }

  return new Date(now.getTime() - minutes * 60000);
}

async function main() {
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
  if (!adminUser) {
    throw new Error('Seed users are missing required roles.');
  }

  const products = await Promise.all(
    catalogFixture.products.map((name) =>
      prisma.product.create({
        data: {
          name,
          isActive: true,
        },
      }),
    ),
  );

  const productByName = new Map(
    products.map((product) => [product.name, product]),
  );
  const now = new Date();

  const appliedBatches = receivingHistoryFixture.batches.filter(
    (batch) => batch.processingStatus === 'APPLIED',
  );

  if (appliedBatches.length !== 1) {
    throw new Error(
      'Receiving history fixture must contain exactly one APPLIED batch.',
    );
  }

  for (const history of receivingHistoryFixture.batches) {
    const processedAt = minutesAgo(now, history.processedMinutesAgo);
    const appliedAt = minutesAgo(now, history.appliedMinutesAgo);
    const revertedAt = minutesAgo(now, history.revertedMinutesAgo);

    const batch = await prisma.uploadBatch.create({
      data: {
        uploadedByUserId: adminUser.id,
        originalFileName: history.originalFileName,
        storagePath: null,
        processingStatus: history.processingStatus,
        processedAt,
        appliedAt,
        revertedAt,
      },
    });

    for (const [index, product] of history.products.entries()) {
      const matchedProduct = productByName.get(product.name);

      if (!matchedProduct) {
        throw new Error(
          `Seed receiving product is missing from catalog: ${product.name}`,
        );
      }

      const status = statusFromCount(product.count);

      await prisma.uploadBatchLine.create({
        data: {
          uploadBatchId: batch.id,
          lineNumber: index + 1,
          rawText: product.name,
          count: product.count,
          matchedProductId: matchedProduct.id,
          matchStatus: 'MATCHED',
          appliedStatus: status,
        },
      });
    }
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
