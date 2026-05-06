# 人才政策助手

前端是 Vite + React，聊天接口通过本地 Node 后端代理到 MiniMax OpenAI 兼容接口，默认使用 `MiniMax-M2.5`。

## 本地运行

1. 配置环境变量：

```bash
cp .env.example .env
```

然后在 `.env` 中填入：

```bash
MINIMAX_API_KEY=你的 MiniMax API Key
```

2. 启动后端服务：

```bash
npm run api
```

后端默认监听 `http://localhost:8787`，聊天接口是 `POST /api/chat`，健康检查是 `GET /api/health`。

3. 启动前端：

```bash
npm run dev
```

前端默认运行在 `http://localhost:8080`，开发环境下 `/api/*` 会通过 Vite 代理到后端服务。

## 公网部署（无 Supabase Token）

推荐采用 **Render 部署后端 + GitHub Pages 部署前端**。

### 1) 部署后端到 Render

本仓库已提供 `render.yaml`，可直接在 Render 里使用 Blueprint 导入。

- 新建 Web Service（或 Blueprint）
- 关键环境变量：
  - `MINIMAX_API_KEY`（必填）
  - `MINIMAX_MODEL`（默认 `MiniMax/MiniMax-M2.5`）
  - `MINIMAX_BASE_URL`（默认 `https://api.minimax.io/v1`）
- 健康检查：`/api/health`

部署完成后，你会拿到后端公网地址，例如：

`https://talent-policy-qa-api.onrender.com`

### 2) 重新构建并发布 GitHub Pages 前端

将前端聊天地址指向上一步 Render 地址：

```bash
VITE_BASE_PATH=/talent-policy-q-a-main/ \
VITE_CHAT_URL=https://<你的-render-域名>/api/chat \
npm run build -- --outDir gh-pages-live --emptyOutDir
```

然后把 `gh-pages-live` 目录内容提交并推送到 `gh-pages` 分支即可。
