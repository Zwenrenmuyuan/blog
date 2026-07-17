import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('欢迎文章可以通过稳定地址访问', async ({ page }) => {
  const response = await page.goto('/posts/welcome/');

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle(/欢迎来到旁注/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { level: 1, name: '欢迎来到旁注' })).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('article')).toContainText('为什么是静态博客');
});

test('生产构建不生成草稿文章', async ({ page }) => {
  const response = await page.goto('/posts/style-test/');

  expect(response?.status()).toBe(404);
});

test('欢迎文章没有严重或致命的无障碍问题', async ({ page }) => {
  await page.goto('/posts/welcome/');

  const results = await new AxeBuilder({ page }).analyze();
  const blockingViolations = results.violations.filter(
    ({ impact }) => impact === 'serious' || impact === 'critical',
  );

  expect(blockingViolations).toEqual([]);
});
