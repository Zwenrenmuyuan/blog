export const tagIds = ['technology', 'life', 'reading'] as const;

export type TagId = (typeof tagIds)[number];

export interface Tag {
  label: string;
  description: string;
}

export const tags = {
  technology: {
    label: '技术',
    description: '工程实践与技术思考',
  },
  life: {
    label: '生活',
    description: '日常观察与个人经验',
  },
  reading: {
    label: '阅读',
    description: '书籍、文章与阅读笔记',
  },
} satisfies Record<TagId, Tag>;

export function isTagId(value: string): value is TagId {
  return tagIds.some((tagId) => tagId === value);
}

export function getTag(tagId: TagId): Tag {
  return tags[tagId];
}
