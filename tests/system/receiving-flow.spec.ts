import { test, expect } from '@playwright/test';
import path from 'node:path';

test.describe('納品書受け入れフローのE2Eテスト', () => {
  test('納品書画像のアップロードから在庫反映までの一連のライフサイクル', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: '管理者 (Bypass)' }).click();
    await expect(page).toHaveURL('/');

    await page.goto('/admin');

    const filePath = path.join(
      process.cwd(),
      'public/receiving-examples/sample1.png',
    );

    await page.setInputFiles('input[type="file"]', filePath);
    await page
      .getByRole('button', { name: 'アップロードして読み込む' })
      .click();

    const modalTitle = page.getByText('Delivery Note Review');
    await expect(modalTitle).toBeVisible({ timeout: 30000 });
    await expect(page.locator('input[value="カマンベールノア"]')).toBeVisible();
    await expect(page.locator('input[value="クラムチャウダー"]')).toBeVisible();

    await page.getByRole('button', { name: '内容を反映する' }).click();
    await expect(modalTitle).not.toBeVisible();

    await page.goto('/');

    const soupCard = page.locator('div').filter({
      has: page.getByRole('heading', { name: 'クラムチャウダー' }),
    });

    await expect(soupCard).toBeVisible();
    await expect(soupCard.getByText('残りわずか')).toBeVisible();
    await expect(soupCard.getByText('3 個')).toBeVisible();
  });
});
