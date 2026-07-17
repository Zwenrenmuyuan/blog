import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function searchFor(page: Page, query: string): Promise<void> {
  const input = page.getByRole('searchbox', { name: '搜索关键词' });
  await input.fill(query);
  await expect(page.locator('[data-search-status]')).not.toHaveText('正在搜索……');
}

test('中文标题、正文、标签和英文关键词可以命中公开文章', async ({ page }) => {
  await page.goto('/search/');

  for (const query of ['静态', '欢迎', '技术', 'Markdown']) {
    await searchFor(page, query);
    await expect(page.locator('[data-search-status]')).toHaveText('找到 1 篇相关文章。');
    await expect(page.locator('.search-result')).toHaveCount(1);
    await expect(page.getByRole('link', { name: '欢迎来到旁注' })).toHaveAttribute(
      'href',
      '/posts/welcome/',
    );
  }

  const result = page.locator('.search-result');
  await expect(result).toContainText('2026年7月17日');
  await expect(result.locator('.search-result__tags li')).toHaveCount(3);
  await expect(result.locator('.search-result__excerpt mark')).toHaveCount(1);
});

test('搜索关键词同步到 URL、刷新恢复并可用 Escape 清空', async ({ page }) => {
  await page.goto('/search/?q=静态');

  const input = page.getByRole('searchbox', { name: '搜索关键词' });
  await expect(input).toHaveValue('静态');
  await expect(page.locator('[data-search-status]')).toHaveText('找到 1 篇相关文章。');

  await input.fill('阅读');
  await expect(page).toHaveURL('/search/?q=%E9%98%85%E8%AF%BB');
  await expect(page.locator('[data-search-status]')).toHaveText('找到 1 篇相关文章。');

  await input.press('Escape');
  await expect(input).toHaveValue('');
  await expect(page).toHaveURL('/search/');
  await expect(page.locator('[data-search-status]')).toHaveText('输入关键词开始搜索。');
  await expect(page.locator('.search-result')).toHaveCount(0);
});

test('无结果、特殊字符和草稿专属内容安全返回空状态', async ({ page }) => {
  await page.goto('/search/');

  for (const query of ['魑魅魍魉', '[]()^$', '咖啡杯电路线条']) {
    await searchFor(page, query);
    await expect(page.locator('[data-search-status]')).toContainText('没有找到与');
    await expect(page.locator('[data-search-error]')).toBeHidden();
    await expect(page.locator('.search-result')).toHaveCount(0);
  }
});

test('搜索页响应式和无障碍检查通过', async ({ page }) => {
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/search/');

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }

  const results = await new AxeBuilder({ page }).analyze();
  const blockingViolations = results.violations.filter(
    ({ impact }) => impact === 'serious' || impact === 'critical',
  );
  expect(blockingViolations).toEqual([]);
});

test('禁用 JavaScript 后提供说明和有效内容浏览入口', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4321',
    javaScriptEnabled: false,
    viewport: { width: 360, height: 900 },
  });
  const page = await context.newPage();

  try {
    await page.goto('/search/');
    await expect(page.getByText('搜索需要浏览器启用 JavaScript')).toBeVisible();
    await expect(page.getByRole('link', { name: '全部文章', exact: true }).last()).toHaveAttribute(
      'href',
      '/posts/',
    );
    await expect(page.getByRole('link', { name: '标签', exact: true }).last()).toHaveAttribute(
      'href',
      '/tags/',
    );
    await expect(page.getByRole('link', { name: '归档', exact: true }).last()).toHaveAttribute(
      'href',
      '/archive/',
    );
  } finally {
    await context.close();
  }
});
