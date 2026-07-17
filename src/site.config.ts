import { resolveSiteUrl } from './lib/site-url.ts';

export interface SiteConfig {
  title: '旁注';
  tagline: '记录技术、生活与阅读之间的思考';
  description: string;
  locale: 'zh-CN';
  timezone: 'Asia/Shanghai';
  siteUrl: string;
  defaultOgImage: string;
  defaultOgImageAlt: string;
}

export const siteConfig = {
  title: '旁注',
  tagline: '记录技术、生活与阅读之间的思考',
  description:
    '旁注是一份记录技术、生活与阅读的中文个人刊物，收集实践中的方法、日常里的观察，以及值得反复翻阅的片段。',
  locale: 'zh-CN',
  timezone: 'Asia/Shanghai',
  siteUrl: resolveSiteUrl(import.meta.env?.SITE_URL),
  defaultOgImage: '/og-default.png',
  defaultOgImageAlt: '旁注：记录技术、生活与阅读之间的思考',
} satisfies SiteConfig;

export function getAbsoluteSiteUrl(path: `/${string}`): string {
  return new URL(path, siteConfig.siteUrl).toString();
}

export { resolveSiteUrl } from './lib/site-url.ts';
