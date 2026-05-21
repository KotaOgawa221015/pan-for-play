import { defineConfig } from '@playwright/test';
import { createVitepressPlaywrightConfig } from './create-vitepress-playwright-config';

const docsTestPort = Number(process.env.DOCS_TEST_DEV_PORT ?? 4174);

export default defineConfig(
  createVitepressPlaywrightConfig({
    port: docsTestPort,
    serverMode: 'dev',
  }),
);
