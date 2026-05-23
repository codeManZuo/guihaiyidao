# 技术栈与工程结构

## 前端（Web/H5）

- 构建与开发：Vite
  - 配置：`vite.config.ts`（`server.host: true`，便于手机通过局域网访问）
  - 脚本：`package.json`（`dev/build/preview`）
- 语言：TypeScript（ESM）
  - 配置：`tsconfig.json`
- 渲染：Canvas 2D
  - 主渲染器：`src/game/render/Renderer.ts`
  - HUD/菜单：使用 DOM 覆盖层（不是 Canvas 文本），见 `src/game/ui/overlays.ts`
- 测试：Vitest + jsdom
  - 配置：`vitest.config.ts`（`environment: "jsdom"`）
  - 测试分布：`src/**/*.test.ts`

## 后端（联机）

- 运行环境：Node.js（TypeScript ESM）
- WebSocket：`ws`
- 运行方式：`tsx`
  - 入口：`server/src/server.ts`
  - 脚本：`server/package.json`（`npm run dev`）

## 目录概览（仓库根）

- `src/`：前端应用代码（H5）
- `public/`：静态资源（包含难度配置 `public/config/game.properties`）
- `server/`：联机服务器（WebSocket）
- `docs/`：设计/计划与项目记忆文档
  - `docs/superpowers/`：历史设计与计划
  - `docs/project-memory/`：本套“项目记忆”（给后续开发者/AI 快速理解）

