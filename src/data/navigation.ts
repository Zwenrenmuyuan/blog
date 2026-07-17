export interface NavigationItem {
  label: string;
  href: `/${string}`;
  match: 'exact' | 'prefix';
}

export const primaryNavigation = [
  { label: '首页', href: '/', match: 'exact' },
  { label: '文章', href: '/posts/', match: 'prefix' },
  { label: '标签', href: '/tags/', match: 'prefix' },
  { label: '归档', href: '/archive/', match: 'exact' },
  { label: '关于', href: '/about/', match: 'exact' },
  { label: '搜索', href: '/search/', match: 'exact' },
] satisfies NavigationItem[];

export function isNavigationItemCurrent(item: NavigationItem, currentPath: string): boolean {
  if (item.match === 'exact') {
    return currentPath === item.href;
  }

  return currentPath === item.href || currentPath.startsWith(item.href);
}
