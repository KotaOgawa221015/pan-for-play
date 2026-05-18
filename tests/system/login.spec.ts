import { test, expect } from '@playwright/test';

test.describe('ログイン・在庫画面ライフサイクル', () => {
    test('ログインページが正しく表示され、開発用バイパスログインができること', async ({ page }) => {
        await page.goto('/login');

        await expect(page.locator('h1')).toHaveText('ログイン');
        await expect(page.getByRole('button', { name: 'Googleでログイン' })).toBeVisible();

        const bypassUserButton = page.getByRole('button', { name: '一般ユーザー' });

        if (await bypassUserButton.isVisible()) {
            await bypassUserButton.click();

            await expect(page).toHaveURL('/');
            await expect(page.locator('h1')).toContainText('パンコレ');
        }
    });
});