import { defineConfig } from '@playwright/test';
import { createVitepressPlaywrightConfig } from './create-vitepress-playwright-config';

const docsTestPort = Number(process.env.DOCS_TEST_PREVIEW_PORT ?? 4173);

export default defineConfig(
  createVitepressPlaywrightConfig({
    port: docsTestPort,
    serverMode: 'preview',
  }),
);
