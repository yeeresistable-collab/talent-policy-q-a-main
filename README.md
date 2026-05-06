# 人才政策助手

前端是 Vite + React，聊天接口通过本地 Node 后端代理到 MiniMax OpenAI 兼容接口，默认使用 `MiniMax-M2.5`。

## 明天临时给客户演示（方案 A，无需 Supabase / 无需云主机）

**原理**：本机跑最新后端 + `cloudflared` 临时把 `8787` 端口暴露成公网 HTTPS；前端指向该地址，客户浏览器就能问到「参考材料版」逻辑。

**演示前请先安装** [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)（本机已装过可跳过）。

### 路径 1：客户看你屏幕（最简单）

1. 终端 A：`npm run api`
2. 终端 B：`npm run dev`
3. 浏览器打开：`http://127.0.0.1:8080/`  
   前端会走 Vite 代理的 `/api/chat`，即本机最新后端。

### 路径 2：客户自己的手机/电脑打开网页

1. 终端 A：`npm run api`
2. 终端 B：`npm run demo:tunnel`；若 QUIC 连不上边缘（超时、1033），改用 **`npm run demo:tunnel:http2`**（`--protocol http2`）。
3. 终端里会出现类似 `https://xxxx.trycloudflare.com`，**整段复制**（不要丢路径）。
4. 用隧道地址更新公网前端并发布一次 `gh-pages`（把下面命令里的 URL 换成你终端里那一行）：

```bash
git fetch origin gh-pages
git worktree prune
git worktree add -f gh-pages-live origin/gh-pages

VITE_BASE_PATH=/talent-policy-q-a-main/ \
VITE_CHAT_URL="https://xxxx-xx-xx-xx.trycloudflare.com/api/chat" \
npm run build -- --outDir gh-pages-live --emptyOutDir

git -C gh-pages-live add -A
git -C gh-pages-live commit -m "chore: point Pages to demo tunnel backend"
git -C gh-pages-live push origin HEAD:gh-pages
rm -rf gh-pages-live
```

5. 演示期间 **隧道进程和 `npm run api` 都要一直开着**；隧道关掉后公网页面会再问不到接口。
6. 明天若重新跑隧道，URL 可能变化，需要按第 4 步用新 URL 再打包发布一次（或改用路径 1）。

演示入口仍为你的 GitHub Pages 地址：  
[https://yeeresistable-collab.github.io/talent-policy-q-a-main/](https://yeeresistable-collab.github.io/talent-policy-q-a-main/)

---

## 本地运行（日常开发）

1. 配置环境变量：

```bash
cp .env.example .env
```

然后在 `.env` 中填入：

```bash
MINIMAX_API_KEY=你的 MiniMax API Key
```

2. 启动后端：`npm run api`  
   默认 `http://localhost:8787`，`/api/chat`、`/api/health`。

3. 启动前端：`npm run dev`  
   默认 `http://localhost:8080`，开发环境 `/api/*` 代理到后端。

---

## 部署 Supabase Edge Function（`chat`）

Edge 上的 `chat` 与本地 Node 使用**同一套参考材料检索逻辑**（`skill-engine` 移植）：启动时加载随函数打包的 `beijing-work-permit-reference.md` 与 `skill.md` / `skill.json`，先拆条检索、追问、窗口短路、无命中拒答，需要模型复述时再调用 **Lovable** 流式补全。需 **Supabase 账号对本项目有权限**。CLI 可用 `npx`，无需单独安装。

### 1) 登录（二选一）

- **本机浏览器登录（推荐）**，在项目根目录执行：

```bash
npx supabase@latest login
```

按提示在浏览器完成授权后，令牌会存在本机，**不必把 token 发给别人**。

- **CI / 无浏览器**：在环境里设置 `SUPABASE_ACCESS_TOKEN`（在 [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens) 生成），再执行部署命令。

### 2) 配置函数密钥

Edge 函数读取环境变量 **`LOVABLE_API_KEY`**。在 [Dashboard → Project → Edge Functions → Secrets](https://supabase.com/dashboard/project/uvcvhwbixwdcsnygriiw/settings/functions) 添加，或：

```bash
npx supabase@latest secrets set LOVABLE_API_KEY=你的密钥 --project-ref uvcvhwbixwdcsnygriiw
```

### 3) 部署

```bash
npm run deploy:supabase:chat
```

该命令会先把 `server/knowledge/beijing-work-permit-reference.md` 与 `server/skills/beijing-work-permit-consultant/` 下的 skill 文件复制到 `supabase/functions/chat/knowledge/`，再执行上述 deploy，保证线上材料与仓库主源一致。

公网聊天接口：

`https://uvcvhwbixwdcsnygriiw.supabase.co/functions/v1/chat`

---

## 可选：长期公网后端（方案 B）

不需要 Supabase token，也可用 **Render + GitHub Pages**（见仓库根目录 `render.yaml`）。需要 Render 账号并配置 `MINIMAX_API_KEY`。日常演示不必用它。
