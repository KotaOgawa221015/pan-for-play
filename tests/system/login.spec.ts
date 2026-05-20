import { expect, test } from '@playwright/test';

test.describe('ログイン・在庫画面ライフサイクル', () => {
  test('ログインページが正しく表示され、開発用バイパスログインができること', async ({
    page,
  }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toHaveText('ログイン');
    const googleLoginButton = page.getByRole('button', {
      name: 'Googleでログイン',
    });
    await expect(googleLoginButton).toBeVisible();
    await googleLoginButton.click();
    const googleUnavailableError = page.getByText(
      'Googleログインは現在利用できません。',
      { exact: false },
    );
    const showsUnavailableError = await googleUnavailableError
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    if (showsUnavailableError) {
      await expect(googleUnavailableError).toBeVisible();
    } else {
      await page.goto('/login');
    }

    const bypassUserButton = page.getByRole('button', { name: '一般ユーザー' });
    await expect(bypassUserButton).toBeVisible();
    await bypassUserButton.click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('パンコレ');
  });
});
