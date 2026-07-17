// @ts-check
import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

export default defineConfig({
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
  integrations: [mdx()],
});
