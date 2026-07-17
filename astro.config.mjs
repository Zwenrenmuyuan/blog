// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import { resolveSiteUrl } from './src/lib/site-url.ts';

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const environment = loadEnv(mode, process.cwd(), '');
const site = resolveSiteUrl(environment.SITE_URL);

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  image: {
    layout: 'constrained',
    responsiveStyles: true,
    breakpoints: [360, 720, 1080, 1440],
  },
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
    },
  },
  integrations: [
    mdx(),
    sitemap({
      filter(page) {
        const pathname = new URL(page).pathname;

        return pathname !== '/search/' && pathname !== '/404/' && pathname !== '/404.html';
      },
    }),
  ],
});
