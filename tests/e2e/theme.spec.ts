import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

type ThemePreference = 'system' | 'light' | 'dark';

const themeLabels: Record<ThemePreference, string> = {
  system: '跟随系统',
  light: '浅色',
  dark: '深色',
};

async function chooseTheme(page: Page, preference: ThemePreference) {
  await page.getByRole('button', { name: /主题：/ }).click();
  await page.getByRole('radio', { name: themeLabels[preference], exact: true }).check();
}

async function backgroundColor(page: Page) {
  return page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
}

test('首次访问跟随系统深浅色', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
  expect(await backgroundColor(page)).toBe('rgb(247, 244, 238)');

  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await backgroundColor(page)).toBe('rgb(23, 21, 19)');
});

test('手动主题会保存并在刷新后保持', async ({ page }) => {
  await page.goto('/');
  await chooseTheme(page, 'dark');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: '主题：深色' })).toBeFocused();
  await expect(page.locator('[data-theme-status]')).toHaveText('已切换为深色主题');
  expect(await page.evaluate(() => localStorage.getItem('pangzhu-theme'))).toBe('dark');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: '主题：深色' })).toBeVisible();
});

test('手动选择覆盖系统主题，切回系统后恢复跟随', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await chooseTheme(page, 'light');

  expect(await backgroundColor(page)).toBe('rgb(247, 244, 238)');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await backgroundColor(page)).toBe('rgb(247, 244, 238)');

  await chooseTheme(page, 'system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
  expect(await backgroundColor(page)).toBe('rgb(23, 21, 19)');

  await page.emulateMedia({ colorScheme: 'light' });
  expect(await backgroundColor(page)).toBe('rgb(247, 244, 238)');
});

test('非法存储值会回退并被清理', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pangzhu-theme', 'unknown'));
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
  expect(await page.evaluate(() => localStorage.getItem('pangzhu-theme'))).toBeNull();
});

test('其他标签页修改主题时同步当前页面', async ({ page }) => {
  await page.goto('/');
  const otherPage = await page.context().newPage();

  try {
    await otherPage.goto('/');
    await otherPage.evaluate(() => localStorage.setItem('pangzhu-theme', 'dark'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: '主题：深色' })).toBeVisible();
  } finally {
    await otherPage.close();
  }
});

for (const preference of ['light', 'dark'] as const) {
  test(`${themeLabels[preference]}主题下首页和文章页通过无障碍检查`, async ({ page }) => {
    await page.goto('/');
    await chooseTheme(page, preference);

    for (const route of ['/', '/posts/welcome/']) {
      await page.goto(route);
      await page.getByRole('button', { name: /主题：/ }).click();

      const results = await new AxeBuilder({ page }).analyze();
      const blockingViolations = results.violations.filter(
        ({ impact }) => impact === 'serious' || impact === 'critical',
      );

      expect(blockingViolations).toEqual([]);
    }
  });
}
