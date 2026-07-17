import type { APIRoute } from 'astro';

import { siteConfig } from '../site.config';

export const GET: APIRoute = ({ site }) => {
  const siteUrl = site ?? new URL(siteConfig.siteUrl);
  const sitemapUrl = new URL('/sitemap-index.xml', siteUrl).toString();

  return new Response(`User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
