# 开发运行手册（Runbook）

## 前端（Web/H5）

在仓库根目录执行：

- 安装依赖：
  - `npm i`
- 启动开发（Vite）：
  - `npm run dev`
- 构建：
  - `npm run build`
- 预览构建产物：
  - `npm run preview`

说明：
- `vite.config.ts` 设置了 `server.host: true`，便于手机通过局域网访问开发机。

## 联机服务端（WebSocket）

在 `server/` 目录执行：

- 安装依赖：
  - `npm i`
- 启动开发（tsx）：
  - `npm run dev`

默认监听：
- `ws://localhost:8787`
- 可通过环境变量覆盖：`PORT=xxxx npm run dev`

## 联机调试要点

- 前端 WS 地址由 `src/game/GameApp.ts` 动态决定：
  - HTTPS：`wss://<当前域名>/ws`（通常由 Nginx /ws 反代）
  - HTTP：`ws://<当前 hostname>:8787`
- 手机联机本地测试（同一局域网）：
  - 用手机访问开发机的局域网地址（例如 `http://192.168.1.10:5173`），前端会自动连 `ws://192.168.1.10:8787`
- 线上部署建议：
  - 推荐启用 HTTPS，并用 Nginx 把 `/ws` 反代到 `127.0.0.1:8787`（见 `05-runbook/centos-deploy-update.md`）

## 常见问题

### 端口被占用

- 现象：启动 server 报 `EADDRINUSE`（8787 被占用），或 Vite 端口冲突
- 处理：
  - 换端口：server 用 `PORT=xxxx`；Vite 会自动切换端口或在配置中指定
