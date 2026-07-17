import assert from 'node:assert/strict';
import { test } from 'node:test';

import { RSS_ITEM_LIMIT, selectRssPosts } from '../../src/lib/feed.ts';
import {
  createStructuredData,
  getDefaultSeoImage,
  resolveSeoImage,
  serializeJsonLd,
  type JsonLdValue,
} from '../../src/lib/seo.ts';
import { getAbsoluteSiteUrl } from '../../src/site.config.ts';
import { resolveSiteUrl } from '../../src/lib/site-url.ts';

function asRecord(value: JsonLdValue | undefined): Record<string, JsonLdValue | undefined> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value));
  return value;
}

test('站点地址校验根地址并生成绝对 URL', () => {
  assert.equal(resolveSiteUrl(undefined), 'http://localhost:4321/');
  assert.equal(resolveSiteUrl('https://pangzhu.example'), 'https://pangzhu.example/');
  assert.equal(getAbsoluteSiteUrl('/posts/'), 'http://localhost:4321/posts/');

  for (const invalid of [
    '',
    'ftp://example.com/',
    'https://user@example.com/',
    'https://example.com/subpath/',
    'https://example.com/?query=1',
    'https://example.com/#fragment',
  ]) {
    assert.throws(() => resolveSiteUrl(invalid), /SITE_URL/);
  }
});

test('RSS 只选择最近二十项且不修改输入数组', () => {
  const input = Array.from({ length: RSS_ITEM_LIMIT + 5 }, (_, index) => ({ id: index }));
  const selected = selectRssPosts(input);

  assert.equal(selected.length, RSS_ITEM_LIMIT);
  assert.deepEqual(selected.map(({ id }) => id), Array.from({ length: RSS_ITEM_LIMIT }, (_, index) => index));
  assert.equal(input.length, RSS_ITEM_LIMIT + 5);
  assert.notEqual(selected, input);
  assert.deepEqual(selectRssPosts([]), []);
});

test('分享图默认回退并保留文章封面信息', () => {
  assert.deepEqual(getDefaultSeoImage(), {
    src: '/og-default.png',
    alt: '旁注：生活和工作是正文，这里记录沿途的旁注',
    width: 1200,
    height: 630,
  });

  const cover = { src: '/_astro/cover.png', alt: '文章封面', width: 1200, height: 675 };
  assert.equal(resolveSeoImage(cover), cover);
  assert.deepEqual(resolveSeoImage(), getDefaultSeoImage());
});

test('首页、栏目和关于页生成对应结构化数据', () => {
  const home = asRecord(
    createStructuredData({
      pageKind: 'home',
      canonicalUrl: 'http://localhost:4321/',
      title: '旁注｜生活和工作是正文，这里记录沿途的旁注',
      description: '站点摘要',
    })[0],
  );
  const graph = home['@graph'];
  assert.ok(Array.isArray(graph));
  assert.deepEqual(graph.map((entry) => asRecord(entry)['@type']), ['WebSite', 'Blog', 'Organization']);

  const collection = asRecord(
    createStructuredData({
      pageKind: 'collection',
      canonicalUrl: 'http://localhost:4321/tags/',
      title: '标签｜旁注',
      description: '标签摘要',
    })[0],
  );
  assert.equal(collection['@type'], 'CollectionPage');

  const about = asRecord(
    createStructuredData({
      pageKind: 'about',
      canonicalUrl: 'http://localhost:4321/about/',
      title: '关于｜旁注',
      description: '关于摘要',
    })[0],
  );
  assert.equal(about['@type'], 'AboutPage');
});

test('文章结构化数据使用正文标题、日期、标签和真实封面且不输出作者', () => {
  const article = asRecord(
    createStructuredData({
      pageKind: 'article',
      canonicalUrl: 'http://localhost:4321/posts/example/',
      title: '示例文章｜旁注',
      description: '文章摘要',
      image: { src: '/_astro/cover.png', alt: '文章封面', width: 1200, height: 675 },
      article: {
        headline: '示例文章',
        publishedAt: new Date('2026-07-17T09:00:00+08:00'),
        updatedAt: new Date('2026-07-18T09:00:00+08:00'),
        tags: ['技术', '阅读'],
        draft: false,
      },
    })[0],
  );

  assert.equal(article['@type'], 'BlogPosting');
  assert.equal(article.headline, '示例文章');
  assert.equal(article.datePublished, '2026-07-17T01:00:00.000Z');
  assert.equal(article.dateModified, '2026-07-18T01:00:00.000Z');
  assert.deepEqual(article.keywords, ['技术', '阅读']);
  assert.equal('author' in article, false);
  assert.equal(asRecord(article.publisher)['@type'], 'Organization');
  assert.equal(asRecord(article.image).url, 'http://localhost:4321/_astro/cover.png');

  const withoutCover = asRecord(
    createStructuredData({
      pageKind: 'article',
      canonicalUrl: 'http://localhost:4321/posts/no-cover/',
      title: '无封面文章｜旁注',
      description: '文章摘要',
      article: {
        headline: '无封面文章',
        publishedAt: new Date('2026-07-17T09:00:00+08:00'),
        tags: ['生活'],
        draft: false,
      },
    })[0],
  );
  assert.equal(withoutCover.dateModified, withoutCover.datePublished);
  assert.equal('image' in withoutCover, false);
});

test('搜索、404 和草稿不生成结构化数据', () => {
  assert.deepEqual(
    createStructuredData({
      pageKind: 'search',
      canonicalUrl: 'http://localhost:4321/search/',
      title: '搜索｜旁注',
      description: '搜索摘要',
    }),
    [],
  );
  assert.deepEqual(
    createStructuredData({
      pageKind: 'not-found',
      title: '页面未找到｜旁注',
      description: '页面不存在',
    }),
    [],
  );
  assert.deepEqual(
    createStructuredData({
      pageKind: 'article',
      title: '草稿｜旁注',
      description: '草稿摘要',
      article: {
        headline: '草稿',
        publishedAt: new Date('2026-07-17T09:00:00+08:00'),
        tags: ['技术'],
        draft: true,
      },
    }),
    [],
  );
});

test('JSON-LD 序列化转义 HTML 边界字符且仍可解析', () => {
  const value = { text: '</script>&>\u2028\u2029' };
  const serialized = serializeJsonLd(value);

  assert.equal(serialized.includes('<'), false);
  assert.equal(serialized.includes('>'), false);
  assert.equal(serialized.includes('&'), false);
  assert.deepEqual(JSON.parse(serialized), value);
});
