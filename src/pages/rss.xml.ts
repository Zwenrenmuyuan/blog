import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';

import { getTag } from '../data/tags';
import { selectRssPosts } from '../lib/feed';
import { getPostPath, getPublishedPosts } from '../lib/posts';
import { siteConfig } from '../site.config';

export const GET: APIRoute = async ({ site }) => {
  const posts = selectRssPosts(await getPublishedPosts());

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: site ?? new URL(siteConfig.siteUrl),
    trailingSlash: true,
    customData: `<language>${siteConfig.locale}</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      categories: post.data.tags.map((tagId) => getTag(tagId).label),
      link: getPostPath(post),
    })),
  });
};
