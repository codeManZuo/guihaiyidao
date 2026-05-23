import { describe, expect, it } from "vitest";
import { createOverlays, showHudOnline, showHudSingle, showLeaderboard, showMenu, showResult } from "./overlays";

describe("ui overlays", () => {
  it("shows menu by default", () => {
    const overlays = createOverlays(document);
    expect(overlays.menu.style.display).not.toBe("none");
    expect(overlays.hud.style.display).toBe("none");
    expect(overlays.menu.textContent).toContain("单人");
    expect(overlays.menu.textContent).toContain("创建房间");
    expect(overlays.menu.textContent).toContain("加入房间");
    expect(overlays.menu.textContent).toContain("排行榜");
  });

  it("can show single HUD with score and time bar ratio", () => {
    const overlays = createOverlays(document);
    showHudSingle(overlays, { score: 12, timeRatio01: 0.5 });
    expect(overlays.hud.style.display).not.toBe("none");
    expect(overlays.hud.textContent).toContain("分数");
    expect(overlays.hud.textContent).toContain("12");
    expect(overlays.hud.querySelector("[data-testid=time-fill]")?.getAttribute("style")).toContain(
      "width: 50%"
    );
  });

  it("can return to menu", () => {
    const overlays = createOverlays(document);
    showHudSingle(overlays, { score: 1, timeRatio01: 1 });
    showMenu(overlays);
    expect(overlays.menu.style.display).not.toBe("none");
    expect(overlays.hud.style.display).toBe("none");
  });

  it("can show online HUD with P1/P2", () => {
    const overlays = createOverlays(document);
    showHudOnline(overlays, {
      roomId: "ABCD",
      p1: { score: 3, timeRatio01: 0.8, status: "alive" },
      p2: { score: 7, timeRatio01: 0.4, status: "dead" }
    });
    expect(overlays.hud.textContent).toContain("P1");
    expect(overlays.hud.textContent).toContain("P2");
    expect(overlays.hud.textContent).toContain("ABCD");
  });

  it("shows result overlay with actions", () => {
    const overlays = createOverlays(document);
    showResult(overlays, { score: 9, bestScore: 12, isNewRecord: false });
    expect(overlays.result.style.display).not.toBe("none");
    expect(overlays.result.textContent).toContain("9");
    expect(overlays.result.textContent).toContain("12");
    expect(overlays.result.textContent).toContain("返回菜单");
  });

  it("can show leaderboard overlay with top entries", () => {
    const overlays = createOverlays(document);
    showLeaderboard(overlays, {
      difficulty: "normal",
      entries: [
        { score: 10, atMs: 1 },
        { score: 7, atMs: 2 }
      ]
    });
    expect(overlays.leaderboard.style.display).not.toBe("none");
    expect(overlays.leaderboard.textContent).toContain("10");
    expect(overlays.leaderboard.textContent).toContain("7");
    expect(overlays.leaderboard.textContent).toContain("返回");
  });
});
