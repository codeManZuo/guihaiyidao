# 前端架构（Web/H5）

## 总览

前端由一个 `GameApp` 作为“组装器 + 状态机”，负责：

- 初始化 DOM 覆盖层（菜单/HUD/结算）与 Canvas
- 启动固定步长循环（update/render）
- 处理输入（点击左右半区）
- 在单人/联机之间切换，并渲染对应画面
- 加载难度配置（properties）并注入到单人/联机的时间条计算

## 入口链路

- `src/main.ts`
  - 引入全局样式 `src/styles.css`
  - 创建 `new GameApp(app)` 并 `start()`
- `src/game/GameApp.ts`
  - 初始化：overlays、renderer、flow、config、loop、input、overlay actions

## 游戏循环

- 固定步长循环：`src/game/engine/FixedTimestepLoop.ts`
  - `update(dtMs)`：推进游戏状态
  - `render()`：根据当前 flow 选择渲染路径与 UI
- 当前实现中：
  - 单人模式：`tickSinglePlayer(this.single, dtMs)`
  - 联机模式：主要渲染服务端下发的 state（客户端不做本地模拟）

## 输入

- 点击左右半区：`src/game/input/TapHalvesInput.ts`
  - 绑定在 Canvas 上，回调参数为 `"left" | "right"`
  - `GameApp` 根据模式分发：
    - 单人：`chopSinglePlayer(rt, side)`
    - 联机：`online.sendInput(side)`

## UI（DOM 覆盖层）

- 覆盖层结构与切换：`src/game/ui/overlays.ts`
  - 目标：避免 Canvas 文本在不同设备/缩放下可读性与布局问题
  - 主要屏幕：
    - menu：模式选择与联机参数
    - hud：单人/联机 HUD（分数、时间条）
    - result：结算与操作（再来一局/返回菜单）
- 事件绑定：`src/game/ui/actions.ts`
  - 把 overlays 的按钮事件集中绑定，`GameApp` 只提供 handler
- 流程状态机：`src/game/ui/flow.ts`
  - 维护当前 screen（menu/single/online）
  - 支持通过 URL 参数直达 online（便于调试/分享链接）

## 渲染（Canvas 2D）

- `src/game/render/Renderer.ts`
  - 只绘制游戏主体（树、角色、障碍等）
  - HUD 不在 Canvas 中绘制（由 overlays 负责）
  - 单人模式会绘制“未来障碍队列”以增加预判空间

## 单人规则与状态

- `src/game/state/singlePlayer.ts`
  - runtime：包含 state、ObstacleGenerator、upcomingObstacles、config
  - 每次 chop 会消费 upcomingObstacles[0] 作为“下一层障碍”，并向队列尾部补充
  - tick 受 `config.time.decayScale` 影响（让难度可配置）
- `src/game/rules/TimberRules.ts`
  - 单人核心规则：时间流逝、得分、失败条件、时间返还

## 配置加载与注入

- `public/config/game.properties`：可配置难度与障碍生成
- `src/game/config/loadConfig.ts`
  - 从 `/config/game.properties` 拉取
  - 解析为强类型 `GameConfig`
  - 拉取失败回退默认配置
- `GameApp` 在启动时异步加载配置，并在创建单人 runtime 时传入

## 音频（本地）

- 音频总控：`src/game/audio/AudioBank.ts`
  - 音效：砍击/失败（WebAudio）
  - 背景音乐：两套 BGM
    - 菜单相关（menu/leaderboard）：`/assets/audio/bgm/sound_menu_background.mp3`
    - 进入主界面后（single/online）：`/assets/audio/bgm/sound_game_background.mp3`
  - 静音：右上角喇叭按钮，切换静音/取消静音（影响音效与 BGM）
  - 音量：菜单中滑动条调节，仅影响本机；保存到 localStorage
- 自动播放限制：
  - 移动端浏览器通常要求“首次用户交互”后才允许播放音频
  - 现实现为：首次点击任意按钮/触摸画布会触发 `unlockBgm()` 解锁播放

## 移动端适配要点

- iOS 输入框 focus 页面缩放：
  - 菜单输入框在触屏设备上使用 `font-size: 16px` 避免 Safari 自动缩放
  - 全局不再在 `html, body` 上禁用触控缩放，避免出现“放大后无法缩回”
  - 仅在 Canvas 上使用 `touch-action: none`，保证游戏操作不被系统手势打断
