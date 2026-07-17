import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { tagIds } from './data/tags';
import { getPostSlugFromEntryPath } from './lib/post-slug';

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.(md|mdx)',
    base: './src/content/posts',
    generateId: ({ entry }) => getPostSlugFromEntryPath(entry),
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().trim().min(1, '文章标题不能为空'),
        description: z.string().trim().min(1, '文章摘要不能为空'),
        publishedAt: z.coerce.date(),
        updatedAt: z.coerce.date().optional(),
        tags: z
          .array(z.enum(tagIds))
          .min(1, '文章至少需要一个标签')
          .max(5, '文章最多只能设置五个标签')
          .refine((values) => new Set(values).size === values.length, '文章标签不能重复'),
        draft: z.boolean(),
        featured: z.boolean(),
        cover: image().optional(),
        coverAlt: z.string().trim().min(1, '封面替代文本不能为空').optional(),
      })
      .superRefine((data, context) => {
        if (data.updatedAt && data.updatedAt < data.publishedAt) {
          context.addIssue({
            code: 'custom',
            path: ['updatedAt'],
            message: '更新时间不得早于发布日期',
          });
        }

        if (data.cover && !data.coverAlt) {
          context.addIssue({
            code: 'custom',
            path: ['coverAlt'],
            message: '设置封面时必须填写封面替代文本',
          });
        }

        if (!data.cover && data.coverAlt) {
          context.addIssue({
            code: 'custom',
            path: ['coverAlt'],
            message: '没有设置封面时不应填写封面替代文本',
          });
        }
      }),
});

export const collections = { posts };
