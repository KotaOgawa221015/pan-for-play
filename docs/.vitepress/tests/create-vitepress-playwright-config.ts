import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { devices, type PlaywrightTestConfig } from '@playwright/test';

type VitepressServerMode = 'dev' | 'preview';

type DocsPlaywrightConfigOptions = {
  port: number;
  serverMode: VitepressServerMode;
};

const usesGithubPagesBase = process.env.GITHUB_ACTIONS === 'true';
const docsSiteBase = usesGithubPagesBase ? '/pan-for-play/' : '/';
const docsBrowserBasePath = usesGithubPagesBase ? '/pan-for-play' : '';
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
  const command =
    serverMode === 'dev'
      ? `pnpm predev && pnpm exec vitepress dev . --host 127.0.0.1 --port ${port} --base ${docsSiteBase}`
      : `pnpm exec vitepress preview . --host 127.0.0.1 --port ${port} --base ${docsSiteBase}`;
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
      command,
      cwd: docsDirectoryPath,
      url: `${docsBaseUrl}${docsBrowserBasePath}/`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  };
}
