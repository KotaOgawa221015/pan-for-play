import { defineConfig, devices } from '@playwright/test';

const SYSTEM_TEST_PORT_ENV = process.env.PANCOLLE_SYSTEM_TEST_PORT ?? '3000';
const SYSTEM_TEST_PORT = Number.parseInt(SYSTEM_TEST_PORT_ENV, 10);

if (!Number.isInteger(SYSTEM_TEST_PORT) || SYSTEM_TEST_PORT <= 0) {
  throw new Error(
    `PANCOLLE_SYSTEM_TEST_PORT must be a positive integer: received "${SYSTEM_TEST_PORT_ENV}"`,
  );
}

const BASE_URL = `http://localhost:${SYSTEM_TEST_PORT}`;

export default defineConfig({
  testDir: './tests/system',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${SYSTEM_TEST_PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
