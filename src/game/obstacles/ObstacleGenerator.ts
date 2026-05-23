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
    const value: Side | null = r < 0.1 ? null : r < 0.55 ? "left" : "right";

    if (value !== null && value === this.last) {
      const flip = this.rng.nextFloat01() < 0.5;
      this.last = flip ? value : value === "left" ? "right" : "left";
      return this.last;
    }

    this.last = value;
    return value;
  }
}
