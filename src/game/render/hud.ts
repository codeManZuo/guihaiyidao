export function drawTimeBar(
  ctx: CanvasRenderingContext2D,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    ratio01: number;
  }
): void {
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

export function drawScore(
  ctx: CanvasRenderingContext2D,
  score: number,
  x: number,
  y: number
): void {
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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
