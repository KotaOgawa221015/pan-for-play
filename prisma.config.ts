import { existsSync } from 'node:fs';

const loadEnvFile = (
  process as typeof process & {
    loadEnvFile?: () => void;
  }
).loadEnvFile;

if (existsSync('.env')) {
  loadEnvFile?.();
}

import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'pnpm exec tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
