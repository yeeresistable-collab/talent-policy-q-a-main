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
