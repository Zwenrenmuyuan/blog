# 旁注

“旁注”是一份记录技术、生活与阅读的中文个人静态博客。项目已经具备可复现的工程基础、Markdown/MDX 内容系统、中文全文搜索、订阅和完整的静态 SEO 输出。

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
| `npm run test:unit` | 运行内容选择、阅读工具、SEO 和订阅单元测试 |
| `npm run test:content` | 在开发服务器验证草稿阅读体验和搜索降级 |
| `npm run test:e2e` | 重新构建并运行 Playwright 端到端测试 |

## 环境变量

本地开发不需要创建 `.env`，会自动使用 `http://localhost:4321/`。部署时设置：

```sh
SITE_URL=https://example.com/
```

`SITE_URL` 必须是合法的 HTTP 或 HTTPS 站点根地址，不能包含凭据、子路径、查询参数或片段。canonical、分享图片、RSS、sitemap 和 `robots.txt` 都从这里生成，参考 `.env.example`。

## 当前内容

- 公开欢迎文章：<http://localhost:4321/posts/welcome/>
- 开发环境草稿样式测试：<http://localhost:4321/posts/style-test/>
- 生产全文搜索：<http://localhost:4321/search/>
- RSS 订阅：<http://localhost:4321/rss.xml>

Pagefind 索引在生产构建结束后生成，因此开发服务器中的搜索页只显示说明；使用 `npm run build` 和 `npm run preview` 验证真实搜索。搜索、RSS、sitemap 和结构化数据只包含公开文章，草稿始终排除。正式域名和部署仍留在后续里程碑完成。
