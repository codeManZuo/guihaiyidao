import { describe, expect, it } from "vitest";
import { applyChop, applyTick, createInitialSinglePlayerState } from "./TimberRules";

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

    const next = applyTick(state, 100);
    expect(next.timeMs).toBe(0);
    expect(next.status).toBe("dead");
  });
});
