# Online Multiplayer (Rooms + Ready + Host Start) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make online 2-player mode truly playable over the internet with real room validation, random seat assignment, ready/host-start flow, correct end conditions, and synced visuals/actions.

**Architecture:** Keep server authoritative. Client sends intent (create/join/ready/start/input). Server validates, assigns seats, maintains per-room lobby/playing/finished state, and broadcasts full room state to both clients at a fixed tick. UI is driven by server state.

**Tech Stack:** Browser WebSocket, Node `ws`, TypeScript (client+server), Canvas2D renderer + DOM overlays.

---

## File Map (what changes where)

**Client (web)**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/net/protocol.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/net/OnlineClient.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/ui/overlays.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/ui/actions.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/ui/flow.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/GameApp.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/render/Renderer.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/styles.css`

**Server**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/protocol.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/server.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/rooms.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/gameSim.ts`

**Tests**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/net/protocol.test.ts`
- Add: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/rooms.test.ts` (if server uses vitest; otherwise adapt to existing server test setup)

---

## Task 1: Protocol v2 (create/join/ready/start + richer state + errors)

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/net/protocol.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/protocol.ts`
- Test: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/net/protocol.test.ts`

- [ ] **Step 1: Define shared concepts**

Client protocol (`src/game/net/protocol.ts`) should add:

```ts
export type Difficulty = "easy" | "normal" | "hard";

export type JoinResultV2 = {
  v: 2;
  type: "joined";
  roomId: string;
  playerId: "p1" | "p2";
  isHost: boolean;
};

export type ErrorMessageV2 = {
  v: 2;
  type: "error";
  code: "ROOM_NOT_FOUND" | "ROOM_FULL" | "INVALID_ROOM" | "NOT_HOST" | "NOT_READY" | "BAD_STATE";
  message: string;
};

export type RoomStateV2 = {
  v: 2;
  type: "state";
  roomId: string;
  serverTimeMs: number;
  status: "lobby" | "playing" | "finished";
  hostPlayerId: "p1" | "p2";
  p1: { present: boolean; ready: boolean; online: boolean; score: number; timeMs: number; status: "alive" | "dead"; side: Side; obstacleSide: Side | null };
  p2: { present: boolean; ready: boolean; online: boolean; score: number; timeMs: number; status: "alive" | "dead"; side: Side; obstacleSide: Side | null };
  winner: "p1" | "p2" | "draw" | null;
};
```

Client→server messages:

```ts
export type CreateRoomV2 = { v: 2; type: "create_room" };
export type JoinRoomV2 = { v: 2; type: "join_room"; roomId: string };
export type ReadyV2 = { v: 2; type: "ready"; roomId: string };
export type StartV2 = { v: 2; type: "start"; roomId: string };
export type InputV2 = { v: 2; type: "input"; roomId: string; seq: number; side: Side; clientTimeMs: number };
```

Wire unions:

```ts
export type ClientToServer = CreateRoomV2 | JoinRoomV2 | ReadyV2 | StartV2 | InputV2;
export type ServerToClient = JoinResultV2 | RoomStateV2 | ErrorMessageV2;
export type WireMessage = ClientToServer | ServerToClient;
```

Server protocol (`server/src/protocol.ts`) must mirror the same types (keep `Side`).

- [ ] **Step 2: Update decode/encode to accept v2**

Client decode should validate `v` is 2 (and optionally keep v1 support temporarily behind union).

Server decode should accept v2 only for new features.

- [ ] **Step 3: Update tests for protocol**

In `src/game/net/protocol.test.ts`, add:

```ts
it("encodes/decodes v2 create_room", () => {
  const raw = encodeMessage({ v: 2, type: "create_room" });
  const msg = decodeMessage(raw);
  expect((msg as any).v).toBe(2);
  expect((msg as any).type).toBe("create_room");
});
```

And a state message shape smoke test.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS for protocol tests.

- [ ] **Step 5: Commit**

```bash
git add src/game/net/protocol.ts server/src/protocol.ts src/game/net/protocol.test.ts
git commit -m "feat(net): add v2 protocol for rooms/ready/start"
```

---

## Task 2: Server rooms (real room validation + random seat assignment + ready + host-start)

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/rooms.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/server.ts`

- [ ] **Step 1: Implement 4-digit numeric room ids**

Rules:
- roomId must be exactly `^[0-9]{4}$`
- create generates a random 4-digit string; retry a few times if collision

Add helpers in `rooms.ts`:

```ts
export function isValidRoomId(roomId: string): boolean {
  return /^[0-9]{4}$/.test(roomId);
}

export function generateRoomId(rng: () => number): string {
  const n = Math.floor(rng() * 10_000);
  return String(n).padStart(4, "0");
}
```

- [ ] **Step 2: Extend Room model to track presence/ready/host**

```ts
export type Seat = "p1" | "p2";
export type Room = {
  roomId: string;
  host: Seat;
  sockets: Map<Seat, WebSocket>;
  ready: Record<Seat, boolean>;
  online: Record<Seat, boolean>;
  sim: ReturnType<typeof createMatchSim>;
};
```

Online is derived from socket presence; when disconnected set `online[seat]=false`.

- [ ] **Step 3: Add explicit APIs on RoomStore**

```ts
createRoom(ws: WebSocket): { room: Room; seat: Seat; isHost: boolean };
joinRoom(roomId: string, ws: WebSocket): { room: Room; seat: Seat; isHost: boolean } | { error: "ROOM_NOT_FOUND" | "ROOM_FULL" | "INVALID_ROOM" };
setReady(roomId: string, seat: Seat, ready: boolean): { ok: true } | { error: "BAD_STATE" };
start(roomId: string, seat: Seat): { ok: true } | { error: "NOT_HOST" | "NOT_READY" | "BAD_STATE" };
removeConn(roomId: string, seat: Seat): void;
```

Random seat assignment:
- If room empty: assign random seat, and that seat becomes host.
- If one present: assign the other seat.
- If two present: ROOM_FULL.

- [ ] **Step 4: Adjust start condition**

Remove implicit `startMatch` when 2 sockets join. Start only when:
- status is `lobby`
- both present and both `ready === true`
- caller seat is host

- [ ] **Step 5: Implement “room not found”**

Do not auto-create on join. `joinRoom` must error if `rooms.has(roomId)` is false.

- [ ] **Step 6: Update server.ts to use v2 flow**

Replace old `join` handling:
- On `create_room`: call `store.createRoom(ws)`; send `joined`; broadcast `state`
- On `join_room`: validate; on success send `joined`; broadcast `state`; on error send `error`
- On `ready`: set ready true; broadcast `state`
- On `start`: validate host+ready; on success call `startMatch(sim)`; broadcast `state`; on error send `error`
- On `input`: only apply when sim.status==="playing" and seat online; broadcast `state`

Conn map becomes:

```ts
type Conn = { roomId: string; seat: "p1" | "p2" };
```

- [ ] **Step 7: Run server locally**

Run (from server): `npm run dev`
Expected: logs show listening; connect from browser later.

- [ ] **Step 8: Commit**

```bash
git add server/src/rooms.ts server/src/server.ts
git commit -m "feat(server): add create/join/ready/start rooms with validation"
```

---

## Task 3: Server game rules (end when both dead; compute winner)

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/gameSim.ts`

- [ ] **Step 1: Change finish condition**

In `tick`, do not finish when one is dead. Finish only when both dead:

```ts
if (sim.p1.status === "dead" && sim.p2.status === "dead") sim.status = "finished";
```

In `applyInput`, do not set `sim.status="finished"` on a single death; only set the player dead.

- [ ] **Step 2: Add winner computation**

Add helper:

```ts
export function computeWinner(sim: MatchSim): "p1" | "p2" | "draw" | null {
  if (sim.status !== "finished") return null;
  if (sim.p1.score === sim.p2.score) return "draw";
  return sim.p1.score > sim.p2.score ? "p1" : "p2";
}
```

- [ ] **Step 3: Commit**

```bash
git add server/src/gameSim.ts
git commit -m "feat(server): finish match when both dead and compute winner"
```

---

## Task 4: Broadcast richer state (ready/online/present/winner)

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/server.ts`

- [ ] **Step 1: Build RoomStateV2 from room**

Use room data:
- `present` true if seat is assigned ever? Use `sockets.has(seat)` or `online[seat]`.
- `online` true if socket exists and open.
- `ready` per room.ready
- `winner` from `computeWinner(sim)`
- `hostPlayerId` from room.host

- [ ] **Step 2: Broadcast only to connected sockets**

Iterate over `room.sockets` map.

- [ ] **Step 3: Commit**

```bash
git add server/src/server.ts
git commit -m "feat(server): broadcast v2 state with lobby metadata and winner"
```

---

## Task 5: Client OnlineClient v2 (create/join/ready/start/input + store joined info + error)

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/net/OnlineClient.ts`

- [ ] **Step 1: Store joined info**

Add fields:

```ts
private joined: { roomId: string; playerId: "p1" | "p2"; isHost: boolean } | null = null;
private lastError: { code: string; message: string } | null = null;
```

On message:
- if `type==="joined"` set joined
- if `type==="state"` set lastState
- if `type==="error"` set lastError

- [ ] **Step 2: Add methods**

```ts
createRoom(): void;
joinRoom(roomId: string): void;
setReady(roomId: string): void;
start(roomId: string): void;
sendInput(roomId: string, side: Side): void;
getJoined(): ...;
getError(): ...;
```

Remove old `join` message on open; instead caller decides whether create/join.

- [ ] **Step 3: Commit**

```bash
git add src/game/net/OnlineClient.ts
git commit -m "feat(client): online client v2 create/join/ready/start/error"
```

---

## Task 6: UI changes (create room / join room / lobby ready / host start / offline indicator)

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/ui/overlays.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/ui/actions.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/styles.css`

- [ ] **Step 1: Menu buttons**

Add:
- “创建房间”按钮
- “加入房间”按钮（使用现有 roomInput）

Remove player select from UI (or hide it).

- [ ] **Step 2: Online lobby overlay**

In HUD or a new overlay card:
- 显示房间号
- 显示你是 P1/P2（可选）
- 你自己的准备按钮：未准备→“准备”；已准备→“已准备”（禁用）
- 显示对方：未加入/离线/未准备/已准备
- 如果你是房主且双方 ready：显示“开始游戏”按钮
- 如果你不是房主：显示“等待房主开始”

- [ ] **Step 3: Wire actions**

Add handlers:
- onCreateRoom
- onJoinRoom(roomId)
- onReady
- onStart

- [ ] **Step 4: Commit**

```bash
git add src/game/ui/overlays.ts src/game/ui/actions.ts src/styles.css
git commit -m "feat(ui): online lobby with create/join/ready/host-start and status"
```

---

## Task 7: GameApp integration (state-driven flow; no leaderboard; correct end screen)

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/ui/flow.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/GameApp.ts`

- [ ] **Step 1: Flow changes**

Flow should support:
- menu
- online.lobby (after joined)
- online.playing
- online.result

The URL should not require `player` parameter anymore.

- [ ] **Step 2: WS URL**

Default wsUrl becomes same-origin:
- If `location.protocol==="https:"` use `wss://<host>/ws`
- Else `ws://<host>/ws`

- [ ] **Step 3: Implement create/join**

When clicking create/join:
- Ensure landscape-only requirement holds (reuse existing rotate overlay)
- Connect WS if not connected
- Send create_room/join_room
- On joined message: set flow to online lobby with server-assigned seat/host

- [ ] **Step 4: Implement ready/start**

Ready button sends `ready`.
Host start sends `start`.

- [ ] **Step 5: Render online**

While in online:
- Always call `renderer.renderOnline(state)` when `state.type==="state"`
- In lobby, show lobby overlay (not result screen)
- In playing, show HUD
- In finished, show result with winner text; do not submit to local leaderboard

- [ ] **Step 6: Commit**

```bash
git add src/game/ui/flow.ts src/game/GameApp.ts
git commit -m "feat(app): integrate v2 online flow with create/join/ready/start and wss /ws"
```

---

## Task 8: Renderer improvements for online (ensure branches + correct player placement)

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/render/Renderer.ts`

- [ ] **Step 1: Ensure online obstacleSide always rendered when present**

In online render path, draw branch at `y = groundY - segmentHeight` using `state.pX.obstacleSide`.

- [ ] **Step 2: Ensure left tree always shows p1 and right shows p2**

Already uses leftX/rightX. Confirm player px is `treeX ± offset` based on `p.side`.

- [ ] **Step 3: Trigger opponent swing**

On score change trigger swing for that player (already). Add optional trigger on side change if desired.

- [ ] **Step 4: Commit**

```bash
git add src/game/render/Renderer.ts
git commit -m "feat(render): improve online branch rendering and action sync"
```

---

## Task 9: Verification (local + two-browser test)

- [ ] **Step 1: Run full web tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 2: Run server**

From `server/`: `npm run dev`

- [ ] **Step 3: Manual test**

Open `http://localhost:517x/` in two browsers/devices:
- Device A: 创建房间 → 得到 4 位房间号
- Device B: 输入房间号 → 加入
- A/B 各自点击准备
- A（房主）点击开始
- 两边能看到对方分数/时间/站位/挥刀
- 任意一方死亡不结束；两边都死亡后结束并显示胜者

- [ ] **Step 4: Deployment notes**

Server behind nginx: `/ws` proxy must be configured. Client wsUrl defaults to same-origin `/ws`.

- [ ] **Step 5: Commit final fixes (if any)**

```bash
git status
git add -A
git commit -m "chore: stabilize online multiplayer v2"
```

