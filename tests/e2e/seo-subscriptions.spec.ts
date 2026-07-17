import { existsSync, readdirSync, readFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

const siteUrl = 'https://pangzhu.example';
const indexableRoutes = [
  '/',
  '/about/',
  '/archive/',
  '/posts/',
  '/posts/welcome/',
  '/tags/',
  '/tags/life/',
  '/tags/reading/',
  '/tags/technology/',
];

async function parseXml(page: Page, xml: string): Promise<{ valid: boolean; locations: string[] }> {
  return page.evaluate((source) => {
    const document = new DOMParser().parseFromString(source, 'application/xml');
    return {
      valid: document.querySelector('parsererror') === null,
      locations: Array.from(document.getElementsByTagName('loc'), (node) => node.textContent ?? ''),
    };
  }, xml);
}

test('公开页面使用唯一 canonical、完整分享元数据和 RSS 自动发现', async ({ page }) => {
  for (const route of [...indexableRoutes, '/search/']) {
    await page.goto(route);

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical, route).toHaveCount(1);
    await expect(canonical).toHaveAttribute('href', `${siteUrl}${route}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `${siteUrl}${route}`,
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'zh_CN');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      `${siteUrl}/og-default.png`,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
    await expect(page.locator('link[type="application/rss+xml"]')).toHaveCount(1);
    await expect(page.locator('link[type="application/rss+xml"]')).toHaveAttribute(
      'href',
      `${siteUrl}/rss.xml`,
    );
  }

  await page.goto('/search/?q=静态');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${siteUrl}/search/`,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});

test('首页、栏目、关于和文章输出正确 JSON-LD', async ({ page }) => {
  await page.goto('/');
  const home = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? '{}');
  expect(home['@graph'].map((entry: { '@type': string }) => entry['@type'])).toEqual([
    'WebSite',
    'Blog',
    'Organization',
  ]);

  await page.goto('/tags/technology/');
  const collection = JSON.parse(
    await page.locator('script[type="application/ld+json"]').textContent() ?? '{}',
  );
  expect(collection['@type']).toBe('CollectionPage');

  await page.goto('/about/');
  const about = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? '{}');
  expect(about['@type']).toBe('AboutPage');

  await page.goto('/posts/welcome/');
  const article = JSON.parse(
    await page.locator('script[type="application/ld+json"]').textContent() ?? '{}',
  );
  expect(article['@type']).toBe('BlogPosting');
  expect(article.headline).toBe('欢迎来到旁注');
  expect(article.keywords).toEqual(['技术', '生活', '阅读']);
  expect(article.author).toBeUndefined();
  expect(article.publisher.name).toBe('旁注');
  expect(article.image).toBeUndefined();
});

test('404 不输出 canonical、分享元数据或结构化数据', async ({ page }) => {
  const response = await page.goto('/missing-seo-page/');

  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property^="og:"]')).toHaveCount(0);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});

test('默认分享图尺寸为 1200×630', async ({ page, request }) => {
  const response = await request.get('/og-default.png');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('image/png');

  await page.goto('/');
  const dimensions = await page.evaluate(async () => {
    const image = new Image();
    image.src = '/og-default.png';
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  });
  expect(dimensions).toEqual({ width: 1200, height: 630 });
});

test('RSS、sitemap 和 robots 使用站点配置并排除草稿', async ({ page, request }) => {
  const rssResponse = await request.get('/rss.xml');
  expect(rssResponse.ok()).toBe(true);
  expect(rssResponse.headers()['content-type']).toMatch(/xml/);
  const rssText = await rssResponse.text();
  const rss = await parseXml(page, rssText);
  expect(rss.valid).toBe(true);
  expect(rssText).toContain('<language>zh-CN</language>');
  expect(rssText).toContain(`${siteUrl}/posts/welcome/`);
  expect(rssText.match(/<item>/g)).toHaveLength(1);
  expect(rssText.match(/<category>/g)).toHaveLength(3);
  expect(rssText).not.toContain('style-test');

  const sitemapIndexResponse = await request.get('/sitemap-index.xml');
  const sitemapIndex = await parseXml(page, await sitemapIndexResponse.text());
  expect(sitemapIndex.valid).toBe(true);
  expect(sitemapIndex.locations).toEqual([`${siteUrl}/sitemap-0.xml`]);

  const sitemapResponse = await request.get('/sitemap-0.xml');
  const sitemap = await parseXml(page, await sitemapResponse.text());
  expect(sitemap.valid).toBe(true);
  expect(sitemap.locations.sort()).toEqual(indexableRoutes.map((route) => `${siteUrl}${route}`).sort());
  expect(sitemap.locations).not.toContain(`${siteUrl}/search/`);
  expect(sitemap.locations).not.toContain(`${siteUrl}/posts/style-test/`);

  const robotsResponse = await request.get('/robots.txt');
  expect(await robotsResponse.text()).toBe(
    `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap-index.xml\n`,
  );
});

test('生产产物保持纯静态并仅索引公开文章', async () => {
  expect(existsSync('dist/pagefind/pagefind.js')).toBe(true);
  expect(existsSync('dist/posts/style-test')).toBe(false);
  expect(existsSync('dist/_worker.js')).toBe(false);
  expect(existsSync('dist/functions')).toBe(false);

  const generatedAssets = readdirSync('dist/_astro');
  expect(generatedAssets.some((name) => name.includes('reading-fixture'))).toBe(false);
  expect(readFileSync('dist/posts/welcome/index.html', 'utf8')).not.toContain('style-test');
});
