import type { MarkdownHeading } from 'astro';

import {
  comparePostRecords,
  sortPostRecords,
  type ListablePost,
} from './post-data.ts';

export interface TocItem {
  slug: string;
  text: string;
  children: TocItem[];
}

export interface PostNeighbors<T> {
  previous?: T;
  next?: T;
}

export interface RelatedPostOptions {
  limit?: number;
  excludeIds?: readonly string[];
}

function normalizeLimit(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.trunc(value));
}

function getReadableSource(source: string): string {
  return source
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/^\s*```.*$/gm, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#!>*_~`|{}\[\]()\-]/g, ' ');
}

export function calculateReadingMinutes(source: string): number {
  const readableSource = getReadableSource(source);
  const chineseCharacterCount = readableSource.match(/\p{Script=Han}/gu)?.length ?? 0;
  const latinWordCount = readableSource.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;
  const minutes = chineseCharacterCount / 300 + latinWordCount / 200;

  return Math.max(1, Math.ceil(minutes));
}

export function buildTableOfContents(headings: readonly MarkdownHeading[]): TocItem[] {
  const items: TocItem[] = [];
  let currentSection: TocItem | undefined;

  for (const heading of headings) {
    if (heading.depth === 2) {
      currentSection = {
        slug: heading.slug,
        text: heading.text,
        children: [],
      };
      items.push(currentSection);
      continue;
    }

    if (heading.depth !== 3) {
      continue;
    }

    const item = {
      slug: heading.slug,
      text: heading.text,
      children: [],
    } satisfies TocItem;

    if (currentSection) {
      currentSection.children.push(item);
    } else {
      items.push(item);
    }
  }

  return items;
}

export function getPostNeighbors<T extends ListablePost>(
  posts: readonly T[],
  currentId: string,
): PostNeighbors<T> {
  const sortedPosts = sortPostRecords(posts);
  const currentIndex = sortedPosts.findIndex((post) => post.id === currentId);

  if (currentIndex === -1) {
    return {};
  }

  return {
    previous: sortedPosts[currentIndex + 1],
    next: sortedPosts[currentIndex - 1],
  };
}

function countSharedTags(first: ListablePost, second: ListablePost): number {
  const firstTags = new Set(first.data.tags);
  const secondTags = new Set(second.data.tags);

  return [...secondTags].filter((tag) => firstTags.has(tag)).length;
}

export function selectRelatedPosts<T extends ListablePost>(
  posts: readonly T[],
  current: T,
  options: RelatedPostOptions = {},
): T[] {
  const excludedIds = new Set([current.id, ...(options.excludeIds ?? [])]);
  const limit = normalizeLimit(options.limit, 3);

  return posts
    .filter((post) => !excludedIds.has(post.id))
    .map((post) => ({ post, sharedTagCount: countSharedTags(current, post) }))
    .filter(({ sharedTagCount }) => sharedTagCount > 0)
    .sort((first, second) => {
      const sharedTagDifference = second.sharedTagCount - first.sharedTagCount;

      if (sharedTagDifference !== 0) {
        return sharedTagDifference;
      }

      return comparePostRecords(first.post, second.post);
    })
    .slice(0, limit)
    .map(({ post }) => post);
}
