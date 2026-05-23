# 前端目录与模块说明（src/game）

本文件按目录解释“每个模块做什么、关键文件在哪、常见改动点是什么”。快速定位时优先看这里。

## src/

- `src/main.ts`：Web 入口；创建并启动 `GameApp`
- `src/styles.css`：全局样式（包含 overlays 的布局）

## src/game/

### app 组装

- `GameApp.ts`：整体组装与调度
  - 初始化 overlays、renderer、loop、input
  - 单人/联机切换与渲染分派
  - 配置加载与注入

### audio/

- `AudioBank.ts`：音效资源与播放（砍击/失败等）

### config/

- `properties.ts`：properties 解析（key=value，支持 # 注释）
- `gameConfig.ts`：把 properties 映射为强类型 `GameConfig`（含默认值与范围 clamp）
- `loadConfig.ts`：从 `/config/game.properties` 拉取并解析配置

常改动点：
- 新增/调整难度参数：优先改 `public/config/game.properties`，必要时同步扩展 `GameConfig`

### engine/

- `Clock.ts`：时间辅助
- `FixedTimestepLoop.ts`：固定步长 update/render 循环

### input/

- `TapHalvesInput.ts`：点击左右半区输入适配（移动端主交互）

### net/

- `OnlineClient.ts`：WebSocket 客户端；发送 join/input；接收 state
- `protocol.ts`：消息协议类型 + encode/decode
- `matchmaking.ts`：联机相关辅助（房间/连接参数等）

### obstacles/

- `ObstacleGenerator.ts`：障碍/树枝生成器（可配置 noneChance/avoidSameSide）

### render/

- `Renderer.ts`：Canvas 2D 渲染器（绘制游戏主体）
- `hud.ts`：历史 HUD 绘制（现阶段 HUD 主要由 overlays 负责）

### rng/

- `XorShift32.ts`：可重复随机数（用于障碍生成等）

### rules/

- `TimberRules.ts`：单人规则（tick/chop、失败条件、得分、时间返还）

### state/

- `types.ts`：状态类型定义
- `singlePlayer.ts`：单人运行时与状态推进（tick/chop）

### ui/

- `flow.ts`：UI/模式流程状态机（menu/single/online）
- `overlays.ts`：DOM 覆盖层（menu/hud/result 的 DOM 结构与 show* 方法）
- `actions.ts`：集中绑定 overlays 事件，把回调交给 `GameApp`

