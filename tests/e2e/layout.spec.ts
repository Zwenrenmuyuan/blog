import { expect, test } from '@playwright/test';

const routes = ['/', '/posts/welcome/'];
const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 900 },
  { width: 1280, height: 900 },
];

test('全站布局包含可访问的页头、正文和页脚', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('banner')).toBeVisible();
  const brand = page.getByRole('link', { name: '旁注', exact: true });
  await expect(brand).toBeVisible();
  await expect(brand.locator('.brand-mark')).toBeVisible();
  await expect(page.getByRole('main')).toHaveAttribute('id', 'main-content');
  await expect(page.getByRole('contentinfo')).toBeVisible();

  const skipLink = page.getByRole('link', { name: '跳到正文' });
  await skipLink.focus();
  await expect(skipLink).toBeVisible();
  await skipLink.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('页面声明站点图标且资源可访问', async ({ page, request }) => {
  await page.goto('/');

  await expect(page.locator('link[rel="icon"][href="/favicon.svg"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/apple-touch-icon.png',
  );

  for (const path of ['/favicon.svg', '/favicon-32x32.png', '/apple-touch-icon.png']) {
    const response = await request.get(path);
    expect(response.ok(), `${path} 无法访问`).toBe(true);
  }
});

test('首页和文章页在目标宽度下没有页面级横向滚动', async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    for (const route of routes) {
      await page.goto(route);

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));

      expect(dimensions.scrollWidth, `${route} 在 ${viewport.width}px 下发生横向溢出`).toBeLessThanOrEqual(
        dimensions.clientWidth,
      );
    }
  }
});

test('移动导航可以完全通过键盘操作', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');

  const navigation = page.locator('[data-mobile-navigation]');
  const summary = navigation.locator('summary');

  await expect(summary).toBeVisible();
  await summary.focus();
  await summary.press('Enter');
  await expect(navigation).toHaveAttribute('open', '');

  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('href', '/');

  await page.keyboard.press('Escape');
  await expect(navigation).not.toHaveAttribute('open', '');
  await expect(summary).toBeFocused();
});

test('桌面宽度直接展示横向导航', async ({ page }) => {
  for (const width of [768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    await expect(page.locator('[data-mobile-navigation] > summary')).toBeHidden();
    await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible();
    await expect(page.getByRole('link', { name: '首页', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: '文章', exact: true })).toBeVisible();
  }
});

test('禁用 JavaScript 后核心导航仍然可用', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4321',
    javaScriptEnabled: false,
    viewport: { width: 360, height: 800 },
  });
  const page = await context.newPage();

  try {
    await page.goto('/');

    const navigation = page.locator('[data-mobile-navigation]');
    const summary = navigation.locator('summary');
    await summary.press('Enter');
    await expect(navigation).toHaveAttribute('open', '');

    const postsLink = page.getByRole('link', { name: '文章', exact: true });
    await expect(postsLink).toBeVisible();
    await postsLink.click();
    await expect(page).toHaveURL('/posts/');
    await expect(page.getByRole('heading', { level: 1, name: '全部文章' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('减少动画偏好会关闭平滑滚动和明显过渡', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const motionStyles = await page.evaluate(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const bodyStyles = getComputedStyle(document.body);

    return {
      scrollBehavior: rootStyles.scrollBehavior,
      transitionDuration: bodyStyles.transitionDuration,
    };
  });

  expect(motionStyles.scrollBehavior).toBe('auto');
  expect(Number.parseFloat(motionStyles.transitionDuration)).toBeLessThanOrEqual(0.00001);
});
