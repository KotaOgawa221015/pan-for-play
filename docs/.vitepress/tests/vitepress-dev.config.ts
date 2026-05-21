import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS_TEST_PORT = Number(process.env.DOCS_TEST_PORT ?? 4174);
const DOCS_BASE_URL = `http://127.0.0.1:${DOCS_TEST_PORT}`;
const docsBasePath = process.env.GITHUB_ACTIONS === 'true' ? '/pancolle/' : '/';
const docsDirectoryPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: true,
  reporter: 'list',
  use: {
    baseURL: DOCS_BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm exec vitepress dev . --host 127.0.0.1 --port ${DOCS_TEST_PORT}`,
    cwd: docsDirectoryPath,
    url: `${DOCS_BASE_URL}${docsBasePath}`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
