require('dotenv/config');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { PrismaClient, ProductCategory } = require('@prisma/client');
const catalogFixture = require('./fixtures/catalog-products.json');
const receivingHistoryFixture = require('./fixtures/receiving-history.json');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script.');
}

function createPrismaClient() {
  const authToken = process.env.TURSO_AUTH_TOKEN;

  return new PrismaClient({
    log: ['error'],
    adapter: new PrismaLibSql({
      url: databaseUrl,
      authToken: authToken || undefined,
    }),
  });
}

const prisma = createPrismaClient();

const productCategories = new Set(Object.values(ProductCategory));

const seedUsers = [
  {
    name: 'admin',
    email: 'admin@example.com',
    role: 'ADMIN',
  },
  {
    name: 'user',
    email: 'user@example.com',
    role: 'MEMBER',
  },
];

function statusFromCount(count) {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`Invalid inventory count in seed fixture: ${count}`);
  }
  if (count === 0) return 'SOLD_OUT';
  if (count <= 5) return 'FEW_LEFT';
  return 'PLENTIFUL';
}

function minutesAgo(now, minutes) {
  if (minutes === null || minutes === undefined) return null;
  return new Date(now.getTime() - minutes * 60000);
}

function getStatusByProduct(lines) {
  const statuses = new Map();

  for (const line of lines) {
    statuses.set(line.productId, statusFromCount(line.count));
  }

  return statuses;
}

function buildStatusChanges(previousLines, nextLines) {
  const previousStatuses = getStatusByProduct(previousLines);
  const nextStatuses = getStatusByProduct(nextLines);

  const changes = [];

  for (const productId of nextStatuses.keys()) {
    const previousStatus = previousStatuses.get(productId) ?? null;
    const nextStatus = nextStatuses.get(productId);

    if (!nextStatus) {
      continue;
    }

    if (previousStatus === nextStatus) {
      continue;
    }

    changes.push({
      productId,
      previousStatus,
      nextStatus,
    });
  }

  return changes;
}

async function main() {
  await prisma.$transaction([
    prisma.inventoryStatusChange.deleteMany(),
    prisma.inventoryPublication.deleteMany(),
    prisma.uploadBatchLine.deleteMany(),
    prisma.uploadBatch.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.product.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const createdUsers = await Promise.all(
    seedUsers.map((user) =>
      prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
      }),
    ),
  );

  const adminUser = createdUsers.find((user) => user.role === 'ADMIN');
  if (!adminUser) {
    throw new Error('Seed users are missing required roles.');
  }

  const products = await Promise.all(
    catalogFixture.products.map((product) => {
      if (!product.name) throw new Error('Seed product name is required.');
      if (!productCategories.has(product.category)) {
        throw new Error(`Seed product category is invalid: ${product.name}`);
      }

      return prisma.product.create({
        data: {
          name: product.name,
          category: product.category,
          isActive: true,
        },
      });
    }),
  );

  const productByName = new Map(
    products.map((product) => [product.name, product]),
  );
  const now = new Date();
  const publications = [];

  for (const history of receivingHistoryFixture.batches) {
    const processedAt = minutesAgo(now, history.processedMinutesAgo);

    const batch = await prisma.uploadBatch.create({
      data: {
        uploadedByUserId: adminUser.id,
        originalFileName: history.originalFileName,
        storagePath: null,
        processingStatus: 'PROCESSED',
        processedAt,
      },
    });

    const publicationLines = [];

    for (const [index, product] of history.products.entries()) {
      const matchedProduct = productByName.get(product.name);

      if (!matchedProduct) {
        throw new Error(
          `Seed receiving product is missing from catalog: ${product.name}`,
        );
      }

      await prisma.uploadBatchLine.create({
        data: {
          uploadBatchId: batch.id,
          lineNumber: index + 1,
          rawText: product.name,
          count: product.count,
          matchedProductId: matchedProduct.id,
          matchStatus: 'MATCHED',
        },
      });

      publicationLines.push({
        productId: matchedProduct.id,
        count: product.count,
      });
    }

    const publishedAt = minutesAgo(now, history.publishedMinutesAgo);
    if (!publishedAt) {
      throw new Error(
        `Seed receiving publication time is required: ${history.originalFileName}`,
      );
    }

    publications.push({
      batchId: batch.id,
      publishedAt,
      publicationLines,
    });
  }

  publications.sort((left, right) => left.publishedAt - right.publishedAt);

  let previousPublicationLines = [];

  for (const publication of publications) {
    const createdPublication = await prisma.inventoryPublication.create({
      data: {
        uploadBatchId: publication.batchId,
        publishedByUserId: adminUser.id,
        publishedAt: publication.publishedAt,
        createdAt: publication.publishedAt,
      },
    });

    const statusChanges = buildStatusChanges(
      previousPublicationLines,
      publication.publicationLines,
    );

    for (const change of statusChanges) {
      await prisma.inventoryStatusChange.create({
        data: {
          publicationId: createdPublication.id,
          productId: change.productId,
          changedByUserId: adminUser.id,
          previousStatus: change.previousStatus,
          nextStatus: change.nextStatus,
          changedAt: publication.publishedAt,
          createdAt: publication.publishedAt,
        },
      });
    }

    previousPublicationLines = publication.publicationLines;
  }

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
