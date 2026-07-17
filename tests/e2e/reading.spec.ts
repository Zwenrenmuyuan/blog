import { expect, test } from '@playwright/test';

test('欢迎文章显示阅读时间、目录和标题永久链接', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/posts/welcome/');

  await expect(page.locator('[data-reading-time]')).toHaveText(/约 \d+ 分钟阅读/);
  await expect(page.locator('.article-toc--desktop')).toBeVisible();
  await expect(page.locator('[data-mobile-toc]')).toBeHidden();
  await expect(page.locator('.article-toc--desktop a')).toHaveCount(3);

  const tocLink = page.locator('.article-toc--desktop a').first();
  const href = await tocLink.getAttribute('href');
  await tocLink.click();

  expect(await page.evaluate(() => decodeURIComponent(window.location.hash))).toBe(href);
  await expect(page.locator('.heading-anchor')).toHaveCount(3);
});

test('欢迎文章在移动端使用原生折叠目录', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto('/posts/welcome/');

  const mobileToc = page.locator('[data-mobile-toc]');
  await expect(mobileToc).toBeVisible();
  await expect(mobileToc).not.toHaveAttribute('open', '');
  await mobileToc.locator('summary').press('Enter');
  await expect(mobileToc).toHaveAttribute('open', '');
  await expect(mobileToc.getByRole('link')).toHaveCount(3);
});

test('单篇公开文章不渲染封面、相邻文章或相关文章空模块', async ({ page }) => {
  await page.goto('/posts/welcome/');

  await expect(page.locator('[data-post-cover]')).toHaveCount(0);
  await expect(page.locator('[data-post-navigation]')).toHaveCount(0);
  await expect(page.locator('[data-related-posts]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '返回全部文章' })).toBeVisible();
});

test('禁用 JavaScript 后欢迎文章正文和目录锚点仍然可用', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4321',
    javaScriptEnabled: false,
    viewport: { width: 360, height: 900 },
  });
  const page = await context.newPage();

  try {
    await page.goto('/posts/welcome/');
    await expect(page.locator('[data-article-body]')).toContainText('为什么是静态博客');

    const mobileToc = page.locator('[data-mobile-toc]');
    await mobileToc.locator('summary').press('Enter');
    const tocLink = mobileToc.getByRole('link', { name: '为什么是静态博客' });
    await expect(tocLink).toBeVisible();
    await expect(tocLink).toHaveAttribute('href', '#为什么是静态博客');
    await expect(page.locator('.heading-anchor')).toHaveCount(0);
    await expect(page.locator('.code-copy-button')).toHaveCount(0);
  } finally {
    await context.close();
  }
});
