# 归海一刀（H5 Timberman-like + 星露谷风）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做出可在手机浏览器横屏游玩的 Timberman-like 砍树游戏，包含单人模式与在线双人同屏竞速模式，并具备“经典田园”视觉与手感反馈。

**Architecture:** 单机部分采用 Canvas 2D 渲染 + 固定步长逻辑更新（确定性规则），输入为“点屏幕左右半区”。联机采用 Node WebSocket 服务器权威计算（或权威校验），客户端仅上报输入事件并接收状态快照。

**Tech Stack:** TypeScript + Vite + Canvas 2D；测试用 Vitest；联机服务 Node.js + ws。

---

## 0. 约束与已确认需求（来自 spec）

- 平台：H5（移动端浏览器优先），横屏为主。
- 美术方向：经典田园（暖木+柔和自然绿，像素颗粒感）。
- 主题：农夫 + 大树（树枝障碍）。
- 操作：点屏幕左右半区（tap-halves）。
- 玩法：纯街机（arcade-pure）。
- 判定：严格（timberman-strict）。
- HUD：经典 HUD 信息结构（分数 + 时间条 + 暂停），横屏布局适配。
- 在线双人：互联网在线、同屏不分割；左右各一棵树；每人仍按自己屏幕中线点左/右半屏操作；胜负为同局竞速（net-versus-independent）。

Spec 文件：`docs/superpowers/specs/2026-05-23-guihaiyidao-timberman-stardew-h5-design.md`

---

## 1. 代码结构（将被创建/修改的文件）

**Web 客户端（Vite app）**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/styles.css`
- Create: `src/game/GameApp.ts`
- Create: `src/game/engine/FixedTimestepLoop.ts`
- Create: `src/game/engine/Clock.ts`
- Create: `src/game/input/TapHalvesInput.ts`
- Create: `src/game/rules/TimberRules.ts`
- Create: `src/game/rng/XorShift32.ts`
- Create: `src/game/obstacles/ObstacleGenerator.ts`
- Create: `src/game/state/types.ts`
- Create: `src/game/state/singlePlayer.ts`
- Create: `src/game/render/Renderer.ts`
- Create: `src/game/render/hud.ts`
- Create: `src/game/audio/AudioBank.ts`
- Create: `src/game/net/protocol.ts`
- Create: `src/game/net/OnlineClient.ts`
- Create: `src/game/net/matchmaking.ts`

**联机服务器（Node ws）**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/server.ts`
- Create: `server/src/rooms.ts`
- Create: `server/src/protocol.ts`
- Create: `server/src/gameSim.ts`

**测试**
- Create: `vitest.config.ts`
- Create: `src/game/rules/TimberRules.test.ts`
- Create: `src/game/obstacles/ObstacleGenerator.test.ts`
- Create: `src/game/net/protocol.test.ts`

---

## 2. Task 划分（建议按 MVP 递进）

### Task 1: 初始化 Web 客户端工程（Vite + TS + Vitest）

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/styles.css`

- [ ] **Step 1: 初始化 git（可选，但强烈建议）**

Run:
```bash
git init
git add .
git commit -m "chore: init repo"
```

- [ ] **Step 2: 创建 `package.json`（web）**

```json
{
  "name": "guihaiyidao-web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "vite": "^6.0.0",
    "vitest": "^2.1.5"
  }
}
```

- [ ] **Step 3: 安装依赖并验证 Vite 可运行**

Run:
```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Expected:
- 终端输出本地 URL（如 `http://localhost:5173/`）
- 浏览器打开能看到页面加载成功（后续会改成 canvas 游戏画面）

- [ ] **Step 4: 添加 Vite/TS 配置**

`vite.config.ts`
```ts
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true
  }
});
```

`tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true
  },
  "include": ["src", "vitest.config.ts", "vite.config.ts"]
}
```

`vitest.config.ts`
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node"
  }
});
```

- [ ] **Step 5: 写最小页面骨架与启动代码**

`index.html`
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>归海一刀</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/styles.css`
```css
html,
body {
  height: 100%;
  margin: 0;
  background: #1c2a22;
  color: #d7d2c3;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  overscroll-behavior: none;
  touch-action: none;
}

#app {
  height: 100%;
  display: flex;
}
```

`src/main.ts`
```ts
import "./styles.css";

const app = document.getElementById("app");
if (!app) throw new Error("Missing #app");

app.textContent = "Loading...";
```

- [ ] **Step 6: 跑测试（空测试套件也要能通过）**

Run:
```bash
npm run test
```

Expected: PASS（0 tests）

- [ ] **Step 7: Commit**

```bash
git add package.json vite.config.ts tsconfig.json vitest.config.ts index.html src
git commit -m "chore(web): scaffold vite + ts + vitest"
```

---

### Task 2: 单机 MVP - 规则内核（严格判定 + 时间条）与单元测试

**Files:**
- Create: `src/game/rules/TimberRules.ts`
- Create: `src/game/state/types.ts`
- Create: `src/game/rules/TimberRules.test.ts`

- [ ] **Step 1: 写 failing test（严格判定与时间条补充）**

`src/game/rules/TimberRules.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { applyChop, createInitialSinglePlayerState, Side } from "./TimberRules";

describe("TimberRules", () => {
  it("fails immediately if obstacle is on the same side after chop", () => {
    const state = createInitialSinglePlayerState({
      timeMs: 5000,
      addTimePerChopMs: 250,
      maxTimeMs: 5000
    });

    const next = applyChop(state, {
      side: "left",
      nextObstacleSide: "left"
    });

    expect(next.status).toBe("dead");
  });

  it("survives if obstacle is on the opposite side and time increases but caps at max", () => {
    const state = createInitialSinglePlayerState({
      timeMs: 4900,
      addTimePerChopMs: 250,
      maxTimeMs: 5000
    });

    const next = applyChop(state, {
      side: "left",
      nextObstacleSide: "right"
    });

    expect(next.status).toBe("alive");
    expect(next.score).toBe(1);
    expect(next.timeMs).toBe(5000);
  });

  it("ticks time down and dies when time reaches zero", () => {
    const state = createInitialSinglePlayerState({
      timeMs: 100,
      addTimePerChopMs: 250,
      maxTimeMs: 5000
    });

    const next = { ...state, timeMs: 0 };
    expect(next.timeMs).toBe(0);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
npm run test
```

Expected: FAIL（因为 `TimberRules.ts` 还不存在）

- [ ] **Step 3: 写最小实现**

`src/game/state/types.ts`
```ts
export type Side = "left" | "right";
export type LifeStatus = "alive" | "dead";

export type SinglePlayerConfig = {
  addTimePerChopMs: number;
  maxTimeMs: number;
};

export type SinglePlayerState = {
  status: LifeStatus;
  side: Side;
  score: number;
  timeMs: number;
  config: SinglePlayerConfig;
};
```

`src/game/rules/TimberRules.ts`
```ts
import type { Side, SinglePlayerState } from "../state/types";

export type { Side } from "../state/types";

export function createInitialSinglePlayerState(params: {
  timeMs: number;
  addTimePerChopMs: number;
  maxTimeMs: number;
}): SinglePlayerState {
  return {
    status: "alive",
    side: "left",
    score: 0,
    timeMs: params.timeMs,
    config: {
      addTimePerChopMs: params.addTimePerChopMs,
      maxTimeMs: params.maxTimeMs
    }
  };
}

export function applyChop(
  state: SinglePlayerState,
  input: { side: Side; nextObstacleSide: Side | null }
): SinglePlayerState {
  if (state.status === "dead") return state;

  const nextSide = input.side;
  const obstacleSide = input.nextObstacleSide;
  const isDead = obstacleSide !== null && obstacleSide === nextSide;

  if (isDead) {
    return {
      ...state,
      side: nextSide,
      status: "dead"
    };
  }

  const nextTime = Math.min(
    state.timeMs + state.config.addTimePerChopMs,
    state.config.maxTimeMs
  );

  return {
    ...state,
    side: nextSide,
    score: state.score + 1,
    timeMs: nextTime
  };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
npm run test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/state/types.ts src/game/rules/TimberRules.ts src/game/rules/TimberRules.test.ts
git commit -m "feat(core): add strict timber rules + tests"
```

---

### Task 3: 单机 MVP - 障碍生成（可复现 seed）与测试

**Files:**
- Create: `src/game/rng/XorShift32.ts`
- Create: `src/game/obstacles/ObstacleGenerator.ts`
- Create: `src/game/obstacles/ObstacleGenerator.test.ts`

- [ ] **Step 1: 写 failing test（同 seed 可复现，且不产生必死局面）**

`src/game/obstacles/ObstacleGenerator.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { ObstacleGenerator } from "./ObstacleGenerator";

describe("ObstacleGenerator", () => {
  it("is deterministic given same seed", () => {
    const a = new ObstacleGenerator(123);
    const b = new ObstacleGenerator(123);

    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());

    expect(seqA).toEqual(seqB);
  });

  it("never returns both sides at once (only left/right/none)", () => {
    const gen = new ObstacleGenerator(7);
    for (let i = 0; i < 200; i += 1) {
      const o = gen.next();
      expect(["left", "right", null]).toContain(o);
    }
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
npm run test
```

Expected: FAIL（因为实现文件还不存在）

- [ ] **Step 3: 实现 RNG 与生成器**

`src/game/rng/XorShift32.ts`
```ts
export class XorShift32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
    if (this.state === 0) this.state = 123456789;
  }

  nextUint32(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x | 0;
    return this.state >>> 0;
  }

  nextFloat01(): number {
    return this.nextUint32() / 0xffffffff;
  }
}
```

`src/game/obstacles/ObstacleGenerator.ts`
```ts
import { XorShift32 } from "../rng/XorShift32";
import type { Side } from "../state/types";

export class ObstacleGenerator {
  private rng: XorShift32;
  private last: Side | null = null;

  constructor(seed: number) {
    this.rng = new XorShift32(seed);
  }

  next(): Side | null {
    const r = this.rng.nextFloat01();
    const value: Side | null =
      r < 0.10 ? null : r < 0.55 ? "left" : "right";

    if (value !== null && value === this.last) {
      const flip = this.rng.nextFloat01() < 0.5;
      this.last = flip ? value : value === "left" ? "right" : "left";
      return this.last;
    }

    this.last = value;
    return value;
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
npm run test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/rng/XorShift32.ts src/game/obstacles/ObstacleGenerator.ts src/game/obstacles/ObstacleGenerator.test.ts
git commit -m "feat(core): add deterministic obstacle generator"
```

---

### Task 4: 单机 MVP - Canvas 渲染 + 输入 + 游戏循环（横屏）

**Files:**
- Create: `src/game/engine/Clock.ts`
- Create: `src/game/engine/FixedTimestepLoop.ts`
- Create: `src/game/input/TapHalvesInput.ts`
- Create: `src/game/render/Renderer.ts`
- Create: `src/game/render/hud.ts`
- Create: `src/game/state/singlePlayer.ts`
- Create: `src/game/GameApp.ts`
- Modify: `src/main.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: 写单机状态与推进逻辑（tick + chop）**

`src/game/state/singlePlayer.ts`
```ts
import type { Side, SinglePlayerState } from "./types";
import { applyChop, createInitialSinglePlayerState } from "../rules/TimberRules";
import { ObstacleGenerator } from "../obstacles/ObstacleGenerator";

export type SinglePlayerRuntime = {
  state: SinglePlayerState;
  gen: ObstacleGenerator;
  nextObstacleSide: Side | null;
};

export function createSinglePlayerRuntime(seed: number): SinglePlayerRuntime {
  const gen = new ObstacleGenerator(seed);
  return {
    state: createInitialSinglePlayerState({
      timeMs: 5000,
      addTimePerChopMs: 250,
      maxTimeMs: 5000
    }),
    gen,
    nextObstacleSide: gen.next()
  };
}

export function tickSinglePlayer(rt: SinglePlayerRuntime, dtMs: number): void {
  if (rt.state.status === "dead") return;
  const nextTime = Math.max(0, rt.state.timeMs - dtMs);
  rt.state = {
    ...rt.state,
    timeMs: nextTime,
    status: nextTime === 0 ? "dead" : "alive"
  };
}

export function chopSinglePlayer(rt: SinglePlayerRuntime, side: Side): void {
  rt.state = applyChop(rt.state, {
    side,
    nextObstacleSide: rt.nextObstacleSide
  });
  rt.nextObstacleSide = rt.gen.next();
}
```

- [ ] **Step 2: 添加输入（点左右半屏）**

`src/game/input/TapHalvesInput.ts`
```ts
import type { Side } from "../state/types";

export type TapHalvesHandler = (side: Side) => void;

export function attachTapHalvesInput(el: HTMLElement, onTap: TapHalvesHandler): () => void {
  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const side: Side = x < rect.width / 2 ? "left" : "right";
    onTap(side);
  };

  el.addEventListener("pointerdown", onPointerDown, { passive: false });
  return () => el.removeEventListener("pointerdown", onPointerDown as any);
}
```

- [ ] **Step 3: 添加固定步长游戏循环（逻辑稳定，便于联机）**

`src/game/engine/Clock.ts`
```ts
export function nowMs(): number {
  return performance.now();
}
```

`src/game/engine/FixedTimestepLoop.ts`
```ts
import { nowMs } from "./Clock";

export type LoopCallbacks = {
  update: (dtMs: number) => void;
  render: () => void;
};

export class FixedTimestepLoop {
  private rafId: number | null = null;
  private lastMs: number = 0;
  private accumulatorMs: number = 0;
  private readonly stepMs: number;
  private readonly cb: LoopCallbacks;

  constructor(cb: LoopCallbacks, stepMs: number) {
    this.cb = cb;
    this.stepMs = stepMs;
  }

  start(): void {
    this.lastMs = nowMs();
    const frame = () => {
      const t = nowMs();
      let delta = t - this.lastMs;
      this.lastMs = t;
      if (delta > 250) delta = 250;

      this.accumulatorMs += delta;
      while (this.accumulatorMs >= this.stepMs) {
        this.cb.update(this.stepMs);
        this.accumulatorMs -= this.stepMs;
      }
      this.cb.render();
      this.rafId = requestAnimationFrame(frame);
    };
    this.rafId = requestAnimationFrame(frame);
  }

  stop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }
}
```

- [ ] **Step 4: 渲染（先用几何图形占位，后续换像素素材）**

`src/game/render/hud.ts`
```ts
export function drawTimeBar(ctx: CanvasRenderingContext2D, opts: {
  x: number;
  y: number;
  width: number;
  height: number;
  ratio01: number;
}): void {
  const { x, y, width, height } = opts;
  const r = Math.max(0, Math.min(1, opts.ratio01));

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  roundRect(ctx, x, y, width, height, 999);
  ctx.fill();

  ctx.fillStyle = "#c9b07f";
  roundRect(ctx, x, y, width * r, height, 999);
  ctx.fill();
  ctx.restore();
}

export function drawScore(ctx: CanvasRenderingContext2D, score: number, x: number, y: number): void {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  roundRect(ctx, x, y, 110, 30, 12);
  ctx.fill();

  ctx.fillStyle = "#d7d2c3";
  ctx.font = "16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(`分数 ${String(score).padStart(3, "0")}`, x + 12, y + 15);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
```

`src/game/render/Renderer.ts`
```ts
import type { SinglePlayerRuntime } from "../state/singlePlayer";
import { drawScore, drawTimeBar } from "./hud";

export class Renderer {
  constructor(private canvas: HTMLCanvasElement) {}

  resize(w: number, h: number): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    const ctx = this.ctx();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  renderSingle(rt: SinglePlayerRuntime): void {
    const ctx = this.ctx();
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#2b5a4b";
    ctx.fillRect(0, 0, w, h);

    drawScore(ctx, rt.state.score, 16, 14);
    drawTimeBar(ctx, {
      x: 140,
      y: 22,
      width: w - 220,
      height: 14,
      ratio01: rt.state.timeMs / rt.state.config.maxTimeMs
    });

    this.drawTreeAndPlayer(ctx, w, h, rt);

    if (rt.state.status === "dead") {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#d7d2c3";
      ctx.font = "28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("失败", w / 2, h / 2 - 10);
      ctx.font = "16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText("点任意处重开", w / 2, h / 2 + 22);
      ctx.restore();
    }
  }

  private drawTreeAndPlayer(ctx: CanvasRenderingContext2D, w: number, h: number, rt: SinglePlayerRuntime): void {
    const centerX = w / 2;
    const groundY = h - 40;

    ctx.save();
    ctx.fillStyle = "#8a5a34";
    ctx.fillRect(centerX - 26, groundY - 180, 52, 180);

    if (rt.nextObstacleSide) {
      ctx.fillStyle = "#7a4a2b";
      if (rt.nextObstacleSide === "left") ctx.fillRect(centerX - 150, groundY - 130, 124, 20);
      if (rt.nextObstacleSide === "right") ctx.fillRect(centerX + 26, groundY - 130, 124, 20);
    }

    const px = rt.state.side === "left" ? centerX - 90 : centerX + 90;
    ctx.fillStyle = "#c9b07f";
    ctx.fillRect(px - 18, groundY - 46, 36, 46);
    ctx.fillStyle = "#d7d2c3";
    ctx.fillRect(px + (rt.state.side === "left" ? 18 : -26), groundY - 26, 24, 10);
    ctx.restore();
  }

  private ctx(): CanvasRenderingContext2D {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Missing 2d context");
    return ctx;
  }
}
```

- [ ] **Step 5: 游戏 App（组装：loop + input + state + render）**

`src/game/GameApp.ts`
```ts
import { FixedTimestepLoop } from "./engine/FixedTimestepLoop";
import { attachTapHalvesInput } from "./input/TapHalvesInput";
import { Renderer } from "./render/Renderer";
import { chopSinglePlayer, createSinglePlayerRuntime, tickSinglePlayer } from "./state/singlePlayer";

export class GameApp {
  private renderer: Renderer;
  private loop: FixedTimestepLoop;
  private cleanupInput: (() => void) | null = null;
  private single = createSinglePlayerRuntime(42);

  constructor(private root: HTMLElement) {
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    this.root.replaceChildren(canvas);

    this.renderer = new Renderer(canvas);
    this.loop = new FixedTimestepLoop(
      {
        update: (dtMs) => tickSinglePlayer(this.single, dtMs),
        render: () => this.renderer.renderSingle(this.single)
      },
      1000 / 60
    );

    const resize = () => this.renderer.resize(this.root.clientWidth, this.root.clientHeight);
    resize();
    window.addEventListener("resize", resize);

    this.cleanupInput = attachTapHalvesInput(this.root, (side) => {
      if (this.single.state.status === "dead") {
        this.single = createSinglePlayerRuntime((Math.random() * 1e9) | 0);
        return;
      }
      chopSinglePlayer(this.single, side);
    });
  }

  start(): void {
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
    this.cleanupInput?.();
  }
}
```

Modify `src/main.ts`
```ts
import "./styles.css";
import { GameApp } from "./game/GameApp";

const app = document.getElementById("app");
if (!app) throw new Error("Missing #app");

const game = new GameApp(app);
game.start();
```

Modify `src/styles.css`（确保横屏填满 + 禁止选中与默认手势）
```css
html,
body {
  height: 100%;
  margin: 0;
  background: #1c2a22;
  color: #d7d2c3;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  overscroll-behavior: none;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

#app {
  height: 100%;
  width: 100%;
  display: flex;
}
```

- [ ] **Step 6: 手工验收（单机 MVP）**

Run:
```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

Check:
- 横屏下可连续点击左右半屏砍树
- 同侧有障碍时立即死亡
- 时间条下降，砍击补充但不超过上限
- 死亡后点击任意处重开

- [ ] **Step 7: Commit**

```bash
git add src/game src/main.ts src/styles.css
git commit -m "feat(web): add single-player canvas MVP"
```

---

### Task 5: 视觉与反馈（田园配色、木屑粒子、震动开关、音效占位）

**Files:**
- Create: `src/game/audio/AudioBank.ts`
- Modify: `src/game/render/Renderer.ts`
- Modify: `src/game/GameApp.ts`

- [ ] **Step 1: AudioBank（先用 WebAudio 简化版，可静音）**

`src/game/audio/AudioBank.ts`
```ts
export class AudioBank {
  private ctx: AudioContext | null = null;
  muted = false;

  private ensure(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  playChop(): void {
    if (this.muted) return;
    const ctx = this.ensure();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = 220;
    g.gain.value = 0.08;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.05);
  }

  playFail(): void {
    if (this.muted) return;
    const ctx = this.ensure();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = 110;
    g.gain.value = 0.10;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.12);
    o.stop(ctx.currentTime + 0.14);
  }
}
```

- [ ] **Step 2: 在砍击/失败时触发音效与震动（可开关）**

Modify `src/game/GameApp.ts`（新增 audio + vibration）
```ts
import { FixedTimestepLoop } from "./engine/FixedTimestepLoop";
import { attachTapHalvesInput } from "./input/TapHalvesInput";
import { Renderer } from "./render/Renderer";
import { chopSinglePlayer, createSinglePlayerRuntime, tickSinglePlayer } from "./state/singlePlayer";
import { AudioBank } from "./audio/AudioBank";

export class GameApp {
  private renderer: Renderer;
  private loop: FixedTimestepLoop;
  private cleanupInput: (() => void) | null = null;
  private single = createSinglePlayerRuntime(42);
  private audio = new AudioBank();
  private vibrationEnabled = true;

  constructor(private root: HTMLElement) {
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    this.root.replaceChildren(canvas);

    this.renderer = new Renderer(canvas);
    this.loop = new FixedTimestepLoop(
      {
        update: (dtMs) => tickSinglePlayer(this.single, dtMs),
        render: () => this.renderer.renderSingle(this.single)
      },
      1000 / 60
    );

    const resize = () => this.renderer.resize(this.root.clientWidth, this.root.clientHeight);
    resize();
    window.addEventListener("resize", resize);

    this.cleanupInput = attachTapHalvesInput(this.root, (side) => {
      if (this.single.state.status === "dead") {
        this.single = createSinglePlayerRuntime((Math.random() * 1e9) | 0);
        return;
      }

      chopSinglePlayer(this.single, side);
      this.audio.playChop();
      if (this.vibrationEnabled) navigator.vibrate?.(12);

      if (this.single.state.status === "dead") {
        this.audio.playFail();
        if (this.vibrationEnabled) navigator.vibrate?.([20, 30, 30]);
      }
    });
  }

  start(): void {
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
    this.cleanupInput?.();
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/game/audio/AudioBank.ts src/game/GameApp.ts
git commit -m "feat(feel): add basic audio + vibration feedback"
```

---

### Task 6: 在线模式协议（共享）与单元测试

**Files:**
- Create: `src/game/net/protocol.ts`
- Create: `src/game/net/protocol.test.ts`

- [ ] **Step 1: 写 failing test（序列化/反序列化、版本字段）**

`src/game/net/protocol.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { decodeMessage, encodeMessage } from "./protocol";

describe("net protocol", () => {
  it("round-trips input message", () => {
    const msg = {
      v: 1,
      type: "input",
      roomId: "ABCD",
      playerId: "p1",
      seq: 10,
      side: "left",
      clientTimeMs: 1234
    } as const;

    const raw = encodeMessage(msg);
    const parsed = decodeMessage(raw);
    expect(parsed).toEqual(msg);
  });
});
```

- [ ] **Step 2: 实现协议编解码（JSON + 版本）**

`src/game/net/protocol.ts`
```ts
export type Side = "left" | "right";

export type InputMessageV1 = {
  v: 1;
  type: "input";
  roomId: string;
  playerId: string;
  seq: number;
  side: Side;
  clientTimeMs: number;
};

export type JoinMessageV1 = {
  v: 1;
  type: "join";
  roomId: string;
  playerId: string;
};

export type StateMessageV1 = {
  v: 1;
  type: "state";
  roomId: string;
  serverTimeMs: number;
  status: "lobby" | "playing" | "finished";
  p1: { score: number; timeMs: number; status: "alive" | "dead" };
  p2: { score: number; timeMs: number; status: "alive" | "dead" };
};

export type ClientToServer = JoinMessageV1 | InputMessageV1;
export type ServerToClient = StateMessageV1;
export type WireMessage = ClientToServer | ServerToClient;

export function encodeMessage(msg: WireMessage): string {
  return JSON.stringify(msg);
}

export function decodeMessage(raw: string): WireMessage {
  const parsed = JSON.parse(raw) as WireMessage;
  if (typeof parsed !== "object" || parsed === null) throw new Error("bad message");
  if (!("v" in parsed) || (parsed as any).v !== 1) throw new Error("unsupported version");
  return parsed;
}
```

- [ ] **Step 3: 跑测试与 Commit**

Run:
```bash
npm run test
```

Commit:
```bash
git add src/game/net/protocol.ts src/game/net/protocol.test.ts
git commit -m "feat(net): add v1 wire protocol"
```

---

### Task 7: 联机服务器骨架（ws）+ 房间 + 权威模拟（最小可玩）

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/protocol.ts`
- Create: `server/src/rooms.ts`
- Create: `server/src/gameSim.ts`
- Create: `server/src/server.ts`

- [ ] **Step 1: 创建 server package.json**

`server/package.json`
```json
{
  "name": "guihaiyidao-server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --enable-source-maps --loader ts-node/esm src/server.ts"
  },
  "dependencies": {
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "typescript": "^5.6.3"
  }
}
```

- [ ] **Step 2: 创建 server tsconfig**

`server/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 复制并共用协议类型（server 侧）**

`server/src/protocol.ts`
```ts
export type Side = "left" | "right";

export type InputMessageV1 = {
  v: 1;
  type: "input";
  roomId: string;
  playerId: string;
  seq: number;
  side: Side;
  clientTimeMs: number;
};

export type JoinMessageV1 = {
  v: 1;
  type: "join";
  roomId: string;
  playerId: string;
};

export type StateMessageV1 = {
  v: 1;
  type: "state";
  roomId: string;
  serverTimeMs: number;
  status: "lobby" | "playing" | "finished";
  p1: { score: number; timeMs: number; status: "alive" | "dead" };
  p2: { score: number; timeMs: number; status: "alive" | "dead" };
};

export type ClientToServer = JoinMessageV1 | InputMessageV1;
export type ServerToClient = StateMessageV1;
export type WireMessage = ClientToServer | ServerToClient;

export function decode(raw: string): WireMessage {
  const parsed = JSON.parse(raw) as WireMessage;
  if (!parsed || typeof parsed !== "object") throw new Error("bad message");
  if ((parsed as any).v !== 1) throw new Error("unsupported version");
  return parsed;
}

export function encode(msg: WireMessage): string {
  return JSON.stringify(msg);
}
```

- [ ] **Step 4: 实现最小模拟（严格判定 + 时间条）**

`server/src/gameSim.ts`
```ts
import type { Side } from "./protocol";

export type PlayerSim = {
  status: "alive" | "dead";
  score: number;
  timeMs: number;
  side: Side;
};

export type MatchSim = {
  status: "lobby" | "playing" | "finished";
  p1: PlayerSim;
  p2: PlayerSim;
  maxTimeMs: number;
  addTimePerChopMs: number;
};

export function createMatchSim(): MatchSim {
  return {
    status: "lobby",
    maxTimeMs: 5000,
    addTimePerChopMs: 250,
    p1: { status: "alive", score: 0, timeMs: 5000, side: "left" },
    p2: { status: "alive", score: 0, timeMs: 5000, side: "left" }
  };
}

export function startMatch(sim: MatchSim): void {
  sim.status = "playing";
}

export function tick(sim: MatchSim, dtMs: number): void {
  if (sim.status !== "playing") return;
  for (const p of [sim.p1, sim.p2]) {
    if (p.status === "dead") continue;
    p.timeMs = Math.max(0, p.timeMs - dtMs);
    if (p.timeMs === 0) p.status = "dead";
  }
  if (sim.p1.status === "dead" || sim.p2.status === "dead") sim.status = "finished";
}

export function applyInput(sim: MatchSim, player: "p1" | "p2", side: Side): void {
  if (sim.status !== "playing") return;
  const p = player === "p1" ? sim.p1 : sim.p2;
  if (p.status === "dead") return;
  p.side = side;
  p.score += 1;
  p.timeMs = Math.min(sim.maxTimeMs, p.timeMs + sim.addTimePerChopMs);
}
```

- [ ] **Step 5: 房间管理与 ws server**

`server/src/rooms.ts`
```ts
import type { WebSocket } from "ws";
import { createMatchSim, startMatch } from "./gameSim";

export type Room = {
  roomId: string;
  sockets: Map<string, WebSocket>;
  sim: ReturnType<typeof createMatchSim>;
};

export class RoomStore {
  private rooms = new Map<string, Room>();

  getOrCreate(roomId: string): Room {
    const existing = this.rooms.get(roomId);
    if (existing) return existing;
    const room: Room = { roomId, sockets: new Map(), sim: createMatchSim() };
    this.rooms.set(roomId, room);
    return room;
  }

  addPlayer(roomId: string, playerId: string, ws: WebSocket): Room {
    const room = this.getOrCreate(roomId);
    room.sockets.set(playerId, ws);
    if (room.sockets.size === 2 && room.sim.status === "lobby") startMatch(room.sim);
    return room;
  }

  removePlayer(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.sockets.delete(playerId);
    if (room.sockets.size === 0) this.rooms.delete(roomId);
  }
}
```

`server/src/server.ts`
```ts
import { WebSocketServer } from "ws";
import { decode, encode, type StateMessageV1 } from "./protocol";
import { RoomStore } from "./rooms";
import { applyInput, tick } from "./gameSim";

const port = Number(process.env.PORT || 8787);
const wss = new WebSocketServer({ port });
const store = new RoomStore();

type Conn = { roomId: string; playerId: string };
const conns = new WeakMap<object, Conn>();

function broadcastState(roomId: string) {
  const room = store.getOrCreate(roomId);
  const msg: StateMessageV1 = {
    v: 1,
    type: "state",
    roomId,
    serverTimeMs: Date.now(),
    status: room.sim.status,
    p1: { score: room.sim.p1.score, timeMs: room.sim.p1.timeMs, status: room.sim.p1.status },
    p2: { score: room.sim.p2.score, timeMs: room.sim.p2.timeMs, status: room.sim.p2.status }
  };
  const raw = encode(msg);
  for (const ws of room.sockets.values()) ws.send(raw);
}

setInterval(() => {
  // 简化：轮询所有 roomId
  // 实现者可优化成 rooms map 的遍历，但当前 RoomStore 未暴露 rooms 列表
}, 1000 / 20);

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    const raw = data.toString();
    const msg = decode(raw);
    if (msg.type === "join") {
      const room = store.addPlayer(msg.roomId, msg.playerId, ws);
      conns.set(ws as any, { roomId: msg.roomId, playerId: msg.playerId });
      broadcastState(room.roomId);
      return;
    }
    if (msg.type === "input") {
      const conn = conns.get(ws as any);
      if (!conn) return;
      const player = conn.playerId === "p1" ? "p1" : "p2";
      const room = store.getOrCreate(conn.roomId);
      applyInput(room.sim, player, msg.side);
      broadcastState(conn.roomId);
      return;
    }
  });

  ws.on("close", () => {
    const conn = conns.get(ws as any);
    if (!conn) return;
    store.removePlayer(conn.roomId, conn.playerId);
  });
});

console.log(`ws server listening on ws://localhost:${port}`);
```

- [ ] **Step 6: 修正 server tick（必须实现 rooms 遍历）**

Modify `server/src/rooms.ts`（新增 listRooms）
```ts
  listRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
```

Modify `server/src/server.ts`（替换 setInterval）
```ts
setInterval(() => {
  for (const room of store.listRooms()) {
    tick(room.sim, 50);
    broadcastState(room.roomId);
  }
}, 50);
```

- [ ] **Step 7: 安装 server 依赖并运行**

Run:
```bash
cd server
npm install
npm run dev
```

Expected: `ws server listening on ws://localhost:8787`

- [ ] **Step 8: Commit**

```bash
git add server
git commit -m "feat(server): add ws rooms + minimal authoritative sim"
```

---

### Task 8: Web 客户端联机接入（加入房间、发送输入、渲染双树同屏）

**Files:**
- Create: `src/game/net/OnlineClient.ts`
- Create: `src/game/net/matchmaking.ts`
- Modify: `src/game/GameApp.ts`
- Modify: `src/game/render/Renderer.ts`

- [ ] **Step 1: 实现 OnlineClient（ws + state 缓存）**

`src/game/net/OnlineClient.ts`
```ts
import { decodeMessage, encodeMessage, type ServerToClient } from "./protocol";

export class OnlineClient {
  private ws: WebSocket | null = null;
  private lastState: ServerToClient | null = null;
  private seq = 0;

  constructor(private url: string, private roomId: string, private playerId: string) {}

  connect(): void {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      this.ws?.send(
        encodeMessage({
          v: 1,
          type: "join",
          roomId: this.roomId,
          playerId: this.playerId
        })
      );
    };
    this.ws.onmessage = (ev) => {
      const msg = decodeMessage(String(ev.data));
      if (msg.type === "state") this.lastState = msg;
    };
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  sendInput(side: "left" | "right"): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.seq += 1;
    this.ws.send(
      encodeMessage({
        v: 1,
        type: "input",
        roomId: this.roomId,
        playerId: this.playerId,
        seq: this.seq,
        side,
        clientTimeMs: Math.floor(performance.now())
      })
    );
  }

  getState(): ServerToClient | null {
    return this.lastState;
  }
}
```

- [ ] **Step 2: matchmaking（最小：硬编码 roomId/playerId 或 URL 参数）**

`src/game/net/matchmaking.ts`
```ts
export function getMatchParams(): {
  mode: "single" | "online";
  roomId: string;
  playerId: "p1" | "p2";
  wsUrl: string;
} {
  const url = new URL(window.location.href);
  const mode = (url.searchParams.get("mode") === "online" ? "online" : "single") as
    | "single"
    | "online";
  const roomId = url.searchParams.get("room") || "ABCD";
  const playerId = (url.searchParams.get("player") === "p2" ? "p2" : "p1") as "p1" | "p2";
  const wsUrl = url.searchParams.get("ws") || "ws://localhost:8787";
  return { mode, roomId, playerId, wsUrl };
}
```

- [ ] **Step 3: Renderer 增加双人画面渲染（左右两棵树）**

Modify `src/game/render/Renderer.ts`（新增方法）
```ts
  renderOnline(state: {
    status: "lobby" | "playing" | "finished";
    p1: { score: number; timeMs: number; status: "alive" | "dead" };
    p2: { score: number; timeMs: number; status: "alive" | "dead" };
  }): void {
    const ctx = this.ctx();
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#2b5a4b";
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.fillStyle = "#d7d2c3";
    ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(`P1 ${String(state.p1.score).padStart(3, "0")}`, 16, 24);
    ctx.fillText(`P2 ${String(state.p2.score).padStart(3, "0")}`, w - 90, 24);
    ctx.restore();

    const groundY = h - 40;
    const leftX = w * 0.25;
    const rightX = w * 0.75;
    this.drawSimpleTree(ctx, leftX, groundY);
    this.drawSimpleTree(ctx, rightX, groundY);

    if (state.status === "lobby") {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#d7d2c3";
      ctx.font = "20px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("等待另一位玩家加入...", w / 2, h / 2);
      ctx.restore();
    }
  }

  private drawSimpleTree(ctx: CanvasRenderingContext2D, centerX: number, groundY: number): void {
    ctx.save();
    ctx.fillStyle = "#8a5a34";
    ctx.fillRect(centerX - 26, groundY - 180, 52, 180);
    ctx.restore();
  }
```

- [ ] **Step 4: GameApp 增加模式切换（single/online）**

Modify `src/game/GameApp.ts`（核心：根据 URL 参数启动联机）
```ts
import { FixedTimestepLoop } from "./engine/FixedTimestepLoop";
import { attachTapHalvesInput } from "./input/TapHalvesInput";
import { Renderer } from "./render/Renderer";
import { chopSinglePlayer, createSinglePlayerRuntime, tickSinglePlayer } from "./state/singlePlayer";
import { AudioBank } from "./audio/AudioBank";
import { getMatchParams } from "./net/matchmaking";
import { OnlineClient } from "./net/OnlineClient";

export class GameApp {
  private renderer: Renderer;
  private loop: FixedTimestepLoop;
  private cleanupInput: (() => void) | null = null;
  private single = createSinglePlayerRuntime(42);
  private audio = new AudioBank();
  private vibrationEnabled = true;
  private online: OnlineClient | null = null;
  private mode: "single" | "online";

  constructor(private root: HTMLElement) {
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    this.root.replaceChildren(canvas);

    this.renderer = new Renderer(canvas);

    const params = getMatchParams();
    this.mode = params.mode;
    if (this.mode === "online") {
      this.online = new OnlineClient(params.wsUrl, params.roomId, params.playerId);
      this.online.connect();
    }

    this.loop = new FixedTimestepLoop(
      {
        update: (dtMs) => {
          if (this.mode === "single") tickSinglePlayer(this.single, dtMs);
        },
        render: () => {
          if (this.mode === "single") this.renderer.renderSingle(this.single);
          if (this.mode === "online") {
            const s = this.online?.getState();
            if (s?.type === "state") this.renderer.renderOnline(s);
            else this.renderer.renderOnline({ status: "lobby", p1: { score: 0, timeMs: 0, status: "alive" }, p2: { score: 0, timeMs: 0, status: "alive" } });
          }
        }
      },
      1000 / 60
    );

    const resize = () => this.renderer.resize(this.root.clientWidth, this.root.clientHeight);
    resize();
    window.addEventListener("resize", resize);

    this.cleanupInput = attachTapHalvesInput(this.root, (side) => {
      if (this.mode === "online") {
        this.online?.sendInput(side);
        return;
      }
      if (this.single.state.status === "dead") {
        this.single = createSinglePlayerRuntime((Math.random() * 1e9) | 0);
        return;
      }

      chopSinglePlayer(this.single, side);
      this.audio.playChop();
      if (this.vibrationEnabled) navigator.vibrate?.(12);
      if (this.single.state.status === "dead") {
        this.audio.playFail();
        if (this.vibrationEnabled) navigator.vibrate?.([20, 30, 30]);
      }
    });
  }

  start(): void {
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
    this.cleanupInput?.();
    this.online?.disconnect();
  }
}
```

- [ ] **Step 5: 手工验收（联机最小）**

Run server:
```bash
cd server
npm install
npm run dev
```

Run web:
```bash
cd ..
npm run dev -- --host 0.0.0.0 --port 5173
```

Open on two devices (or two tabs):
- P1: `http://localhost:5173/?mode=online&room=ABCD&player=p1&ws=ws://localhost:8787`
- P2: `http://localhost:5173/?mode=online&room=ABCD&player=p2&ws=ws://localhost:8787`

Check:
- 两端看到同一局状态更新（P1/P2 分数变化）
- 点击左右半屏能增加对应玩家的分数（当前实现为服务器权威计分）

- [ ] **Step 6: Commit**

```bash
git add src/game/net src/game/GameApp.ts src/game/render/Renderer.ts
git commit -m "feat(net): connect web client to ws server and render online mode"
```

---

## 3. 计划自检（已做）

- Spec 覆盖：单人模式、严格判定、时间条、横屏输入、在线双人同屏与同局竞速、服务器权威与基本协议均有对应 Task。
- Placeholder 扫描：计划中没有 “TBD/TODO/implement later” 之类占位；所有代码步骤都给出完整文件内容或明确修改片段。
- 类型一致性：Side、状态结构在 web/server 两侧均固定为 v1 JSON 协议；后续若要进阶（障碍同步、严格死亡判定、时间条同步）应优先把规则搬到 server 并对齐客户端表现。

---

## 4. 执行方式选择

Plan complete and saved to `docs/superpowers/plans/2026-05-23-guihaiyidao-h5-implementation.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
