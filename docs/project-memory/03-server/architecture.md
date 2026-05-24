# 服务端架构（WebSocket 联机）

## 总览

服务端提供一个轻量的 WebSocket 房间服务：

- 玩家连接后创建/加入房间（roomId），并成为 p1/p2（seat）
- 客户端只发送输入（left/right）
- 服务端权威维护每个房间的模拟状态（分数、时间、障碍、存活等）
- 服务端以固定频率 tick，并广播当前 state 给房间内所有连接

## 入口与主循环

- 入口：`server/src/server.ts`
  - 监听端口：默认 `8787`（环境变量 `PORT` 可覆盖）
  - 使用 `setInterval(..., 50)`：
    - `tick(room.sim, 50)`
    - `broadcastState(roomId)`

## 房间与状态存储

- `server/src/rooms.ts`
  - `RoomStore`：按 roomId 管理房间
  - 每个房间持有：
    - sockets（当前连接集合）
    - sim（对战模拟状态）
    - difficulty（房主创建时选择，仅影响 time.decayScale）
  - roomId 支持指定创建
    - 若 roomId 已存在：返回 `ROOM_EXISTS`

## 游戏模拟（权威规则）

- `server/src/gameSim.ts`
  - `tick(sim, dtMs)`：推进时间条与状态
  - `applyInput(sim, player, side)`：应用玩家输入（砍击/判定/得分）
  - 维护 upcoming 障碍队列（含样式队列），并在 state 广播给客户端，保证两端显示一致
  - 对局结束条件：双方都死亡才结束（finished）
  - 模拟使用配置：
    - time.startMs / maxMs / addPerChopMs / decayScale
    - obstacle.noneChance / avoidSameSide

## 协议

- `server/src/protocol.ts`
  - v2 协议：create_room/join_room/ready/start/input/state/error
  - state 包含：difficulty、双方 ready/online/present、upcoming 障碍队列等
- 前端对应：`src/game/net/protocol.ts`

## 配置一致性（很重要）

服务端启动时会读取仓库根目录的 `public/config/game.properties`，并把解析后的 `GameConfig` 注入到 `RoomStore`，从而保证：

- 单人模式（Web）与联机模式（Server）在难度参数上保持一致
- 只改一份配置文件即可同步两端

实现位置：

- `server/src/config/loadConfig.ts`：从 `../public/config/game.properties` 读取
- `server/src/server.ts`：加载并传入 `new RoomStore(config)`
