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

- 前端默认 WS 地址在 `GameApp` 中为 `ws://localhost:8787`
  - 位置：`src/game/GameApp.ts`
- 如果在手机上访问前端页面，`localhost` 指向手机自身，需要把 wsUrl 换成开发机的局域网 IP，例如 `ws://192.168.1.10:8787`
  - 推荐做法：通过 URL 参数或在菜单输入中提供 roomId/playerId，并让 wsUrl 可控（已由 flow/overlays 支持一部分联机参数）

## 常见问题

### 端口被占用

- 现象：启动 server 报 `EADDRINUSE`（8787 被占用），或 Vite 端口冲突
- 处理：
  - 换端口：server 用 `PORT=xxxx`；Vite 会自动切换端口或在配置中指定

