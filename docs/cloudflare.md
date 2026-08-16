# Cloudflare 数据托管 · docs/cloudflare.md

鲸选的 registry / 套件 / 雷达数据由本仓库的 Cloudflare Workers 项目对外提供 API。本文件是给你的部署教程（顺便熟悉 Cloudflare）。

## 架构

- 数据唯一来源仍是 GitHub 仓库（data/plugins.json、data/suits.json）；每次 deploy 把快照打包进 Worker。
- 端点（cloudflare/src/handler.js，零依赖，本地可用 scripts/cf-smoke.mjs 验证）：
  - GET /plugins.json — 全量插件 registry
  - GET /suits.json — 套件 registry
  - GET /radar.json — 九轴雷达聚合（{ plugins: { id: radar } }）
  - GET /health — 健康检查
  - 全部带 CORS *、ETag、Cache-Control: public, max-age=600

## 部署步骤

1. 全局安装 wrangler（本环境项目内安装受脚本策略限制，全局安装是允许路径）：

```sh
npm install -g wrangler
wrangler login   # 浏览器 OAuth，不用在终端贴 token
```

2. 本地试跑（可选但推荐，学 Cloudflare 的第一课）：

```sh
npm run cf:dev        # 本地起 http://localhost:8787，直接 curl /plugins.json
```

3. 部署到 workers.dev：

```sh
npm run cf:deploy     # 完成后给你 https://whale-picks-api.<你的账号>.workers.dev
```

4. （可选）绑定自定义域名或路由：在 Cloudflare 控制台 Workers → whale-picks-api → Settings → Domains & Routes 添加。

## 数据更新流程

改 data/*.json → 重新 `npm run cf:deploy`（每次部署带新快照）。
之后想自动化：在 GitHub Secrets 里设 CF_API_TOKEN + CF_ACCOUNT_ID，再把 .github/workflows/ 下的部署工作流从注释状态启用（基座期预留了位置，见 roadmap）。

## 消费方

- DSH 内置鲸选商店插件（LeeKai233/dsh-whale-picks-store）读 /plugins.json 与 /suits.json；
- 未来商店网站读同一端点；
- 任何第三方工具都可直接消费（CORS 全开）。

## 免费额度与学习资源

- Workers 免费计划：每天 10 万请求，个人商店绰绰有余。
- Cloudflare 官方 Playground：https://developers.cloudflare.com/workers/get-started/guide/
- KV/D1（二期给评论区/真人评分存数据用）也在免费额度内，届时本文件会补章节。
