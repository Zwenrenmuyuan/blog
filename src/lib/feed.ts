export const RSS_ITEM_LIMIT = 20;

export function selectRssPosts<T>(posts: readonly T[]): T[] {
  return posts.slice(0, RSS_ITEM_LIMIT);
}
