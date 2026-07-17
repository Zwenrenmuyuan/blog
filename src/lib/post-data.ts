export interface ListablePost<Tag extends string = string> {
  id: string;
  data: {
    publishedAt: Date;
    featured: boolean;
    tags: readonly Tag[];
  };
}

export interface HomepagePostSelection<T> {
  featured: T[];
  recent: T[];
}

export interface HomepagePostOptions {
  featuredLimit?: number;
  recentLimit?: number;
}

export interface TagDefinition<Tag extends string> {
  id: Tag;
  label: string;
  description: string;
}

export interface TagCount<Tag extends string = string> extends TagDefinition<Tag> {
  count: number;
}

export interface ArchiveMonth<T> {
  key: string;
  month: number;
  label: string;
  posts: T[];
}

export interface ArchiveYear<T> {
  year: number;
  months: ArchiveMonth<T>[];
}

function normalizeLimit(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.trunc(value));
}

export function comparePostRecords<T extends ListablePost>(first: T, second: T): number {
  const dateDifference = second.data.publishedAt.getTime() - first.data.publishedAt.getTime();

  if (dateDifference !== 0) {
    return dateDifference;
  }

  if (first.id === second.id) {
    return 0;
  }

  return first.id < second.id ? -1 : 1;
}

export function sortPostRecords<T extends ListablePost>(posts: readonly T[]): T[] {
  return [...posts].sort(comparePostRecords);
}

export function selectHomepagePosts<T extends ListablePost>(
  posts: readonly T[],
  options: HomepagePostOptions = {},
): HomepagePostSelection<T> {
  const featuredLimit = normalizeLimit(options.featuredLimit, 3);
  const recentLimit = normalizeLimit(options.recentLimit, 6);
  const sortedPosts = sortPostRecords(posts);
  const featured = sortedPosts.filter((post) => post.data.featured).slice(0, featuredLimit);
  const selectedIds = new Set(featured.map((post) => post.id));

  if (featured.length < featuredLimit) {
    for (const post of sortedPosts) {
      if (featured.length >= featuredLimit) {
        break;
      }

      if (!post.data.featured && !selectedIds.has(post.id)) {
        featured.push(post);
        selectedIds.add(post.id);
      }
    }
  }

  const recent = sortedPosts
    .filter((post) => !selectedIds.has(post.id))
    .slice(0, recentLimit);

  return { featured, recent };
}

export function countPostsByTag<Tag extends string, T extends ListablePost<Tag>>(
  posts: readonly T[],
  definitions: readonly TagDefinition<Tag>[],
): TagCount<Tag>[] {
  return definitions.map((definition) => ({
    ...definition,
    count: posts.reduce(
      (total, post) => total + (new Set(post.data.tags).has(definition.id) ? 1 : 0),
      0,
    ),
  }));
}

export function selectCommonTags<Tag extends string>(
  tagCounts: readonly TagCount<Tag>[],
  limit = 6,
): TagCount<Tag>[] {
  const registrationOrder = new Map(tagCounts.map((tag, index) => [tag.id, index]));

  return tagCounts
    .filter((tag) => tag.count > 0)
    .sort((first, second) => {
      const countDifference = second.count - first.count;

      if (countDifference !== 0) {
        return countDifference;
      }

      return (registrationOrder.get(first.id) ?? 0) - (registrationOrder.get(second.id) ?? 0);
    })
    .slice(0, normalizeLimit(limit, 6));
}

export function filterPostsByTag<T extends ListablePost>(
  posts: readonly T[],
  tagId: T['data']['tags'][number],
): T[] {
  return sortPostRecords(posts).filter((post) => post.data.tags.includes(tagId));
}

function getArchiveDateParts(date: Date, timeZone: string): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    timeZone,
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    throw new Error(`无法按时区 ${timeZone} 解析文章归档日期`);
  }

  return { year, month };
}

export function groupPostsByArchive<T extends ListablePost>(
  posts: readonly T[],
  timeZone: string,
): ArchiveYear<T>[] {
  const years = new Map<number, Map<number, T[]>>();

  for (const post of sortPostRecords(posts)) {
    const { year, month } = getArchiveDateParts(post.data.publishedAt, timeZone);
    const months = years.get(year) ?? new Map<number, T[]>();
    const monthPosts = months.get(month) ?? [];

    monthPosts.push(post);
    months.set(month, monthPosts);
    years.set(year, months);
  }

  return [...years.entries()]
    .sort(([first], [second]) => second - first)
    .map(([year, months]) => ({
      year,
      months: [...months.entries()]
        .sort(([first], [second]) => second - first)
        .map(([month, monthPosts]) => ({
          key: `${year}-${String(month).padStart(2, '0')}`,
          month,
          label: `${month}月`,
          posts: monthPosts,
        })),
    }));
}
