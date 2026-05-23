import { XorShift32 } from "../rng/XorShift32";
import type { Side } from "../state/types";

export class ObstacleGenerator {
  private rng: XorShift32;
  private last: Side | null = null;
  private noneChance: number;
  private avoidSameSide: boolean;

  constructor(seed: number, params?: { noneChance: number; avoidSameSide: boolean }) {
    this.rng = new XorShift32(seed);
    this.noneChance = params?.noneChance ?? 0.1;
    this.avoidSameSide = params?.avoidSameSide ?? true;
  }

  next(): Side | null {
    const r = this.rng.nextFloat01();
    const none = Math.max(0, Math.min(1, this.noneChance));
    const value: Side | null = r < none ? null : r < none + (1 - none) * 0.5 ? "left" : "right";

    if (this.avoidSameSide && value !== null && value === this.last) {
      const flip = this.rng.nextFloat01() < 0.5;
      this.last = flip ? value : value === "left" ? "right" : "left";
      return this.last;
    }

    this.last = value;
    return value;
  }
}
