import { resolveSiteUrl } from './lib/site-url.ts';

export interface SiteConfig {
  title: '旁注';
  tagline: '生活和工作是正文，这里记录沿途的旁注';
  description: string;
  locale: 'zh-CN';
  timezone: 'Asia/Shanghai';
  siteUrl: string;
  defaultOgImage: string;
  defaultOgImageAlt: string;
}

export const siteConfig = {
  title: '旁注',
  tagline: '生活和工作是正文，这里记录沿途的旁注',
  description: '旁注是一个记录技术实践、生活观察和阅读思考的个人博客。',
  locale: 'zh-CN',
  timezone: 'Asia/Shanghai',
  siteUrl: resolveSiteUrl(import.meta.env?.SITE_URL),
  defaultOgImage: '/og-default.png',
  defaultOgImageAlt: '旁注：生活和工作是正文，这里记录沿途的旁注',
} satisfies SiteConfig;

export function getAbsoluteSiteUrl(path: `/${string}`): string {
  return new URL(path, siteConfig.siteUrl).toString();
}

export { resolveSiteUrl } from './lib/site-url.ts';
