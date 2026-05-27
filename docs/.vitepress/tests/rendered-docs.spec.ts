import { expect, type Page, test } from '@playwright/test';

const docsBasePath =
  process.env.GITHUB_ACTIONS === 'true' ? '/pan-for-play' : '';

function docsPath(path: string) {
  return `${docsBasePath}${path}`;
}

function observeRenderingFailures(page: Page) {
  const failures: string[] = [];

  page.on('pageerror', (error) => {
    failures.push(error.message);
  });

  page.on('requestfailed', (request) => {
    const resourceType = request.resourceType();
    if (['document', 'script', 'stylesheet'].includes(resourceType)) {
      failures.push(`${resourceType} request failed: ${request.url()}`);
    }
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      failures.push(`console error: ${message.text()}`);
    }
  });

  return failures;
}

test('docs top page renders visible content', async ({ page }) => {
  const failures = observeRenderingFailures(page);

  await page.goto(docsPath('/'));
  const content = page.locator('#VPContent');

  await expect(content.getByText('Pan for PLAY Docs')).toBeVisible();
  await expect(content.getByRole('link', { name: '設計' })).toBeVisible();
  await page.waitForLoadState('networkidle');

  const bodyText = await page.locator('body').innerText();
  expect(bodyText.trim().length).toBeGreaterThan(0);
  expect(failures).toEqual([]);
});

test('generated category index renders visible content', async ({ page }) => {
  const failures = observeRenderingFailures(page);

  await page.goto(docsPath('/architecture/'));
  const content = page.locator('#VPContent');

  await expect(content.getByRole('heading', { name: '設計' })).toBeVisible();
  await expect(
    content.getByRole('link', { name: 'アーキテクチャ' }),
  ).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(failures).toEqual([]);
});
