# Online Multiplayer v2+ (视角固定右侧 + 单人同款树枝队列 + 指定房间号 + 房主难度) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让在线双人支持：自视角永远右侧、输入语义与单人一致、服务端权威维护并广播单人同款树枝队列、支持指定创建房间号且冲突报错、房主选择在线难度（仅影响 decayScale）、一方先死可观战直到双方都死。

**Architecture:** 服务端权威维护房间与对局模拟（含每位玩家的 upcoming 队列与样式队列），客户端只负责输入发送与基于 server state 的渲染/布局映射（右=我、左=对方）。协议仍为 v2，在 create_room / state / error 上做小幅扩展。

**Tech Stack:** TypeScript, ws(WebSocket server), Browser WebSocket client, Vite, Vitest (web + server).

---

## File Map (what changes where)

**Server**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/protocol.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/rooms.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/gameSim.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/server.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/rooms.test.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/gameSim.test.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/server.test.ts`

**Client (web)**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/net/protocol.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/net/protocol.test.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/net/OnlineClient.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/net/OnlineClient.test.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/ui/overlays.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/ui/overlays.test.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/ui/actions.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/GameApp.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/render/Renderer.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/styles.css`

---

### Task 1: Protocol v2+ (roomId create + host difficulty + ROOM_EXISTS + upcoming queues in state)

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/protocol.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/net/protocol.ts`
- Test: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/net/protocol.test.ts`

- [ ] **Step 1: Write failing protocol test (client)**

Add a new test that proves we can encode/decode the extended message shapes:

```ts
import { describe, expect, it } from "vitest";
import { decodeMessage, encodeMessage } from "./protocol";

describe("protocol v2+", () => {
  it("supports create_room with optional roomId and difficulty", () => {
    const msg = { v: 2, type: "create_room", roomId: "1234", difficulty: "normal" } as const;
    expect(decodeMessage(encodeMessage(msg))).toEqual(msg);
  });

  it("supports error ROOM_EXISTS", () => {
    const msg = { v: 2, type: "error", code: "ROOM_EXISTS", message: "x" } as const;
    expect(decodeMessage(encodeMessage(msg))).toEqual(msg);
  });

  it("supports state with difficulty and upcoming queues", () => {
    const msg = {
      v: 2,
      type: "state",
      roomId: "1234",
      serverTimeMs: 1,
      status: "lobby",
      hostPlayerId: "p1",
      difficulty: "hard",
      p1: {
        present: true,
        online: true,
        ready: false,
        score: 0,
        timeMs: 7000,
        status: "alive",
        side: "left",
        obstacleSide: null,
        upcomingObstacles: [null, "left"],
        upcomingObstacleStyles: [0, 1]
      },
      p2: {
        present: false,
        online: false,
        ready: false,
        score: 0,
        timeMs: 7000,
        status: "alive",
        side: "left",
        obstacleSide: null,
        upcomingObstacles: [null, "right"],
        upcomingObstacleStyles: [2, 3]
      },
      winner: null
    } as const;
    expect(decodeMessage(encodeMessage(msg))).toEqual(msg);
  });
});
```

- [ ] **Step 2: Run test and confirm it fails**

Run:

```bash
npm test -- src/game/net/protocol.test.ts
```

Expected: FAIL because types do not include new fields/codes.

- [ ] **Step 3: Implement protocol type changes (client + server)**

Update both protocol files so the test compiles and passes.

**Client** `src/game/net/protocol.ts`:

```ts
export type Difficulty = "easy" | "normal" | "hard";

export type CreateRoomV2 = { v: 2; type: "create_room"; roomId?: string; difficulty: Difficulty };

export type ErrorMessageV2 = {
  v: 2;
  type: "error";
  code:
    | "ROOM_NOT_FOUND"
    | "ROOM_FULL"
    | "INVALID_ROOM"
    | "ROOM_EXISTS"
    | "NOT_HOST"
    | "NOT_READY"
    | "BAD_STATE";
  message: string;
};

export type PlayerViewV2 = {
  present: boolean;
  online: boolean;
  ready: boolean;
  score: number;
  timeMs: number;
  status: "alive" | "dead";
  side: Side;
  obstacleSide: Side | null;
  upcomingObstacles: Array<Side | null>;
  upcomingObstacleStyles: number[];
};

export type StateMessageV2 = {
  v: 2;
  type: "state";
  roomId: string;
  serverTimeMs: number;
  status: "lobby" | "playing" | "finished";
  hostPlayerId: Seat;
  difficulty: Difficulty;
  p1: PlayerViewV2;
  p2: PlayerViewV2;
  winner: Seat | "draw" | null;
};
```

**Server** `server/src/protocol.ts` mirror the exact same changes.

- [ ] **Step 4: Run tests**

```bash
npm test -- src/game/net/protocol.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/protocol.ts src/game/net/protocol.ts src/game/net/protocol.test.ts
git commit -m "feat(net): extend v2 protocol for roomId create, host difficulty, full upcoming queues"
```

---

### Task 2: Server rooms (create with specified roomId + ROOM_EXISTS + store difficulty)

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/rooms.ts`
- Test: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/rooms.test.ts`

- [ ] **Step 1: Write failing test**

Append tests:

```ts
import { describe, expect, it } from "vitest";
import { defaultGameConfig } from "./config/gameConfig";
import { RoomStore } from "./rooms";

describe("rooms v2+", () => {
  it("creates room with specified 4-digit roomId and errors if it already exists", () => {
    const store = new RoomStore(defaultGameConfig(), () => 0.1);
    const ws1 = {} as any;
    const created = store.createRoom(ws1, { roomId: "1234", difficulty: "normal" });
    expect(created.room.roomId).toBe("1234");
    expect(created.room.difficulty).toBe("normal");

    const ws2 = {} as any;
    const again = store.createRoom(ws2, { roomId: "1234", difficulty: "hard" });
    expect(again).toEqual({ error: "ROOM_EXISTS" });
  });
});
```

- [ ] **Step 2: Run test and confirm it fails**

```bash
cd server
npm test -- src/rooms.test.ts
```

Expected: FAIL because createRoom signature and error code do not exist.

- [ ] **Step 3: Implement createRoom overload with params**

In `server/src/rooms.ts`:
- Add `Difficulty` type (import from protocol or re-declare identical union)
- Extend `Room`:

```ts
difficulty: "easy" | "normal" | "hard";
```

- Change `createRoom` to:

```ts
createRoom(
  ws: WebSocket,
  params: { roomId?: string; difficulty: "easy" | "normal" | "hard" }
): { room: Room; seat: Seat; isHost: boolean } | { error: "INVALID_ROOM" | "ROOM_EXISTS" }
```

Rules:
- if `params.roomId` provided:
  - validate with `isValidRoomId` else INVALID_ROOM
  - if rooms.has(roomId) then ROOM_EXISTS
  - else use that roomId
- else generate unique id (existing code)
- persist `difficulty` onto room

- [ ] **Step 4: Run server tests**

```bash
cd server
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/rooms.ts server/src/rooms.test.ts
git commit -m "feat(server): allow create_room with specified roomId and persist difficulty"
```

---

### Task 3: Server gameSim upgrades (single-like upcoming queues + styles; difficulty→decayScale mapping)

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/gameSim.ts`
- Test: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/gameSim.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests proving:
- sim creates `upcomingObstacles`/`upcomingObstacleStyles` with fixed length
- on safe chop, queues shift (index 1 becomes new index 0), styles shift with it
- obstacleSide mirrors upcoming[0]

Example:

```ts
import { describe, expect, it } from "vitest";
import { defaultGameConfig } from "./config/gameConfig";
import { applyInput, createMatchSim, startMatch } from "./gameSim";

describe("gameSim upcoming queues", () => {
  it("keeps upcoming obstacle styles stable across shifts", () => {
    const sim = createMatchSim(123, defaultGameConfig());
    startMatch(sim);
    const beforeObstacle1 = sim.p1.upcomingObstacles[1];
    const beforeStyle1 = sim.p1.upcomingObstacleStyles[1];

    sim.p1.upcomingObstacles[0] = null;
    applyInput(sim, "p1", "left");

    expect(sim.p1.upcomingObstacles[0]).toBe(beforeObstacle1);
    expect(sim.p1.upcomingObstacleStyles[0]).toBe(beforeStyle1);
  });
});
```

- [ ] **Step 2: Run test and confirm it fails**

```bash
cd server
npm test -- src/gameSim.test.ts
```

Expected: FAIL because fields don’t exist.

- [ ] **Step 3: Implement upcoming queues**

Update `PlayerSim` to include:

```ts
upcomingObstacles: Array<Side | null>;
upcomingObstacleStyles: number[];
styleRng: number;
```

Implementation rules:
- `upcomingLength = 16`
- init: fill with `nextObstacle` and `nextStyleId` (e.g. `nextUint32 % 4`)
- `obstacleSide` should equal `upcomingObstacles[0]`
- on safe chop: shift both arrays, push next entries, update `obstacleSide` to new [0]
- on death: do not shift

- [ ] **Step 4: Run server tests**

```bash
cd server
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/gameSim.ts server/src/gameSim.test.ts
git commit -m "feat(server): simulate single-like upcoming queues with stable styles"
```

---

### Task 4: Server broadcasting (state includes difficulty + upcoming queues; create_room accepts params)

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/server.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/server/src/server.test.ts`

- [ ] **Step 1: Write failing test**

In `server/src/server.test.ts`, assert `buildStateMessageV2(room)` includes `difficulty` and upcoming arrays:

```ts
expect(state.difficulty).toBe("normal");
expect(state.p1.upcomingObstacles.length).toBeGreaterThan(1);
expect(state.p1.upcomingObstacleStyles.length).toBe(state.p1.upcomingObstacles.length);
```

- [ ] **Step 2: Run server test and confirm it fails**

```bash
cd server
npm test -- src/server.test.ts
```

Expected: FAIL because state doesn’t include fields.

- [ ] **Step 3: Implement changes**

In `server/src/server.ts`:
- handle `create_room` message using `store.createRoom(ws, { roomId: msg.roomId, difficulty: msg.difficulty })`
- on store error: send error (`INVALID_ROOM` or `ROOM_EXISTS`) with proper message
- in `buildStateMessageV2(room)` include:
  - `difficulty: room.difficulty`
  - `upcomingObstacles` and `upcomingObstacleStyles` from each player sim
  - keep `obstacleSide` for convenience as `upcomingObstacles[0]`

- [ ] **Step 4: Run server tests**

```bash
cd server
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/server.ts server/src/server.test.ts
git commit -m "feat(server): broadcast difficulty and upcoming queues; create_room accepts roomId"
```

---

### Task 5: Client OnlineClient create_room params + ROOM_EXISTS handling

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/net/OnlineClient.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/net/OnlineClient.test.ts`

- [ ] **Step 1: Write failing test**

Add a test that `createRoom({ roomId, difficulty })` sends the new message:

```ts
expect(JSON.parse(ws.sent[0])).toEqual({ v: 2, type: "create_room", roomId: "1234", difficulty: "hard" });
```

- [ ] **Step 2: Run test and confirm it fails**

```bash
npm test -- src/game/net/OnlineClient.test.ts
```

- [ ] **Step 3: Implement**

Update `OnlineClient`:
- `createRoom(params: { roomId?: string; difficulty: "easy" | "normal" | "hard" }): void`
- keep `joinRoom(roomId)` as-is
- ensure lastError is updated for `ROOM_EXISTS`

- [ ] **Step 4: Run tests**

```bash
npm test -- src/game/net/OnlineClient.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/game/net/OnlineClient.ts src/game/net/OnlineClient.test.ts
git commit -m "feat(client): create_room supports roomId and difficulty; handle ROOM_EXISTS"
```

---

### Task 6: UI menu (roomId input for create/join + online difficulty select + show errors)

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/ui/overlays.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/ui/overlays.test.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/ui/actions.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/styles.css`

- [ ] **Step 1: Write failing overlay test**

Assert menu contains online difficulty selector (text “在线难度” and options).

- [ ] **Step 2: Run test and confirm it fails**

```bash
npm test -- src/game/ui/overlays.test.ts
```

- [ ] **Step 3: Implement overlays**

Add to menu:
- input: roomId (4 digits) shared by create/join
- select: online difficulty (`easy/normal/hard`)
- show error message area (reuse existing lobby error slot, but ensure it shows create/join errors too)

- [ ] **Step 4: Implement actions wiring**

Update handlers to pass:
- `onCreateRoom(params: { roomId?: string; difficulty: Difficulty })`
- `onJoinRoom(roomId: string)`

- [ ] **Step 5: Run tests**

```bash
npm test -- src/game/ui/overlays.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/game/ui/overlays.ts src/game/ui/overlays.test.ts src/game/ui/actions.ts src/styles.css
git commit -m "feat(ui): online difficulty select and roomId create/join with errors"
```

---

### Task 7: Client view mapping (right=me, left=other) for renderer + HUD + result

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/GameApp.ts`
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/ui/overlays.ts`

- [ ] **Step 1: Write failing test (lightweight)**

In `src/game/GameAppMenu.test.ts` or create a new test verifying that when joined as p1, right uses p1 scores and left uses p2 scores in the computed HUD text. If too heavy to instantiate, prefer a pure helper:
- Add a small pure function `mapOnlineView(state, meSeat)` exported from `GameApp.ts` and test it.

Example test (new file `src/game/online/viewMap.test.ts` is allowed if needed):

```ts
import { expect, it } from "vitest";
import { mapOnlineView } from "./GameApp";

it("maps right to me", () => {
  const view = mapOnlineView({ meSeat: "p2", state: { ... } as any });
  expect(view.right.score).toBe( /* p2 score */ );
  expect(view.left.score).toBe( /* p1 score */ );
});
```

- [ ] **Step 2: Run test and confirm it fails**

- [ ] **Step 3: Implement mapping and apply across HUD/renderer/result**

Rules:
- Renderer always renders left from `otherSeat`, right from `meSeat`
- HUD labels use “我/对方” not P1/P2
- Result subtitle shows `左 <score> vs 右 <score>`

- [ ] **Step 4: Run web tests**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/game/GameApp.ts src/game/ui/overlays.ts src/game/ui/overlays.test.ts src/styles.css src/game/online/viewMap.test.ts
git commit -m "feat(online): map view so right is always me (hud/renderer/result)"
```

---

### Task 8: Renderer online draws full upcoming queues (both players)

**Files:**
- Modify: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/render/Renderer.ts`
- Test: `/Users/zuohui/learn/self_projects/games/guihaiyidao/src/game/render/RendererInputAnim.test.ts` (if needed)

- [ ] **Step 1: Write failing test (minimal)**

Add a test that `renderOnline` can accept a state containing `upcomingObstacles`/`upcomingObstacleStyles` and does not throw.

- [ ] **Step 2: Run test and confirm it fails**

- [ ] **Step 3: Implement drawing**

Modify online draw path to:
- draw trunk
- loop upcoming obstacles (like single) for each player tree
- use `upcomingObstacleStyles[i]` for stable branch styles
- keep current “swing” fx triggering based on score increases, but ensure it uses mapped left/right player.

- [ ] **Step 4: Run tests**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/game/render/Renderer.ts src/game/render/RendererInputAnim.test.ts
git commit -m "feat(render): draw online trees with full upcoming obstacle queues"
```

---

### Task 9: End-to-end local smoke test steps (manual)

**No code changes required.**

- [ ] Start server:

```bash
cd /Users/zuohui/learn/self_projects/games/guihaiyidao/server
npm run dev
```

- [ ] Start web:

```bash
cd /Users/zuohui/learn/self_projects/games/guihaiyidao
npm run dev
```

- [ ] On phone A open: `http://<your-lan-ip>:5173/`
- [ ] On phone B open: `http://<your-lan-ip>:5173/`
- [ ] Create with roomId (e.g. 1234) and difficulty hard
- [ ] Attempt create same roomId from another device → expect ROOM_EXISTS error shown
- [ ] Join from second device → expect both see “我在右，对方在左”
- [ ] Ready both, host start
- [ ] Verify both sides show branches (not just trunk), and branches shift without changing style
- [ ] Kill one player early: that device stops controlling but continues to watch the other until both dead

---

## Plan Self-Review

- Spec coverage:
  - 视角固定右侧：Task 7
  - 输入语义：Task 7 + Task 6 wiring (input remains tap halves)
  - 单人同款树枝队列：Task 3 (server sim) + Task 8 (renderer)
  - 指定房间号创建与复用：Task 2 + Task 4
  - 房主难度：Task 1 + Task 2 + Task 4 + Task 6 + Task 5
  - 双方都结束才结束/观战：Task 3 + Task 7 (client input gating)
- Placeholder scan: none
- Type consistency: Difficulty union kept identical client/server; protocol v2+ mirrored in Task 1

---

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-05-23-online-multiplayer-v2p1-implementation.md`.

Two execution options:

1. Subagent-Driven (recommended)
2. Inline Execution

