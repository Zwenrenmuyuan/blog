# “旁注”写作指南

## 创建文章

每篇文章使用一个独立目录：

```text
src/content/posts/<slug>/index.md
```

需要 MDX 时，把入口文件改为 `index.mdx`。不要在同一个目录中同时创建两种入口文件。

`slug` 会成为永久文章地址，只能包含小写英文、数字和连字符：

```text
how-static-blog-works
```

发布后不要随意修改 slug，否则原地址会失效。

## Front Matter 模板

```yaml
---
title: 文章标题
description: 一段能够独立说明文章内容的摘要
publishedAt: 2026-07-17T09:00:00+08:00
updatedAt: 2026-07-18T09:00:00+08:00
tags:
  - technology
draft: true
featured: false
---
```

- `title`、`description`、`publishedAt`、`tags`、`draft` 和 `featured` 必填。
- `updatedAt` 只在文章发生实质修改时填写，并且不能早于发布日期。
- 每篇文章需要一至五个标签，标签不能重复。
- 可用标签定义在 `src/data/tags.ts`；新增标签时先更新注册表。
- 写作期间保持 `draft: true`，准备发布时改为 `false`。

## Markdown 与 MDX

普通文章优先使用 Markdown。只有需要嵌入特殊内容块或 Astro 组件时才使用 MDX，以免文章无意中依赖复杂代码。

开发环境中可以访问草稿样式测试页：

```text
http://localhost:4321/posts/style-test/
```

## 图片

正文图片和封面放在对应文章目录中，使文章内容和资源可以一起移动：

```text
src/content/posts/example/
├── index.md
├── cover.jpg
└── diagram.png
```

正文图片使用 Markdown，并填写能够说明图片内容的替代文本：

```md
![静态博客构建流程](./diagram.png)
```

设置封面时，`cover` 和 `coverAlt` 必须同时存在：

```yaml
cover: ./cover.jpg
coverAlt: 书桌上的笔记本与一杯咖啡
```

## 预览与发布

启动开发服务器：

```sh
npm run dev
```

草稿可以在开发环境预览，但不会生成到生产站点。发布前执行：

```sh
npm run check
npm run build
npm run test:e2e
```

确认文章内容、日期、标签和图片无误后，把 `draft` 改为 `false`，再次完成检查并提交代码。后续接入远程仓库和部署后，推送到 `main` 将触发正式发布。
