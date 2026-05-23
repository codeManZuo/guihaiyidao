import type { SinglePlayerRuntime } from "../state/singlePlayer";

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

  renderOnline(state: {
    status: "lobby" | "playing" | "finished";
    p1: {
      score: number;
      timeMs: number;
      status: "alive" | "dead";
      side: "left" | "right";
      obstacleSide: "left" | "right" | null;
    };
    p2: {
      score: number;
      timeMs: number;
      status: "alive" | "dead";
      side: "left" | "right";
      obstacleSide: "left" | "right" | null;
    };
  }): void {
    const ctx = this.ctx();
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#2b5a4b";
    ctx.fillRect(0, 0, w, h);

    const m = this.treeMetrics(h);
    const leftX = w * 0.25;
    const rightX = w * 0.75;
    this.drawOnlinePlayer(ctx, leftX, m, state.p1);
    this.drawOnlinePlayer(ctx, rightX, m, state.p2);

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

  private drawTreeAndPlayer(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    rt: SinglePlayerRuntime
  ): void {
    const centerX = w / 2;
    const m = this.treeMetrics(h);

    ctx.save();
    ctx.fillStyle = "#8a5a34";
    ctx.fillRect(centerX - 26, m.trunkTop, 52, m.trunkHeight);

    ctx.fillStyle = "#7a4a2b";
    for (let i = 0; i < rt.upcomingObstacles.length; i += 1) {
      const y = m.groundY - (i + 1) * m.segmentHeight;
      if (y < m.trunkTop + 20) break;
      const side = rt.upcomingObstacles[i];
      if (!side) continue;
      if (side === "left") ctx.fillRect(centerX - 150, y, 124, 20);
      if (side === "right") ctx.fillRect(centerX + 26, y, 124, 20);
    }

    const px = rt.state.side === "left" ? centerX - 90 : centerX + 90;
    ctx.fillStyle = "#c9b07f";
    ctx.fillRect(px - 18, m.groundY - 46, 36, 46);
    ctx.fillStyle = "#d7d2c3";
    ctx.fillRect(px + (rt.state.side === "left" ? 18 : -26), m.groundY - 26, 24, 10);
    ctx.restore();
  }

  private drawSimpleTree(ctx: CanvasRenderingContext2D, centerX: number, m: TreeMetrics): void {
    ctx.save();
    ctx.fillStyle = "#8a5a34";
    ctx.fillRect(centerX - 26, m.trunkTop, 52, m.trunkHeight);
    ctx.restore();
  }

  private drawOnlinePlayer(
    ctx: CanvasRenderingContext2D,
    treeX: number,
    m: TreeMetrics,
    p: {
      status: "alive" | "dead";
      side: "left" | "right";
      obstacleSide: "left" | "right" | null;
    }
  ): void {
    this.drawSimpleTree(ctx, treeX, m);

    if (p.obstacleSide) {
      ctx.save();
      ctx.fillStyle = "#7a4a2b";
      const y = m.groundY - m.segmentHeight;
      if (p.obstacleSide === "left") ctx.fillRect(treeX - 150, y, 124, 20);
      if (p.obstacleSide === "right") ctx.fillRect(treeX + 26, y, 124, 20);
      ctx.restore();
    }

    ctx.save();
    const px = p.side === "left" ? treeX - 90 : treeX + 90;
    ctx.globalAlpha = p.status === "dead" ? 0.4 : 1;
    ctx.fillStyle = "#c9b07f";
    ctx.fillRect(px - 18, m.groundY - 46, 36, 46);
    ctx.fillStyle = "#d7d2c3";
    ctx.fillRect(px + (p.side === "left" ? 18 : -26), m.groundY - 26, 24, 10);
    ctx.restore();
  }

  private treeMetrics(h: number): TreeMetrics {
    const groundY = h - 24;
    const trunkTop = 56;
    const trunkHeight = Math.max(160, groundY - trunkTop);
    const segmentHeight = 64;
    return { groundY, trunkTop, trunkHeight, segmentHeight };
  }

  private ctx(): CanvasRenderingContext2D {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Missing 2d context");
    return ctx;
  }
}

type TreeMetrics = {
  groundY: number;
  trunkTop: number;
  trunkHeight: number;
  segmentHeight: number;
};
