import { nowMs } from "./Clock";

export type LoopCallbacks = {
  update: (dtMs: number) => void;
  render: () => void;
};

export class FixedTimestepLoop {
  private rafId: number | null = null;
  private lastMs = 0;
  private accumulatorMs = 0;
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
