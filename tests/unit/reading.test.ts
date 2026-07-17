import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildTableOfContents,
  calculateReadingMinutes,
  getPostNeighbors,
  selectRelatedPosts,
} from '../../src/lib/reading.ts';
import type { ListablePost } from '../../src/lib/post-data.ts';

type TestTag = 'technology' | 'life' | 'reading';
type TestPost = ListablePost<TestTag>;

function createPost(
  id: string,
  publishedAt: string,
  tags: TestTag[] = ['technology'],
): TestPost {
  return {
    id,
    data: {
      publishedAt: new Date(publishedAt),
      featured: false,
      tags,
    },
  };
}

test('阅读时间按中英文速率计算、向上取整且最少一分钟', () => {
  assert.equal(calculateReadingMinutes(''), 1);
  assert.equal(calculateReadingMinutes('中'.repeat(301)), 2);
  assert.equal(calculateReadingMinutes(`${'word '.repeat(201)}`), 2);
  assert.equal(calculateReadingMinutes(`${'中'.repeat(301)} ${'word '.repeat(201)}`), 3);
});

test('阅读时间忽略 Markdown 地址和标记但保留链接文字与代码内容', () => {
  const source = '[可读文字](https://example.com/a/very/long/path) `const value = 1`';

  assert.equal(calculateReadingMinutes(source), 1);
});

test('目录只保留二三级标题并把三级标题归入最近的二级标题', () => {
  const toc = buildTableOfContents([
    { depth: 1, slug: 'title', text: '标题' },
    { depth: 3, slug: 'orphan', text: '孤立三级标题' },
    { depth: 2, slug: 'section', text: '章节' },
    { depth: 3, slug: 'detail', text: '细节' },
    { depth: 4, slug: 'ignored', text: '忽略' },
  ]);

  assert.deepEqual(toc, [
    { slug: 'orphan', text: '孤立三级标题', children: [] },
    {
      slug: 'section',
      text: '章节',
      children: [{ slug: 'detail', text: '细节', children: [] }],
    },
  ]);
  assert.equal(buildTableOfContents([{ depth: 2, slug: 'only', text: '唯一标题' }]).length, 1);
});

test('相邻文章把较早文章作为上一篇、较新文章作为下一篇', () => {
  const newest = createPost('newest', '2026-03-01T08:00:00+08:00');
  const middle = createPost('middle', '2026-02-01T08:00:00+08:00');
  const oldest = createPost('oldest', '2026-01-01T08:00:00+08:00');
  const input = [oldest, newest, middle];

  assert.deepEqual(getPostNeighbors(input, 'middle'), {
    previous: oldest,
    next: newest,
  });
  assert.deepEqual(getPostNeighbors(input, 'newest'), { previous: middle, next: undefined });
  assert.deepEqual(getPostNeighbors(input, 'oldest'), { previous: undefined, next: middle });
  assert.deepEqual(getPostNeighbors(input, 'missing'), {});
  assert.deepEqual(input.map((post) => post.id), ['oldest', 'newest', 'middle']);
});

test('相关文章优先共同标签数量，再按日期和 slug 稳定排序', () => {
  const current = createPost('current', '2026-04-01T08:00:00+08:00', [
    'technology',
    'life',
  ]);
  const sharesTwo = createPost('shares-two', '2025-01-01T08:00:00+08:00', [
    'technology',
    'life',
  ]);
  const newerOne = createPost('newer-one', '2026-03-01T08:00:00+08:00', ['life']);
  const sameDateA = createPost('same-a', '2026-02-01T08:00:00+08:00', ['technology']);
  const sameDateB = createPost('same-b', '2026-02-01T08:00:00+08:00', ['technology']);
  const unrelated = createPost('unrelated', '2026-05-01T08:00:00+08:00', ['reading']);

  assert.deepEqual(
    selectRelatedPosts(
      [sameDateB, unrelated, current, sharesTwo, newerOne, sameDateA],
      current,
      { limit: 4 },
    ).map((post) => post.id),
    ['shares-two', 'newer-one', 'same-a', 'same-b'],
  );
});

test('相关文章支持上限和排除项，无共同标签时返回空数组', () => {
  const current = createPost('current', '2026-04-01T08:00:00+08:00');
  const first = createPost('first', '2026-03-01T08:00:00+08:00');
  const second = createPost('second', '2026-02-01T08:00:00+08:00');
  const unrelated = createPost('unrelated', '2026-01-01T08:00:00+08:00', ['reading']);
  const input = [second, unrelated, current, first];

  assert.deepEqual(
    selectRelatedPosts(input, current, { limit: 1, excludeIds: ['first'] }).map(
      (post) => post.id,
    ),
    ['second'],
  );
  assert.deepEqual(selectRelatedPosts([current, unrelated], current), []);
  assert.deepEqual(input.map((post) => post.id), ['second', 'unrelated', 'current', 'first']);
});
