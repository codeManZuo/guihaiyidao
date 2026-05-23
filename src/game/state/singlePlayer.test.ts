import { describe, expect, it } from "vitest";
import { createSinglePlayerRuntime, chopSinglePlayer } from "./singlePlayer";
import { defaultGameConfig } from "../config/gameConfig";

describe("singlePlayer runtime", () => {
  it("keeps a fixed-length upcoming obstacle queue and advances it on chop", () => {
    const rt = createSinglePlayerRuntime(123, defaultGameConfig());
    const first = rt.upcomingObstacles[0];
    const len = rt.upcomingObstacles.length;

    chopSinglePlayer(rt, "left");
    expect(rt.upcomingObstacles.length).toBe(len);
    expect(rt.upcomingObstacles[0]).not.toBe(first);
  });
});
