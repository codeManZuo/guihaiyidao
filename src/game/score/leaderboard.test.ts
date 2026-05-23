import { describe, expect, it } from "vitest";
import { readLeaderboard, submitScore } from "./leaderboard";

describe("leaderboard", () => {
  it("submits score, tracks best score per difficulty, and keeps top 5 sorted desc", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v)
    };

    const r1 = submitScore({ difficulty: "normal", score: 5, nowMs: 1000, storage });
    expect(r1.bestScore).toBe(5);
    expect(r1.isNewRecord).toBe(true);
    expect(readLeaderboard("normal", storage)[0].score).toBe(5);

    const r2 = submitScore({ difficulty: "normal", score: 3, nowMs: 2000, storage });
    expect(r2.bestScore).toBe(5);
    expect(r2.isNewRecord).toBe(false);

    const r3 = submitScore({ difficulty: "normal", score: 7, nowMs: 3000, storage });
    expect(r3.previousBestScore).toBe(5);
    expect(r3.bestScore).toBe(7);
    expect(r3.isNewRecord).toBe(true);

    for (let i = 0; i < 20; i += 1) submitScore({ difficulty: "normal", score: i, nowMs: 4000 + i, storage });
    const list = readLeaderboard("normal", storage);
    expect(list.length).toBe(5);
    for (let i = 1; i < list.length; i += 1) expect(list[i - 1].score).toBeGreaterThanOrEqual(list[i].score);

    submitScore({ difficulty: "easy", score: 99, nowMs: 9000, storage });
    expect(readLeaderboard("normal", storage)[0].score).not.toBe(99);
    expect(readLeaderboard("easy", storage)[0].score).toBe(99);
  });
});
