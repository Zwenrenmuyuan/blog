export const POST_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const POST_ENTRY_PATTERN = /^([^/]+)\/index\.(?:md|mdx)$/;

export function isPostSlug(value: string): boolean {
  return POST_SLUG_PATTERN.test(value);
}

export function getPostSlugFromEntryPath(entryPath: string): string {
  const normalizedPath = entryPath.replaceAll('\\', '/');
  const match = POST_ENTRY_PATTERN.exec(normalizedPath);

  if (!match) {
    throw new Error(
      `文章必须保存为 src/content/posts/<slug>/index.md 或 index.mdx；当前文件为：${entryPath}`,
    );
  }

  const slug = match[1];

  if (!isPostSlug(slug)) {
    throw new Error(`文章 slug 只能包含小写英文、数字和连字符；当前值为：${slug}`);
  }

  return slug;
}
