import type { SinglePlayerRuntime } from "../state/singlePlayer";

export class Renderer {
  private pixelCanvas: HTMLCanvasElement | null = null;
  private lastRenderAtMs = 0;

  private lastSingleScore = 0;
  private singleSwingMs = 0;
  private singleCutFlashMs = 0;
  private singleChopSide: "left" | "right" = "left";
  private singlePendingChopFx = false;

  private lastP1Score = 0;
  private lastP2Score = 0;
  private p1SwingMs = 0;
  private p2SwingMs = 0;
  private p1CutFlashMs = 0;
  private p2CutFlashMs = 0;
  private p1ChopSide: "left" | "right" = "left";
  private p2ChopSide: "left" | "right" = "left";
  private p1PendingChopFx = false;
  private p2PendingChopFx = false;

  private particles: Particle[] = [];
  private bgTimeMs = 0;
  private clouds: Cloud[] = [];
  private birds: Bird[] = [];
  private nextBirdInMs = 2500;
  private birdSeq = 1;

  constructor(private canvas: HTMLCanvasElement) {}

  triggerSingleChop(side: "left" | "right"): void {
    this.singleChopSide = side;
    this.singleSwingMs = 220;
    this.singleCutFlashMs = 140;
    this.singlePendingChopFx = true;
  }

  triggerOnlineChop(playerId: "p1" | "p2", side: "left" | "right"): void {
    if (playerId === "p2") {
      this.p2ChopSide = side;
      this.p2SwingMs = 220;
      this.p2CutFlashMs = 140;
      this.p2PendingChopFx = true;
      return;
    }
    this.p1ChopSide = side;
    this.p1SwingMs = 220;
    this.p1CutFlashMs = 140;
    this.p1PendingChopFx = true;
  }

  resize(w: number, h: number): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    const ctx = this.screenCtx();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!this.pixelCanvas) this.pixelCanvas = document.createElement("canvas");
    const { pw, ph } = pixelBufferSize(w, h);
    this.pixelCanvas.width = pw;
    this.pixelCanvas.height = ph;
    const pctx = this.pixelCtx();
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.imageSmoothingEnabled = false;
  }

  renderSingle(rt: SinglePlayerRuntime): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const dtMs = this.advanceTime();
    const { pw, ph } = pixelBufferSize(w, h);
    const m = this.treeMetrics(ph);

    if (rt.state.score > this.lastSingleScore) {
      if (this.singleSwingMs <= 0) this.triggerSingleChop(rt.state.side);
      this.lastSingleScore = rt.state.score;
    }

    if (this.singlePendingChopFx) {
      this.spawnChopFx(pw / 2, m.groundY - 22, this.singleChopSide);
      this.singlePendingChopFx = false;
    }

    this.tickAmbient(dtMs, pw, ph);
    this.stepFx(dtMs);

    const frame = this.beginPixelFrame(w, h);
    const ctx = frame.ctx;

    ctx.clearRect(0, 0, frame.pw, frame.ph);
    this.drawBackground(ctx, frame.pw, frame.ph);
    this.drawTreeAndPlayer(ctx, frame.pw, frame.ph, rt);
    this.drawParticles(ctx);
    this.blitToScreen(frame, w, h);

    if (rt.state.status === "dead") {
      const sctx = this.screenCtx();
      sctx.save();
      sctx.fillStyle = "rgba(0,0,0,0.55)";
      sctx.fillRect(0, 0, w, h);
      sctx.fillStyle = "#d7d2c3";
      sctx.font = "28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      sctx.textAlign = "center";
      sctx.textBaseline = "middle";
      sctx.fillText("失败", w / 2, h / 2 - 10);
      sctx.font = "16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      sctx.fillText("点任意处重开", w / 2, h / 2 + 22);
      sctx.restore();
    }
  }

  renderOnline(state: {
    status: "lobby" | "playing" | "finished";
    p1: {
      score: number;
      timeMs: number;
      status: "alive" | "dead";
      side: "left" | "right";
      obstacleSide: "left" | "right" | null;
      upcomingObstacles?: Array<"left" | "right" | null>;
      upcomingObstacleStyles?: number[];
    };
    p2: {
      score: number;
      timeMs: number;
      status: "alive" | "dead";
      side: "left" | "right";
      obstacleSide: "left" | "right" | null;
      upcomingObstacles?: Array<"left" | "right" | null>;
      upcomingObstacleStyles?: number[];
    };
  }): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const dtMs = this.advanceTime();
    const { pw, ph } = pixelBufferSize(w, h);
    const m = this.treeMetrics(ph);

    if (state.p1.score > this.lastP1Score) {
      if (this.p1SwingMs <= 0) this.triggerOnlineChop("p1", state.p1.side);
      this.lastP1Score = state.p1.score;
    }
    if (state.p2.score > this.lastP2Score) {
      if (this.p2SwingMs <= 0) this.triggerOnlineChop("p2", state.p2.side);
      this.lastP2Score = state.p2.score;
    }

    if (this.p1PendingChopFx) {
      this.spawnChopFx(pw * 0.25, m.groundY - 22, this.p1ChopSide);
      this.p1PendingChopFx = false;
    }
    if (this.p2PendingChopFx) {
      this.spawnChopFx(pw * 0.75, m.groundY - 22, this.p2ChopSide);
      this.p2PendingChopFx = false;
    }

    this.tickAmbient(dtMs, pw, ph);
    this.stepFx(dtMs);

    const frame = this.beginPixelFrame(w, h);
    const ctx = frame.ctx;
    ctx.clearRect(0, 0, frame.pw, frame.ph);
    this.drawBackground(ctx, frame.pw, frame.ph);

    const leftX = frame.pw * 0.25;
    const rightX = frame.pw * 0.75;
    this.drawOnlinePlayer(ctx, leftX, m, state.p1);
    this.drawOnlinePlayer(ctx, rightX, m, state.p2);

    if (state.status === "lobby") {
      const sctx = this.screenCtx();
      sctx.save();
      sctx.fillStyle = "rgba(0,0,0,0.45)";
      sctx.fillRect(0, 0, w, h);
      sctx.fillStyle = "#d7d2c3";
      sctx.font = "20px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      sctx.textAlign = "center";
      sctx.textBaseline = "middle";
      sctx.fillText("等待另一位玩家加入...", w / 2, h / 2);
      sctx.restore();
    }

    this.drawParticles(ctx);
    this.blitToScreen(frame, w, h);
  }

  private drawTreeAndPlayer(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    rt: SinglePlayerRuntime
  ): void {
    const centerX = w / 2;
    const m = this.treeMetrics(h);

    ctx.save();
    this.drawTrunk(ctx, centerX, m, 1337);

    for (let i = 0; i < rt.upcomingObstacles.length; i += 1) {
      const y = m.groundY - (i + 1) * m.segmentHeight;
      if (y < m.trunkTop + 20) break;
      const side = rt.upcomingObstacles[i];
      if (!side) continue;
      const styleId = rt.upcomingObstacleStyles[i] ?? 0;
      this.drawBranch(ctx, centerX, y, side, styleId);
    }

    const px = rt.state.side === "left" ? centerX - 36 : centerX + 36;
    const swing01 = this.singleSwingMs <= 0 ? 0 : 1 - this.singleSwingMs / 220;
    const deadAlpha = rt.state.status === "dead" ? 0.5 : 1;
    this.drawLumberjack(ctx, px, m.groundY, rt.state.side, swing01, deadAlpha);

    if (this.singleCutFlashMs > 0) {
      const t = this.singleCutFlashMs / 140;
      this.drawCutFlash(ctx, centerX, m.groundY - m.segmentHeight, t);
    }
    ctx.restore();
  }

  private drawSimpleTree(ctx: CanvasRenderingContext2D, centerX: number, m: TreeMetrics): void {
    this.drawTrunk(ctx, centerX, m, Math.floor(centerX * 1000));
  }

  private drawOnlinePlayer(
    ctx: CanvasRenderingContext2D,
    treeX: number,
    m: TreeMetrics,
    p: {
      status: "alive" | "dead";
      side: "left" | "right";
      obstacleSide: "left" | "right" | null;
      upcomingObstacles?: Array<"left" | "right" | null>;
      upcomingObstacleStyles?: number[];
    }
  ): void {
    this.drawSimpleTree(ctx, treeX, m);

    const upcoming = p.upcomingObstacles;
    const styles = p.upcomingObstacleStyles;
    if (Array.isArray(upcoming) && upcoming.length > 0 && Array.isArray(styles) && styles.length > 0) {
      for (let i = 0; i < upcoming.length; i += 1) {
        const y = m.groundY - (i + 1) * m.segmentHeight;
        if (y < m.trunkTop + 20) break;
        const side = upcoming[i];
        if (!side) continue;
        const styleId = styles[i] ?? 0;
        this.drawBranch(ctx, treeX, y, side, styleId);
      }
    } else if (p.obstacleSide) {
      const y = m.groundY - m.segmentHeight;
      const styleId = (hash32(Math.floor(treeX) * 7 + 11) >>> 0) % 4;
      this.drawBranch(ctx, treeX, y, p.obstacleSide, styleId);
    }

    ctx.save();
    const px = p.side === "left" ? treeX - 36 : treeX + 36;
    ctx.globalAlpha = p.status === "dead" ? 0.4 : 1;
    const swing01 =
      treeX < (this.pixelCanvas?.width || 1) / 2
        ? this.p1SwingMs <= 0
          ? 0
          : 1 - this.p1SwingMs / 220
        : this.p2SwingMs <= 0
          ? 0
          : 1 - this.p2SwingMs / 220;
    this.drawLumberjack(ctx, px, m.groundY, p.side, swing01, p.status === "dead" ? 0.5 : 1);

    if (treeX < (this.pixelCanvas?.width || 1) / 2) {
      if (this.p1CutFlashMs > 0) {
        const t = this.p1CutFlashMs / 140;
        this.drawCutFlash(ctx, treeX, m.groundY - m.segmentHeight, t);
      }
    } else {
      if (this.p2CutFlashMs > 0) {
        const t = this.p2CutFlashMs / 140;
        this.drawCutFlash(ctx, treeX, m.groundY - m.segmentHeight, t);
      }
    }
    ctx.restore();
  }

  private treeMetrics(h: number): TreeMetrics {
    const groundY = h - 18;
    const trunkTop = 26;
    const trunkHeight = Math.max(160, groundY - trunkTop);
    const segmentHeight = 32;
    return { groundY, trunkTop, trunkHeight, segmentHeight };
  }

  private screenCtx(): CanvasRenderingContext2D {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Missing 2d context");
    return ctx;
  }

  private pixelCtx(): CanvasRenderingContext2D {
    if (!this.pixelCanvas) this.pixelCanvas = document.createElement("canvas");
    const ctx = this.pixelCanvas.getContext("2d");
    if (!ctx) throw new Error("Missing 2d context");
    return ctx;
  }

  private beginPixelFrame(w: number, h: number): PixelFrame {
    if (!this.pixelCanvas) this.pixelCanvas = document.createElement("canvas");
    const { pw, ph, scale, ox, oy } = pixelLayout(w, h, this.pixelCanvas);
    const ctx = this.pixelCtx();
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return { ctx, pw, ph, scale, ox, oy };
  }

  private blitToScreen(frame: PixelFrame, w: number, h: number): void {
    const sctx = this.screenCtx();
    sctx.save();
    sctx.imageSmoothingEnabled = false;
    sctx.clearRect(0, 0, w, h);
    sctx.fillStyle = "#000";
    sctx.fillRect(0, 0, w, h);
    if (this.pixelCanvas) {
      sctx.drawImage(this.pixelCanvas, frame.ox, frame.oy, frame.pw * frame.scale, frame.ph * frame.scale);
    }
    sctx.restore();
  }

  private advanceTime(): number {
    const now = performance.now();
    if (this.lastRenderAtMs <= 0) {
      this.lastRenderAtMs = now;
      return 16;
    }
    const dt = now - this.lastRenderAtMs;
    this.lastRenderAtMs = now;
    return Math.max(0, Math.min(50, dt));
  }

  private stepFx(dtMs: number): void {
    const dec = (x: number) => Math.max(0, x - dtMs);
    this.singleSwingMs = dec(this.singleSwingMs);
    this.singleCutFlashMs = dec(this.singleCutFlashMs);
    this.p1SwingMs = dec(this.p1SwingMs);
    this.p2SwingMs = dec(this.p2SwingMs);
    this.p1CutFlashMs = dec(this.p1CutFlashMs);
    this.p2CutFlashMs = dec(this.p2CutFlashMs);

    for (const p of this.particles) {
      p.lifeMs -= dtMs;
      p.vy += 0.0018 * dtMs;
      p.x += p.vx * dtMs;
      p.y += p.vy * dtMs;
      p.rot += p.vr * dtMs;
    }
    this.particles = this.particles.filter((p) => p.lifeMs > 0 && p.y < 2000);
    if (this.particles.length > 120) this.particles.splice(0, this.particles.length - 120);
  }

  private spawnChopFx(x: number, y: number, side: "left" | "right"): void {
    const dir = side === "left" ? -1 : 1;
    for (let i = 0; i < 10; i += 1) {
      const s = rand01(hash32((i + 1) * 991 + Math.floor(x * 3)));
      const a = (-0.6 + s * 1.2) * (side === "left" ? 1 : -1);
      const speed = 0.08 + rand01(hash32(i * 31 + 17)) * 0.08;
      this.particles.push({
        kind: "chip",
        x,
        y,
        vx: Math.cos(a) * speed * dir,
        vy: -0.12 - rand01(hash32(i * 73 + 19)) * 0.1,
        rot: 0,
        vr: (-0.01 + rand01(hash32(i * 61 + 23)) * 0.02) * dir,
        lifeMs: 260 + rand01(hash32(i * 29 + 13)) * 260
      });
    }
    this.particles.push({
      kind: "log",
      x,
      y,
      vx: 0.12 * dir,
      vy: -0.18,
      rot: 0,
      vr: 0.012 * dir,
      lifeMs: 900
    });
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const t = Math.max(0, Math.min(1, p.lifeMs / 900));
      ctx.save();
      ctx.globalAlpha = p.kind === "log" ? 1 : 0.9 * t;
      if (p.kind === "chip") {
        ctx.fillStyle = "#caa26a";
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      } else {
        ctx.translate(Math.round(p.x), Math.round(p.y));
        ctx.rotate(p.rot);
        ctx.fillStyle = "#9a6a3f";
        ctx.fillRect(-3, -2, 6, 4);
        ctx.fillStyle = "#d9c09a";
        ctx.fillRect(2, -1, 1, 2);
      }
      ctx.restore();
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#7bb6d6");
    sky.addColorStop(0.6, "#9dd3e6");
    sky.addColorStop(1, "#cdecc2");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    this.drawCloudLayer(ctx, w, h);

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#6aa08f";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.62);
    ctx.quadraticCurveTo(w * 0.25, h * 0.55, w * 0.5, h * 0.6);
    ctx.quadraticCurveTo(w * 0.75, h * 0.65, w, h * 0.58);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    this.drawBirdLayer(ctx, w, h);

    ctx.fillStyle = "#4a8a4d";
    ctx.fillRect(0, h - 18, w, 18);
    ctx.fillStyle = "#3f7a43";
    for (let x = 0; x < w; x += 2) {
      if ((hash32(x * 97 + 3) & 1) === 0) ctx.fillRect(x, h - 18, 1, 2);
    }
  }

  tickAmbient(dtMs: number, w: number, h: number): void {
    if (this.clouds.length === 0) {
      this.clouds = [
        { x: w * 0.12, y: h * 0.16, speed: 0.006, scale: 1, width: 30 },
        { x: w * 0.62, y: h * 0.22, speed: 0.004, scale: 1.2, width: 36 },
        { x: w * 0.34, y: h * 0.12, speed: 0.008, scale: 0.9, width: 26 }
      ];
    }

    this.bgTimeMs += dtMs;

    for (const c of this.clouds) {
      c.x += c.speed * dtMs;
      if (c.x > w + c.width) c.x = -c.width;
    }

    for (const b of this.birds) {
      b.x += b.vx * dtMs;
    }
    this.birds = this.birds.filter((b) => b.x > -24 && b.x < w + 24);

    this.nextBirdInMs -= dtMs;
    if (this.nextBirdInMs <= 0 && this.birds.length < 3) {
      const r = hash32(this.birdSeq * 1337 + 9);
      const dir = (r & 1) === 0 ? 1 : -1;
      const styleId = ((r >>> 1) % 3) | 0;
      const y = h * 0.1 + rand01(hash32(r + 17)) * (h * 0.38);
      const speed = 0.06 + rand01(hash32(r + 31)) * 0.04;
      const color = birdColor(hash32(r + 41));
      const x = dir === 1 ? -18 : w + 18;
      this.birds.push({ x, y, vx: dir * speed, dir, styleId, color });

      this.birdSeq += 1;
      const gap = 2500 + rand01(hash32(this.birdSeq * 991 + 3)) * 3500;
      this.nextBirdInMs = gap;
    }
  }

  private drawCloudLayer(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    for (const c of this.clouds) {
      this.drawCloud(ctx, Math.round(c.x), Math.round(c.y), c.scale);
    }
    if ((Math.floor(this.bgTimeMs / 500) & 1) === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      for (let i = 0; i < 12; i += 1) {
        const x = (i * 27 + Math.floor(this.bgTimeMs / 120)) % Math.max(1, w);
        const y = 6 + ((i * 11) % 18);
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  private drawBirdLayer(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const wingUp = (Math.floor(this.bgTimeMs / 120) & 1) === 0;
    for (const b of this.birds) {
      this.drawBird(ctx, Math.round(b.x), Math.round(b.y), b.dir, b.styleId, b.color, wingUp);
    }
  }

  private drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    const s = Math.max(1, Math.round(scale));
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(2, 3, 10, 4);
    ctx.fillRect(0, 5, 14, 4);
    ctx.fillRect(3, 1, 6, 3);
    ctx.fillRect(10, 4, 6, 4);
    ctx.fillStyle = "#dfeaf0";
    ctx.fillRect(1, 8, 12, 2);
    ctx.restore();
  }

  private drawBird(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    dir: 1 | -1,
    styleId: number,
    color: string,
    wingUp: boolean
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.fillStyle = color;

    if (styleId === 0) {
      ctx.fillRect(0, 1, 5, 2);
      ctx.fillRect(4, 0, 2, 1);
      if (wingUp) {
        ctx.fillRect(1, 0, 2, 1);
        ctx.fillRect(2, -1, 2, 1);
      } else {
        ctx.fillRect(1, 3, 2, 1);
        ctx.fillRect(2, 4, 2, 1);
      }
      ctx.fillRect(-2, 2, 2, 1);
    } else if (styleId === 1) {
      ctx.fillRect(0, 1, 6, 2);
      ctx.fillRect(5, 0, 2, 1);
      if (wingUp) {
        ctx.fillRect(2, 0, 2, 1);
        ctx.fillRect(3, -1, 2, 1);
      } else {
        ctx.fillRect(2, 3, 2, 1);
        ctx.fillRect(3, 4, 2, 1);
      }
      ctx.fillRect(-2, 2, 2, 2);
    } else {
      ctx.fillRect(0, 1, 5, 2);
      ctx.fillRect(4, 0, 2, 1);
      if (wingUp) {
        ctx.fillRect(0, 0, 2, 1);
        ctx.fillRect(1, -1, 2, 1);
      } else {
        ctx.fillRect(0, 3, 2, 1);
        ctx.fillRect(1, 4, 2, 1);
      }
      ctx.fillRect(-2, 1, 2, 1);
      ctx.fillRect(-3, 2, 1, 1);
    }

    ctx.restore();
  }

  private drawTrunk(ctx: CanvasRenderingContext2D, centerX: number, m: TreeMetrics, seed: number): void {
    const trunkW = 22;
    const x0 = Math.round(centerX - trunkW / 2);
    const x1 = x0 + trunkW;

    ctx.fillStyle = "#9a6a3f";
    ctx.fillRect(x0, m.trunkTop, trunkW, m.trunkHeight);

    ctx.fillStyle = "#7e4f2e";
    ctx.fillRect(x0, m.trunkTop, 3, m.trunkHeight);

    ctx.fillStyle = "#b9834b";
    ctx.fillRect(x1 - 2, m.trunkTop, 1, m.trunkHeight);

    ctx.fillStyle = "#875634";
    for (let y = m.trunkTop; y < m.trunkTop + m.trunkHeight; y += 3) {
      const r = hash32(seed + y * 131);
      const col = x0 + 4 + ((r >>> 0) % (trunkW - 8));
      ctx.fillRect(col, y, 1, 2);
      if ((r & 7) === 0) ctx.fillRect(col - 1, y + 1, 1, 1);
    }

    ctx.fillStyle = "#6b3f25";
    for (let i = 0; i < 3; i += 1) {
      const r = hash32(seed + i * 733);
      const ky = m.trunkTop + 24 + ((r >>> 0) % Math.max(1, m.trunkHeight - 60));
      const kx = x0 + 5 + ((hash32(r + 9) >>> 0) % (trunkW - 10));
      ctx.fillRect(kx, ky, 2, 2);
      ctx.fillRect(kx - 1, ky + 1, 4, 1);
    }

    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let i = 1; i < 10; i += 1) {
      const yy = m.groundY - i * m.segmentHeight;
      if (yy < m.trunkTop + 8) break;
      ctx.fillRect(x0 + 1, yy, trunkW - 2, 1);
    }
  }

  private drawBranch(
    ctx: CanvasRenderingContext2D,
    trunkX: number,
    y: number,
    side: "left" | "right",
    styleId: number
  ): void {
    const dir = side === "left" ? -1 : 1;
    const baseX = Math.round(trunkX + (side === "left" ? -11 : 11));
    const len = 46;
    const thickness = styleId === 1 ? 5 : styleId === 2 ? 4 : 6;

    ctx.save();
    ctx.fillStyle = "#7e4f2e";
    for (let i = 0; i < len; i += 1) {
      const wobble = styleId === 3 ? ((hash32(i * 13 + y) & 1) === 0 ? 0 : 1) : 0;
      const x = baseX + dir * i;
      const t = thickness - (i > 26 ? 2 : 0) - (i > 36 ? 1 : 0);
      ctx.fillRect(x, y + wobble, dir * 1, t);
      if (styleId === 2 && (i === 18 || i === 28)) {
        const sy = y + 1 + ((hash32(i * 3 + y * 17) >>> 0) % 3);
        ctx.fillRect(x, sy, dir * 6, 2);
      }
    }

    if (styleId === 0 || styleId === 3) {
      ctx.fillStyle = "#3d7c44";
      const lx = baseX + dir * 30;
      ctx.fillRect(lx, y - 2, dir * 6, 4);
      ctx.fillRect(lx + dir * 3, y - 4, dir * 5, 3);
    }
    ctx.restore();
  }

  private drawLumberjack(
    ctx: CanvasRenderingContext2D,
    x: number,
    groundY: number,
    side: "left" | "right",
    swing01: number,
    alpha: number
  ): void {
    const dir = side === "left" ? 1 : -1;
    const gx = Math.round(x);
    const gy = Math.round(groundY);
    const t = swing01 <= 0 ? 0 : swing01 >= 1 ? 1 : swing01;
    const raise = easeOut(clamp01(t / 0.34));
    const chop = easeIn(clamp01((t - 0.34) / 0.46));
    const follow = easeOut(clamp01((t - 0.8) / 0.2));
    const armT = clamp01(raise * 0.6 + chop * 1.2 - follow * 0.2);
    const lean = Math.round((2 + 4 * chop) * dir);
    const bounceY = Math.round(chop * 2);

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = "#3d5fa8";
    ctx.fillRect(gx - 4 + lean, gy - 18 + bounceY, 8, 10);

    ctx.fillStyle = "#2b3c6b";
    ctx.fillRect(gx - 4 + lean, gy - 8 + bounceY, 3, 8);
    ctx.fillRect(gx + 1 + lean, gy - 8 + bounceY, 3, 8);

    ctx.fillStyle = "#d8c59b";
    ctx.fillRect(gx - 3 + lean, gy - 26 + bounceY, 6, 6);

    ctx.fillStyle = "#7a4a2b";
    ctx.fillRect(gx - 4 + lean, gy - 27 + bounceY, 8, 2);
    ctx.fillStyle = "#5f3b22";
    ctx.fillRect(gx - 2 + lean, gy - 29 + bounceY, 4, 2);

    const shoulderX = gx + lean + dir * 2;
    const shoulderY = gy - 16 + bounceY;
    const ax = shoulderX + dir * Math.round(7 * armT);
    const ay = shoulderY - Math.round(6 * armT);
    ctx.fillStyle = "#caa26a";
    ctx.fillRect(shoulderX, shoulderY, dir * 2, 2);
    ctx.fillRect(ax, ay, dir * 2, 2);

    const axeX = ax + dir * 2;
    const axeY = ay;
    const angle = (-1.4 + 2.4 * chop + 0.9 * raise - 0.6 * follow) * dir;
    ctx.translate(axeX, axeY);
    ctx.rotate(angle);
    ctx.fillStyle = "#8c6a3f";
    ctx.fillRect(-1, -1, 7, 2);
    ctx.fillStyle = "#cfcfd2";
    ctx.fillRect(5, -2, 3, 4);

    ctx.restore();
  }

  private drawCutFlash(ctx: CanvasRenderingContext2D, trunkX: number, y: number, t01: number): void {
    const a = Math.max(0, Math.min(1, t01));
    ctx.save();
    ctx.globalAlpha = 0.6 * a;
    ctx.fillStyle = "#f4e6c8";
    ctx.fillRect(Math.round(trunkX - 12), Math.round(y + 10), 24, 2);
    ctx.globalAlpha = 0.35 * a;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.round(trunkX - 10), Math.round(y + 9), 20, 1);
    ctx.restore();
  }
}

type TreeMetrics = {
  groundY: number;
  trunkTop: number;
  trunkHeight: number;
  segmentHeight: number;
};

type PixelFrame = {
  ctx: CanvasRenderingContext2D;
  pw: number;
  ph: number;
  scale: number;
  ox: number;
  oy: number;
};

type Particle = {
  kind: "chip" | "log";
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  lifeMs: number;
};

type Cloud = {
  x: number;
  y: number;
  speed: number;
  scale: number;
  width: number;
};

type Bird = {
  x: number;
  y: number;
  vx: number;
  dir: 1 | -1;
  styleId: number;
  color: string;
};

function pixelBufferSize(w: number, h: number): { pw: number; ph: number } {
  const pw = Math.max(160, Math.min(320, Math.floor(w / 2)));
  const ph = Math.max(240, Math.min(640, Math.floor((pw * h) / Math.max(1, w))));
  return { pw, ph };
}

function pixelLayout(
  w: number,
  h: number,
  pixelCanvas: HTMLCanvasElement
): { pw: number; ph: number; scale: number; ox: number; oy: number } {
  const { pw, ph } = pixelBufferSize(w, h);
  if (pixelCanvas.width !== pw) pixelCanvas.width = pw;
  if (pixelCanvas.height !== ph) pixelCanvas.height = ph;
  const scale = Math.max(1, Math.floor(Math.min(w / pw, h / ph)));
  const ox = Math.floor((w - pw * scale) / 2);
  const oy = Math.floor((h - ph * scale) / 2);
  return { pw, ph, scale, ox, oy };
}

function hash32(x: number): number {
  let v = x | 0;
  v ^= v << 13;
  v ^= v >>> 17;
  v ^= v << 5;
  return v | 0;
}

function rand01(h: number): number {
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

function clamp01(x: number): number {
  return x <= 0 ? 0 : x >= 1 ? 1 : x;
}

function easeOut(x: number): number {
  const a = clamp01(x);
  return 1 - Math.pow(1 - a, 2);
}

function easeIn(x: number): number {
  const a = clamp01(x);
  return a * a;
}

function birdColor(seed: number): string {
  const palette = ["#2b2b2b", "#1f3f6d", "#5a3b23", "#55585f", "#7a3a2a", "#3a2f3f"];
  const lighter = ["#3d3d3d", "#2f548b", "#704a2b", "#6b6f77", "#8f4b35", "#513f5d"];
  const idx = (seed >>> 0) % palette.length;
  const useLight = rand01(hash32(seed + 77)) < 0.3;
  return useLight ? lighter[idx] : palette[idx];
}
