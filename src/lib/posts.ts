import {
  getCollection,
  getEntry,
  type CollectionEntry,
} from 'astro:content';

import { isPostSlug } from './post-slug';

export type Post = CollectionEntry<'posts'>;

export interface PostQueryOptions {
  includeDrafts?: boolean;
}

function canIncludeDrafts(options: PostQueryOptions): boolean {
  return import.meta.env.DEV && (options.includeDrafts ?? true);
}

export function comparePosts(first: Post, second: Post): number {
  const dateDifference = second.data.publishedAt.getTime() - first.data.publishedAt.getTime();

  if (dateDifference !== 0) {
    return dateDifference;
  }

  if (first.id === second.id) {
    return 0;
  }

  return first.id < second.id ? -1 : 1;
}

export async function getPosts(options: PostQueryOptions = {}): Promise<Post[]> {
  const includeDrafts = canIncludeDrafts(options);
  const posts = await getCollection('posts', ({ data }) => includeDrafts || !data.draft);

  return posts.sort(comparePosts);
}

export async function getPostBySlug(
  slug: string,
  options: PostQueryOptions = {},
): Promise<Post | undefined> {
  if (!isPostSlug(slug)) {
    return undefined;
  }

  const post = await getEntry('posts', slug);

  if (!post || (post.data.draft && !canIncludeDrafts(options))) {
    return undefined;
  }

  return post;
}

export function getPostPath(post: Post | string): string {
  const slug = typeof post === 'string' ? post : post.id;

  if (!isPostSlug(slug)) {
    throw new Error(`无法为非法文章 slug 生成地址：${slug}`);
  }

  return `/posts/${slug}/`;
}
