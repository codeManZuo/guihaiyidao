import { describe, expect, it } from "vitest";
import { createInitialFlow, reduceFlow } from "./flow";

describe("ui flow", () => {
  it("starts in menu", () => {
    const s = createInitialFlow({ url: "http://localhost:5173/" });
    expect(s.screen).toBe("menu");
    if (s.screen === "menu") expect(s.page).toBe("main");
  });

  it("can enter single player from menu", () => {
    const s0 = createInitialFlow({ url: "http://localhost:5173/" });
    const s1 = reduceFlow(s0, { type: "menu.single" });
    expect(s1.screen).toBe("single");
  });

  it("can enter online lobby from menu", () => {
    const s0 = createInitialFlow({ url: "http://localhost:5173/" });
    const s1 = reduceFlow(s0, {
      type: "menu.online"
    });
    expect(s1.screen).toBe("online");
    if (s1.screen === "online") expect(s1.mode).toBe("lobby");
  });

  it("can open create/join pages from menu and go back", () => {
    const s0 = createInitialFlow({ url: "http://localhost:5173/" });
    const s1 = reduceFlow(s0, { type: "menu.create" } as any);
    expect(s1.screen).toBe("menu");
    if (s1.screen === "menu") expect(s1.page).toBe("create");

    const s2 = reduceFlow(s1 as any, { type: "menu.join" } as any);
    expect(s2.screen).toBe("menu");
    if (s2.screen === "menu") expect(s2.page).toBe("join");

    const s3 = reduceFlow(s2 as any, { type: "nav.menu" } as any);
    expect(s3.screen).toBe("menu");
    if (s3.screen === "menu") expect(s3.page).toBe("main");
  });

  it("can open leaderboard from menu and return", () => {
    const s0 = createInitialFlow({ url: "http://localhost:5173/" });
    const s1 = reduceFlow(s0, { type: "nav.leaderboard" } as any);
    expect(s1.screen).toBe("leaderboard");
    const s2 = reduceFlow(s1 as any, { type: "nav.menu" });
    expect(s2.screen).toBe("menu");
    if (s2.screen === "menu") expect(s2.page).toBe("main");
  });
});
