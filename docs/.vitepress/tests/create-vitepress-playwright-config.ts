import { devices, type PlaywrightTestConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type VitepressServerMode = 'dev' | 'preview';

type DocsPlaywrightConfigOptions = {
  port: number;
  serverMode: VitepressServerMode;
};

const docsBasePath = process.env.GITHUB_ACTIONS === 'true' ? '/pancolle/' : '/';
const docsDirectoryPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

export function createVitepressPlaywrightConfig({
  port,
  serverMode,
}: DocsPlaywrightConfigOptions): PlaywrightTestConfig {
  const docsBaseUrl = `http://127.0.0.1:${port}`;
  return {
    testDir: '.',
    fullyParallel: true,
    forbidOnly: true,
    reporter: 'list',
    use: {
      baseURL: docsBaseUrl,
      trace: 'retain-on-failure',
    },
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
    ],
    webServer: {
      command: `pnpm exec vitepress ${serverMode} . --host 127.0.0.1 --port ${port}`,
      cwd: docsDirectoryPath,
      url: `${docsBaseUrl}${docsBasePath}`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  };
}
