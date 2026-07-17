import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('最小首页可以通过生产预览访问', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle('旁注');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');

  const heading = page.getByRole('heading', { level: 1, name: '旁注' });
  await expect(heading).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
});

test('最小首页没有严重或致命的无障碍问题', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page }).analyze();
  const blockingViolations = results.violations.filter(
    ({ impact }) => impact === 'serious' || impact === 'critical',
  );

  expect(blockingViolations).toEqual([]);
});
