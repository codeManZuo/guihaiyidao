# 归海一刀（guihaiyidao）项目记忆索引

本目录用于沉淀“后续开发者/后续 AI 进入仓库后最先需要知道的东西”，目标是：不读太多源码，也能快速理解项目结构、关键入口、运行方式与常改配置。

## 项目一句话

一个类似 Timberman 的 H5 砍树街机游戏，星露谷风格；支持单人模式与在线双人同屏对战（两棵树分别在左右两侧）。

## 快速开始

### Web（前端）

- 安装依赖：在仓库根目录执行 `npm i`
- 启动开发：`npm run dev`
- 入口文件：`src/main.ts`
- 运行说明与常见问题：见 `05-runbook/dev-commands.md`

### Server（联机服务器）

- 安装依赖：在 `server/` 目录执行 `npm i`
- 启动开发：`npm run dev`
- 默认地址：`ws://localhost:8787`
- 入口文件：`server/src/server.ts`

## 关键入口与阅读顺序（建议）

1. 前端主入口：`src/main.ts` → `src/game/GameApp.ts`
2. UI 覆盖层（菜单/HUD/结算）：`src/game/ui/overlays.ts`、`src/game/ui/actions.ts`、`src/game/ui/flow.ts`
3. 单人规则与状态：`src/game/state/singlePlayer.ts`、`src/game/rules/TimberRules.ts`
4. 渲染：`src/game/render/Renderer.ts`（Canvas 2D）
5. 联机：`src/game/net/OnlineClient.ts`、`src/game/net/protocol.ts`
6. 服务端：`server/src/server.ts`、`server/src/rooms.ts`、`server/src/gameSim.ts`、`server/src/protocol.ts`

## 配置（难度/障碍）

- 配置文件：`public/config/game.properties`
- Web 端加载：`src/game/config/loadConfig.ts`
- Server 端加载：`server/src/config/loadConfig.ts`（从仓库根目录读取同一份配置，保证前后端一致）
- 配置说明：见 `04-config/game-properties.md`

## 文档导航

- 项目目标与模式：`01-overview/project-goals.md`
- 技术栈：`01-overview/tech-stack.md`
- 前端架构：`02-frontend/architecture.md`
- 前端目录模块说明：`02-frontend/modules-by-folder.md`
- 服务端架构：`03-server/architecture.md`
- 配置说明：`04-config/game-properties.md`
- 开发运行手册：`05-runbook/dev-commands.md`
- CentOS 部署与更新（Nginx + Docker）：`05-runbook/centos-deploy-update.md`
- 测试说明：`06-testing/tests.md`
