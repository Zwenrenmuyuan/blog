const LOCAL_SITE_URL = 'http://localhost:4321/';

function resolveSiteUrl(value: string | undefined): string {
  const candidate = value === undefined ? LOCAL_SITE_URL : value.trim();

  try {
    const url = new URL(candidate);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('unsupported protocol');
    }

    if (url.username || url.password || url.search || url.hash) {
      throw new Error('credentials, query parameters, and fragments are not allowed');
    }

    if (url.pathname !== '/') {
      throw new Error('subpath deployment is not supported');
    }

    return url.toString();
  } catch {
    throw new Error(
      `SITE_URL 必须是合法的 http(s) 站点根地址，且不得包含子路径、凭据、查询参数或片段；当前值为：${JSON.stringify(candidate)}`,
    );
  }
}

export interface SiteConfig {
  title: '旁注';
  tagline: '记录技术、生活与阅读之间的思考';
  description: string;
  locale: 'zh-CN';
  timezone: 'Asia/Shanghai';
  siteUrl: string;
  defaultOgImage: string;
}

export const siteConfig = {
  title: '旁注',
  tagline: '记录技术、生活与阅读之间的思考',
  description:
    '旁注是一份记录技术、生活与阅读的中文个人刊物，收集实践中的方法、日常里的观察，以及值得反复翻阅的片段。',
  locale: 'zh-CN',
  timezone: 'Asia/Shanghai',
  siteUrl: resolveSiteUrl(import.meta.env.SITE_URL),
  defaultOgImage: '/og-default.png',
} satisfies SiteConfig;
