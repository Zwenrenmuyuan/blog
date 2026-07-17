import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  countPostsByTag,
  filterPostsByTag,
  groupPostsByArchive,
  selectCommonTags,
  selectHomepagePosts,
  sortPostRecords,
  type ListablePost,
  type TagDefinition,
} from '../../src/lib/post-data.ts';

type TestTag = 'technology' | 'life' | 'reading';
type TestPost = ListablePost<TestTag>;

const tagDefinitions: TagDefinition<TestTag>[] = [
  { id: 'technology', label: '技术', description: '工程实践与技术思考' },
  { id: 'life', label: '生活', description: '日常观察与个人经验' },
  { id: 'reading', label: '阅读', description: '书籍、文章与阅读笔记' },
];

function createPost(
  id: string,
  publishedAt: string,
  options: { featured?: boolean; tags?: TestTag[] } = {},
): TestPost {
  return {
    id,
    data: {
      publishedAt: new Date(publishedAt),
      featured: options.featured ?? false,
      tags: options.tags ?? ['technology'],
    },
  };
}

test('文章按日期倒序、同日 slug 升序排列且不修改输入数组', () => {
  const older = createPost('older', '2025-12-01T08:00:00+08:00');
  const sameDateB = createPost('same-b', '2026-01-01T08:00:00+08:00');
  const sameDateA = createPost('same-a', '2026-01-01T08:00:00+08:00');
  const input = [older, sameDateB, sameDateA];

  assert.deepEqual(sortPostRecords(input).map((post) => post.id), ['same-a', 'same-b', 'older']);
  assert.deepEqual(input.map((post) => post.id), ['older', 'same-b', 'same-a']);
});

test('首页选择兼容零文章和一篇文章', () => {
  assert.deepEqual(selectHomepagePosts([]), { featured: [], recent: [] });

  const onlyPost = createPost('only', '2026-01-01T08:00:00+08:00', { featured: true });
  const selection = selectHomepagePosts([onlyPost]);

  assert.deepEqual(selection.featured.map((post) => post.id), ['only']);
  assert.deepEqual(selection.recent, []);
});

test('精选不足时用最新非精选文章补位并从最近更新去重', () => {
  const posts = [
    createPost('newest-regular', '2026-06-04T08:00:00+08:00'),
    createPost('featured', '2026-06-03T08:00:00+08:00', { featured: true }),
    createPost('second-regular', '2026-06-02T08:00:00+08:00'),
    createPost('remaining', '2026-06-01T08:00:00+08:00'),
  ];
  const selection = selectHomepagePosts(posts);

  assert.deepEqual(selection.featured.map((post) => post.id), [
    'featured',
    'newest-regular',
    'second-regular',
  ]);
  assert.deepEqual(selection.recent.map((post) => post.id), ['remaining']);
  assert.equal(
    new Set([...selection.featured, ...selection.recent].map((post) => post.id)).size,
    4,
  );
});

test('超过三篇精选时只展示最新三篇，其余精选可进入最近更新', () => {
  const posts = [
    createPost('featured-1', '2026-06-05T08:00:00+08:00', { featured: true }),
    createPost('featured-2', '2026-06-04T08:00:00+08:00', { featured: true }),
    createPost('featured-3', '2026-06-03T08:00:00+08:00', { featured: true }),
    createPost('featured-4', '2026-06-02T08:00:00+08:00', { featured: true }),
    createPost('regular', '2026-06-01T08:00:00+08:00'),
  ];
  const selection = selectHomepagePosts(posts);

  assert.deepEqual(selection.featured.map((post) => post.id), [
    'featured-1',
    'featured-2',
    'featured-3',
  ]);
  assert.deepEqual(selection.recent.map((post) => post.id), ['featured-4', 'regular']);
});

test('最近更新最多展示六篇', () => {
  const posts = Array.from({ length: 11 }, (_, index) =>
    createPost(
      `post-${String(index).padStart(2, '0')}`,
      `2026-05-${String(11 - index).padStart(2, '0')}T08:00:00+08:00`,
    ),
  );
  const selection = selectHomepagePosts(posts);

  assert.equal(selection.featured.length, 3);
  assert.equal(selection.recent.length, 6);
});

test('标签计数保留零文章标签，常用标签按数量和注册顺序排列', () => {
  const posts = [
    createPost('one', '2026-01-03T08:00:00+08:00', { tags: ['technology', 'life'] }),
    createPost('two', '2026-01-02T08:00:00+08:00', { tags: ['technology'] }),
  ];
  const counts = countPostsByTag(posts, tagDefinitions);

  assert.deepEqual(counts.map(({ id, count }) => ({ id, count })), [
    { id: 'technology', count: 2 },
    { id: 'life', count: 1 },
    { id: 'reading', count: 0 },
  ]);
  assert.deepEqual(selectCommonTags(counts).map((tag) => tag.id), ['technology', 'life']);

  const tiedCounts = countPostsByTag(
    [createPost('all', '2026-01-01T08:00:00+08:00', { tags: ['technology', 'life', 'reading'] })],
    tagDefinitions,
  );
  assert.deepEqual(selectCommonTags(tiedCounts).map((tag) => tag.id), [
    'technology',
    'life',
    'reading',
  ]);
});

test('标签筛选保持全站文章顺序', () => {
  const posts = [
    createPost('old', '2025-01-01T08:00:00+08:00', { tags: ['reading'] }),
    createPost('new', '2026-01-01T08:00:00+08:00', { tags: ['reading'] }),
    createPost('other', '2026-02-01T08:00:00+08:00', { tags: ['technology'] }),
  ];

  assert.deepEqual(filterPostsByTag(posts, 'reading').map((post) => post.id), ['new', 'old']);
});

test('归档使用上海时区并按年、月和文章顺序分组', () => {
  const posts = [
    createPost('utc-boundary', '2026-06-30T16:30:00.000Z'),
    createPost('june', '2026-06-15T08:00:00+08:00'),
    createPost('previous-year', '2025-12-31T08:00:00+08:00'),
  ];
  const archive = groupPostsByArchive(posts, 'Asia/Shanghai');

  assert.deepEqual(archive.map((year) => year.year), [2026, 2025]);
  assert.deepEqual(archive[0]?.months.map((month) => month.month), [7, 6]);
  assert.deepEqual(archive[0]?.months[0]?.posts.map((post) => post.id), ['utc-boundary']);
  assert.equal(archive[0]?.months[0]?.key, '2026-07');
  assert.equal(archive[0]?.months[0]?.label, '7月');
});
