export const LOCAL_SITE_URL = 'http://localhost:4321/';

export function resolveSiteUrl(value: string | undefined): string {
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
