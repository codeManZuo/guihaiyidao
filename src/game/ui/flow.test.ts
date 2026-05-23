import { describe, expect, it } from "vitest";
import { createInitialFlow, reduceFlow } from "./flow";

describe("ui flow", () => {
  it("starts in menu", () => {
    const s = createInitialFlow({ url: "http://localhost:5173/" });
    expect(s.screen).toBe("menu");
  });

  it("can enter single player from menu", () => {
    const s0 = createInitialFlow({ url: "http://localhost:5173/" });
    const s1 = reduceFlow(s0, { type: "menu.single" });
    expect(s1.screen).toBe("single");
  });

  it("can enter online lobby from menu", () => {
    const s0 = createInitialFlow({ url: "http://localhost:5173/" });
    const s1 = reduceFlow(s0, {
      type: "menu.online",
      roomId: "ABCD",
      playerId: "p1",
      wsUrl: "ws://localhost:8787"
    });
    expect(s1.screen).toBe("online");
    expect(s1.mode).toBe("lobby");
    if (s1.screen === "online") expect(s1.wsUrl).toBe("ws://localhost:8787");
  });

  it("can open leaderboard from menu and return", () => {
    const s0 = createInitialFlow({ url: "http://localhost:5173/" });
    const s1 = reduceFlow(s0, { type: "nav.leaderboard" } as any);
    expect(s1.screen).toBe("leaderboard");
    const s2 = reduceFlow(s1 as any, { type: "nav.menu" });
    expect(s2.screen).toBe("menu");
  });
});
