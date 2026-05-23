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

  private drawTreeAndPlayer(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    rt: SinglePlayerRuntime
  ): void {
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

  private drawSimpleTree(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    groundY: number
  ): void {
    ctx.save();
    ctx.fillStyle = "#8a5a34";
    ctx.fillRect(centerX - 26, groundY - 180, 52, 180);
    ctx.restore();
  }

  private ctx(): CanvasRenderingContext2D {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Missing 2d context");
    return ctx;
  }
}
