import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const publicRoutes = [
  '/',
  '/posts/',
  '/posts/welcome/',
  '/tags/',
  '/tags/technology/',
  '/tags/life/',
  '/tags/reading/',
  '/archive/',
  '/about/',
];

const pageContracts = [
  { route: '/', title: '旁注', heading: '旁注' },
  { route: '/posts/', title: '全部文章 | 旁注', heading: '全部文章' },
  { route: '/posts/welcome/', title: '欢迎来到旁注 | 旁注', heading: '欢迎来到旁注' },
  { route: '/tags/', title: '标签 | 旁注', heading: '标签' },
  { route: '/tags/technology/', title: '技术 | 标签 | 旁注', heading: '技术' },
  { route: '/tags/life/', title: '生活 | 标签 | 旁注', heading: '生活' },
  { route: '/tags/reading/', title: '阅读 | 标签 | 旁注', heading: '阅读' },
  { route: '/archive/', title: '归档 | 旁注', heading: '归档' },
  { route: '/about/', title: '关于 | 旁注', heading: '关于旁注' },
];

async function expectNoPageOverflow(page: Page, route: string): Promise<void> {
  await page.goto(route);
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth, `${route} 发生页面级横向溢出`).toBeLessThanOrEqual(
    dimensions.clientWidth,
  );
}

test('全部 M3 公开路由可以直接访问并具有正确页面语义', async ({ page }) => {
  for (const contract of pageContracts) {
    const response = await page.goto(contract.route);

    expect(response?.ok(), contract.route).toBe(true);
    await expect(page).toHaveTitle(contract.title);
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect(page.getByRole('heading', { level: 1, name: contract.heading })).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
  }
});

test('首页使用真实文章完成精选去重、最近更新和常用标签', async ({ page }) => {
  await page.goto('/');

  const featured = page.locator('[data-home-section="featured"]');
  const recent = page.locator('[data-home-section="recent"]');

  await expect(featured.locator('[data-post-card]')).toHaveCount(1);
  await expect(featured.locator('[data-post-slug="welcome"]')).toBeVisible();
  await expect(recent.locator('[data-post-card]')).toHaveCount(0);
  await expect(recent.locator('[data-empty-state]')).toContainText('暂时没有更多更新');
  await expect(page.locator('[data-home-section="tags"] li')).toHaveCount(3);
  await expect(page.getByRole('link', { name: '查看全部文章' })).toHaveAttribute('href', '/posts/');
});

test('文章列表、标签计数和归档使用同一份公开内容', async ({ page }) => {
  await page.goto('/posts/');
  await expect(page.locator('[data-post-list] [data-post-card]')).toHaveCount(1);
  await expect(page.locator('[data-post-slug="welcome"]')).toBeVisible();

  await page.goto('/tags/');
  for (const tagId of ['technology', 'life', 'reading']) {
    await expect(page.locator(`[data-tag-id="${tagId}"]`)).toContainText('1 篇文章');
  }

  for (const route of ['/tags/technology/', '/tags/life/', '/tags/reading/']) {
    await page.goto(route);
    await expect(page.locator('[data-post-slug="welcome"]')).toBeVisible();
  }

  await page.goto('/archive/');
  await expect(page.getByRole('heading', { level: 2, name: '2026年' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: '7月' })).toBeVisible();
  await expect(page.locator('[data-post-slug="welcome"]')).toContainText('欢迎来到旁注');
});

test('文章标签链接和栏目导航状态正确', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/posts/welcome/');

  const desktopNavigation = page.locator('.desktop-navigation');
  await expect(desktopNavigation.getByRole('link', { name: '文章', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );

  const technologyTag = page.getByRole('link', { name: '技术', exact: true }).last();
  await expect(technologyTag).toHaveAttribute('href', '/tags/technology/');
  await technologyTag.click();
  await expect(page).toHaveURL('/tags/technology/');
  await expect(desktopNavigation.getByRole('link', { name: '标签', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('公开发现页面不包含草稿内容或链接', async ({ page }) => {
  for (const route of ['/', '/posts/', '/tags/', '/tags/technology/', '/archive/']) {
    await page.goto(route);
    await expect(page.locator('body')).not.toContainText('Markdown 与 MDX 样式测试');
    await expect(page.locator('a[href="/posts/style-test/"]')).toHaveCount(0);
  }
});

test('未知标签和不存在地址使用自定义 404', async ({ page }) => {
  for (const route of ['/tags/unknown/', '/this-page-does-not-exist/']) {
    const response = await page.goto(route);

    expect(response?.status(), route).toBe(404);
    await expect(page).toHaveTitle('页面未找到 | 旁注');
    await expect(page.getByRole('heading', { level: 1, name: '页面没有找到' })).toBeVisible();
    await expect(page.getByRole('link', { name: '返回首页' })).toHaveAttribute('href', '/');
    await expect(page.getByRole('link', { name: '浏览全部文章' })).toHaveAttribute('href', '/posts/');
  }
});

test('全部核心页面在目标宽度下没有页面级横向滚动', async ({ page }) => {
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });

    for (const route of [...publicRoutes, '/this-page-does-not-exist/']) {
      await expectNoPageOverflow(page, route);
    }
  }
});

test('新增页面没有严重或致命的无障碍问题', async ({ page }) => {
  for (const route of ['/posts/', '/tags/', '/tags/technology/', '/archive/', '/about/', '/this-page-does-not-exist/']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    const blockingViolations = results.violations.filter(
      ({ impact }) => impact === 'serious' || impact === 'critical',
    );

    expect(blockingViolations, route).toEqual([]);
  }
});

test('所有公开页面的站内链接可访问并遵守尾斜杠规则', async ({ page, request }) => {
  const hrefs = new Set<string>();

  for (const route of publicRoutes) {
    await page.goto(route);
    const routeHrefs = await page.locator('a[href^="/"]').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')).filter((href): href is string => href !== null),
    );
    routeHrefs.forEach((href) => hrefs.add(href));
  }

  for (const href of hrefs) {
    const path = new URL(href, 'http://127.0.0.1:4321').pathname;
    expect(path === '/' || path === '/404.html' || path.endsWith('/'), href).toBe(true);

    const response = await request.get(path);
    expect(response.ok(), href).toBe(true);
  }
});
