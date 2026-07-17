export interface NavigationItem {
  label: string;
  href: `/${string}`;
}

export const primaryNavigation = [
  { label: '首页', href: '/' },
  { label: '欢迎文章', href: '/posts/welcome/' },
] satisfies NavigationItem[];
