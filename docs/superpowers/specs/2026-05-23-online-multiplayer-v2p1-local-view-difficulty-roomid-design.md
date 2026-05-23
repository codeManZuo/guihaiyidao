# Online Multiplayer v2+ (视角固定右侧 + 单人同款树枝队列 + 指定房间号 + 房主难度) Design

**Goal:** 修复在线双人当前的视角/输入/树枝渲染/房间号/难度/结束条件问题，使其在“本机跑前后端 + 两台手机同局域网测试”的场景下稳定可玩。

**Non-goals:**
- 不做排行榜（在线仍不计入排行榜）
- 不做断线重连续玩（保持“断线即离线展示/退出席位”的现有策略）
- 不改单人玩法与难度体系（在线难度仅复用单人的 `decayScale` 映射）

---

## 现状问题与对应目标

1. **视角不固定**：当前谁先操作谁在左边/右边不确定  
   **目标**：永远“我在右边，对方在左边”，HUD/结算也按左=对方、右=我展示，不暴露 P1/P2。

2. **输入语义混乱**：希望在线输入与单人一致  
   **目标**：屏幕中线点击左半屏=向左砍，右半屏=向右砍，且只作用于“我这棵树”。

3. **树枝/玩法与单人不一致**：出现“只有树干/树枝偶尔缺失/只有一方有树枝”等  
   **目标**：在线每个玩家的对局逻辑与单人一致；左侧仅实时展示对方的同款状态。

4. **房间号不能指定创建且复用**  
   **目标**：允许输入 4 位数字房间号进行创建；若房间号已存在/正在使用则创建报错；房间无人销毁后同号可再次创建。

5. **在线难度不可选且不统一**  
   **目标**：在线难度由房主创建房间时选择，双方以该难度为准；仅影响 `time.decayScale`。

6. **结束条件**：一方先死后应不能操作但可观战，直到双方都结束  
   **目标**：服务端只在双方都 dead 时 `finished`；客户端本方 dead 后停止发送 input，但继续渲染对方实况。

---

## 协议（v=2）扩展

### 新增/修改字段

**Client → Server**
- `create_room` 增加可选参数：
  - `roomId?: string`（4 位数字）
  - `difficulty: "easy" | "normal" | "hard"`
- `ready/start/input` 保持 `roomId` 字段不变

**Server → Client**
- `state` 增加：
  - `difficulty: "easy" | "normal" | "hard"`
  - 每位玩家的 upcoming 队列（见下文“服务端模拟”）
- `error.code` 增加：
  - `ROOM_EXISTS`

### 错误码语义
- `ROOM_EXISTS`：创建房间时指定 roomId 已存在（房间对象仍存在，且未被销毁）
- 其他错误码维持现有含义：`ROOM_NOT_FOUND` / `ROOM_FULL` / `INVALID_ROOM` / `NOT_HOST` / `NOT_READY` / `BAD_STATE`

---

## 服务端房间模型

### Room 持久信息
每个房间需要新增字段：
- `difficulty: "easy" | "normal" | "hard"`

房间生命周期：
- `sockets.size === 0` 时立即销毁（与当前一致），以满足“房间号可复用”
- `create_room(roomId)` 若 `rooms.has(roomId)` 则直接报 `ROOM_EXISTS`

### Seat 分配
不改变 seat 的权威性：
- 服务端仍随机分配 seat（p1/p2）
- 客户端只做“视角映射”，不影响 seat 的真实性

---

## 服务端对局模拟：单人同款 upcoming 队列（推荐方案 A）

### 核心原则
服务端权威维护每位玩家的“未来树枝队列”，并把它直接广播给客户端渲染，从而保证在线玩法与单人一致，避免前后端随机差异导致错位。

### 数据结构
对每个玩家维护：
- `upcomingObstacles: Array<Side | null>`（固定长度，例如 16）
- `upcomingObstacleStyles: number[]`（固定长度，例如 16，样式与障碍槽位绑定，shift 后不变形）

同时保留现有的即时状态字段（score/time/status/side）。

### 生成与推进规则
- 开局：生成长度 N 的 upcoming 队列与 styles 队列，并将 `currentObstacleSide` 视为 `upcomingObstacles[0]`
- 每次有效砍树（未死亡）：
  - score+1
  - timeMs 加回（现有规则）
  - `upcomingObstacles.shift(); upcomingObstacles.push(nextObstacle())`
  - `upcomingObstacleStyles.shift(); upcomingObstacleStyles.push(nextStyle())`
- 死亡判定：
  - 如果 `upcomingObstacles[0] !== null && upcomingObstacles[0] === side` 则该玩家 dead
  - 玩家 dead 后不再推进队列（但仍保持当前队列用于观战展示）

### 结束条件
保持服务端权威：
- 只有当 `p1.status==="dead" && p2.status==="dead"` 时，`sim.status="finished"`

### 难度映射（房主创建时确定）
房主在创建房间时选择难度，服务端以此覆盖 `decayScale`：
- easy → 1.5
- normal → 2
- hard → 2.5

该值写入 room，保证双方一致。

---

## 客户端视角映射（我永远在右边）

### 映射规则
客户端拿到 `joined.playerId` 后定义：
- `meSeat = joined.playerId`
- `right = meSeat`
- `left = otherSeat(meSeat)`

### 渲染与 HUD
- 画面：
  - 左侧树渲染 `left` 的状态与 upcoming 队列
  - 右侧树渲染 `right`（即我）的状态与 upcoming 队列
- HUD：
  - 左栏显示“对方”分数/时间/状态/是否离线/是否准备
  - 右栏显示“我”分数/时间/状态/是否已准备/是否房主
- 结算：
  - 文案按“胜利/失败/平局”
  - 分数对比按“左 vs 右”，同时可小字显示 seat（仅调试可选；默认不显示）

---

## 输入语义（与单人一致）

- 屏幕中线点击左半屏 → `side="left"`
- 点击右半屏 → `side="right"`
- 输入只作用于“我方 seat”，不因“我被放在右侧树”而反转

### 客户端输入门禁
- 若 `myStatus === "dead"`：不再发送 input（但继续渲染对方状态直到 finished）
- 若 `match.status !== "playing"`：不发送 input

---

## UI/交互：创建/加入房间与在线难度

### 创建房间
- 输入框：房间号（4 位数字，可空）
- 难度选择：easy/normal/hard（仅在线使用）
- 点击“创建房间”：
  - 若房间号为空：创建随机房间号
  - 若填写：按填写值创建；若已存在则显示 `ROOM_EXISTS` 错误提示

### 加入房间
- 输入框：房间号（4 位数字）
- 点击“加入房间”：
  - 正常 join；不存在/满员/无效按错误提示

### 大厅
- 我方按钮：准备（ready）
- 房主按钮：开始（start）仅在双方在线且 ready 后可用
- 对方状态：未加入/离线/未准备/已准备

---

## 测试策略

**Server**
- rooms：指定 roomId 创建冲突返回 ROOM_EXISTS；room 回收后可再次创建同号
- gameSim：upcoming 队列推进与死亡判定；仅双方 dead 才 finished
- state 构建：包含 difficulty 与 upcoming 队列

**Client**
- 视角映射：joined 为 p1/p2 时，右侧永远为 me（渲染/数值映射）
- 输入门禁：dead 或非 playing 不发送 input

---

## 受影响文件（实现参考）

- Server
  - `server/src/protocol.ts`（新增 ROOM_EXISTS；create_room 支持 roomId+difficulty；state 增加 difficulty+upcoming）
  - `server/src/rooms.ts`（createRoom 支持指定 roomId；冲突报错；room 保存 difficulty）
  - `server/src/gameSim.ts`（扩展为 upcoming 队列；推进/死亡判定/结束条件保持）
  - `server/src/server.ts`（处理新字段与错误；广播完整 state）

- Client
  - `src/game/net/protocol.ts`（镜像 server 的协议变更）
  - `src/game/net/OnlineClient.ts`（create_room 发送 roomId+difficulty）
  - `src/game/GameApp.ts`（视角映射 + HUD/渲染左右对应 + 输入门禁）
  - `src/game/render/Renderer.ts`（online 渲染改为支持 upcoming 队列绘制）
  - `src/game/ui/overlays.ts` / `src/game/ui/actions.ts`（创建房间输入房间号+难度，加入房间；大厅提示）

