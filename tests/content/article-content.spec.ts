import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const route = '/posts/style-test/';
const imageAlt = '一只深色咖啡杯、打开的书和笔记纸被电路线条连接在暖白纸张上';

test('草稿样式页渲染完整正文、封面和 MDX 内容', async ({ page }) => {
  const response = await page.goto(route);

  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { level: 1, name: 'Markdown 与 MDX 样式测试' })).toBeVisible();
  await expect(page.getByText('草稿预览')).toBeVisible();
  await expect(page.locator('[data-reading-time]')).toHaveText(/约 \d+ 分钟阅读/);
  await expect(page.locator('[data-post-cover] img')).toHaveAttribute('alt', imageAlt);
  await expect(page.locator('.task-list-item')).toHaveCount(3);
  await expect(page.locator('.footnotes')).toContainText('静态页面不代表功能简单');
  await expect(page.getByLabel('MDX 示例')).toContainText('MDX 渲染链路');
  await expect(page.locator('pre[data-language="ts"]')).toBeVisible();
  await expect(page.locator('table')).toBeVisible();
});

test('目录在宽屏使用固定侧栏，在窄屏使用折叠目录且页面不溢出', async ({ page }) => {
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(dimensions.scrollWidth, `${width}px 下发生页面级横向溢出`).toBeLessThanOrEqual(
      dimensions.clientWidth,
    );

    if (width >= 1024) {
      await expect(page.locator('.article-toc--desktop')).toBeVisible();
      await expect(page.locator('[data-mobile-toc]')).toBeHidden();
      await expect(page.locator('.article-toc__sticky')).toHaveCSS('position', 'sticky');
    } else {
      await expect(page.locator('.article-toc--desktop')).toBeHidden();
      await expect(page.locator('[data-mobile-toc]')).toBeVisible();
    }
  }
});

test('目录和标题永久链接使用同一静态锚点', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route);

  const tocLink = page.locator('.article-toc--desktop a[href="#代码"]');
  await tocLink.click();

  expect(await page.evaluate(() => decodeURIComponent(window.location.hash))).toBe('#代码');
  await expect(page.locator('h3#代码')).toBeVisible();
  await expect(page.getByRole('link', { name: '链接到“代码”' })).toHaveAttribute('href', '#代码');
  await expect(page.locator('.article-toc a[href="#footnote-label"]')).toHaveCount(0);
});

test('代码复制成功时复制纯文本并反馈状态', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          (window as typeof window & { copiedCode?: string }).copiedCode = value;
        },
      },
    });
  });
  await page.goto(route);

  const copyButton = page.getByRole('button', { name: '复制代码' });
  await copyButton.click();

  await expect(copyButton).toHaveText('已复制');
  expect(
    await page.evaluate(() => (window as typeof window & { copiedCode?: string }).copiedCode),
  ).toContain('interface Note');
});

test('代码复制失败时提供明确反馈', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => Promise.reject(new Error('denied')),
      },
    });
  });
  await page.goto(route);

  const copyButton = page.getByRole('button', { name: '复制代码' });
  await copyButton.click();

  await expect(copyButton).toHaveText('复制失败');
});

test('外链获得新窗口安全属性，站内和哈希链接保持原行为', async ({ page }) => {
  await page.goto(route);

  const externalLink = page.getByRole('link', { name: '普通链接' });
  await expect(externalLink).toHaveAttribute('target', '_blank');
  await expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');

  const tagLink = page.getByRole('link', { name: '技术', exact: true }).last();
  await expect(tagLink).not.toHaveAttribute('target', '_blank');
  await expect(page.locator('.article-toc a[href="#代码"]').first()).not.toHaveAttribute(
    'target',
    '_blank',
  );
});

test('封面和正文图片具有响应式资源、固有尺寸和准确替代文本', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto(route);

  const images = page.getByRole('img', { name: imageAlt });
  await expect(images).toHaveCount(2);

  for (let index = 0; index < 2; index += 1) {
    const image = images.nth(index);
    await expect(image).toHaveAttribute('width', '1200');
    await expect(image).toHaveAttribute('height', '675');
    await expect(image).toHaveAttribute('srcset', /360w.*720w/);

    const dimensions = await image.evaluate((element) => ({
      clientWidth: element.clientWidth,
      naturalWidth: (element as HTMLImageElement).naturalWidth,
      parentWidth: element.parentElement?.clientWidth ?? 0,
    }));
    expect(dimensions.naturalWidth).toBeGreaterThan(0);
    expect(dimensions.clientWidth).toBeLessThanOrEqual(dimensions.parentWidth);
  }

  await expect(images.nth(0)).toHaveAttribute('loading', 'eager');
  await expect(images.nth(1)).toHaveAttribute('loading', 'lazy');
});

test('深浅色样式测试页通过无障碍检查', async ({ page }) => {
  for (const theme of ['light', 'dark']) {
    await page.goto('/');
    await page.evaluate((value) => window.localStorage.setItem('pangzhu-theme', value), theme);
    await page.goto(route);

    const results = await new AxeBuilder({ page }).analyze();
    const blockingViolations = results.violations.filter(
      ({ impact }) => impact === 'serious' || impact === 'critical',
    );

    expect(blockingViolations, theme).toEqual([]);
  }
});

test('禁用 JavaScript 后正文、目录、代码、图片和外链仍可访问', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4323',
    javaScriptEnabled: false,
    viewport: { width: 360, height: 900 },
  });
  const page = await context.newPage();

  try {
    await page.goto(route);

    await expect(page.getByRole('heading', { level: 1, name: 'Markdown 与 MDX 样式测试' })).toBeVisible();
    const mobileToc = page.locator('[data-mobile-toc]');
    await mobileToc.locator('summary').press('Enter');
    await expect(mobileToc).toHaveAttribute('open', '');
    await expect(mobileToc.locator('a[href="#代码"]')).toBeVisible();
    await expect(page.locator('pre[data-language="ts"]')).toBeVisible();
    await expect(page.getByRole('img', { name: imageAlt })).toHaveCount(2);
    await expect(page.locator('.code-copy-button')).toHaveCount(0);
    await expect(page.locator('.heading-anchor')).toHaveCount(0);

    const externalLink = page.getByRole('link', { name: '普通链接' });
    await expect(externalLink).toHaveAttribute('href', 'https://example.com/');
    await expect(externalLink).not.toHaveAttribute('target', '_blank');
  } finally {
    await context.close();
  }
});
