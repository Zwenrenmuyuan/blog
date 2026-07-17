# 旁注

“旁注”是一份记录技术、生活与阅读的中文个人静态博客。项目已经具备可复现的工程基础和经过校验的 Markdown/MDX 内容系统。

## 环境

- Node.js 26.3.0
- npm 11.16.0

项目通过 `.node-version`、`.nvmrc`、`package.json` 和锁文件固定构建环境。

## 开始使用

```sh
npm ci
npm run dev
```

本地默认访问地址为 <http://localhost:4321/>。

创建、预览和发布文章前，请先阅读 [`docs/writing.md`](./docs/writing.md)。开发环境可以预览草稿，生产构建会完全排除草稿。

首次运行端到端测试前，需要安装测试浏览器：

```sh
npx playwright install chromium
```

## 命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器 |
| `npm run check` | 执行 Astro 和 TypeScript 检查 |
| `npm run build` | 检查、生成静态站点并建立 Pagefind 索引 |
| `npm run preview` | 预览 `dist` 中的生产构建 |
| `npm run test:e2e` | 重新构建并运行 Playwright 端到端测试 |

## 环境变量

本地开发不需要创建 `.env`，会自动使用 `http://localhost:4321/`。部署时设置：

```sh
SITE_URL=https://example.com/
```

`SITE_URL` 必须是合法的 HTTP 或 HTTPS 站点根地址，不能包含子路径、查询参数或片段。参考 `.env.example`。

## 当前内容

- 公开欢迎文章：<http://localhost:4321/posts/welcome/>
- 开发环境草稿样式测试：<http://localhost:4321/posts/style-test/>

当前页面只用于验证内容系统，还没有正式视觉。文章列表、标签、归档、搜索界面、SEO 和部署将在后续里程碑完成。
