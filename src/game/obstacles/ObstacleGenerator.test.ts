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
