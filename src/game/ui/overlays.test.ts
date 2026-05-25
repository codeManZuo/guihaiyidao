import { describe, expect, it } from "vitest";
import { createOverlays, showHudOnline, showHudSingle, showLeaderboard, showMenu, showResult } from "./overlays";

describe("ui overlays", () => {
  it("shows menu by default", () => {
    const overlays = createOverlays(document);
    expect(overlays.menu.style.display).not.toBe("none");
    expect(overlays.hud.style.display).toBe("none");
    expect(overlays.menuMainPanel.style.display).not.toBe("none");
    expect(overlays.menuCreatePanel.style.display).toBe("none");
    expect(overlays.menuJoinPanel.style.display).toBe("none");
    expect(overlays.menuMainPanel.textContent).toContain("单人");
    expect(overlays.menuMainPanel.textContent).toContain("创建房间");
    expect(overlays.menuMainPanel.textContent).toContain("加入房间");
    expect(overlays.menuMainPanel.textContent).toContain("背景音乐音量");
    expect(overlays.menuMainPanel.textContent).toContain("排行榜");
  });

  it("can switch menu pages", () => {
    const overlays = createOverlays(document);
    showMenu(overlays, { page: "create", create: { error: "房间号已存在/正在使用" } });
    expect(overlays.menuMainPanel.style.display).toBe("none");
    expect(overlays.menuCreatePanel.style.display).not.toBe("none");
    expect(overlays.menuJoinPanel.style.display).toBe("none");
    expect(overlays.menuCreatePanel.textContent).toContain("创建房间");
    expect(overlays.menuCreatePanel.textContent).toContain("在线难度");
    expect(overlays.menuCreatePanel.textContent).toContain("确认创建");
    expect(overlays.menuCreateError.textContent).toContain("房间号已存在");

    showMenu(overlays, { page: "join", join: { suggestions: ["1234", "1299"], error: null } });
    expect(overlays.menuMainPanel.style.display).toBe("none");
    expect(overlays.menuCreatePanel.style.display).toBe("none");
    expect(overlays.menuJoinPanel.style.display).not.toBe("none");
    expect(overlays.menuJoinPanel.textContent).toContain("加入房间");
    expect(overlays.menuJoinPanel.textContent).toContain("进入房间");
    expect(overlays.menuJoinSuggestions.textContent).toContain("1234");
    expect(overlays.menuJoinSuggestions.textContent).toContain("1299");

    showMenu(overlays, { page: "main" });
    expect(overlays.menuMainPanel.style.display).not.toBe("none");
    expect(overlays.menuCreatePanel.style.display).toBe("none");
    expect(overlays.menuJoinPanel.style.display).toBe("none");
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

  it("can show online HUD with left/right labels", () => {
    const overlays = createOverlays(document);
    showHudOnline(overlays, {
      roomId: "ABCD",
      left: { score: 3, timeRatio01: 0.8, status: "alive" },
      right: { score: 7, timeRatio01: 0.4, status: "dead" }
    });
    expect(overlays.hud.textContent).toContain("对方");
    expect(overlays.hud.textContent).toContain("我");
    expect(overlays.hud.textContent).toContain("ABCD");
    expect(overlays.onlinePipToggleBtn.style.display).not.toBe("none");
  });

  it("shows result overlay with actions", () => {
    const overlays = createOverlays(document);
    showResult(overlays, { score: 9, bestScore: 12, isNewRecord: false, title: "胜利", subtitle: "P1 9 vs P2 12" } as any);
    expect(overlays.result.style.display).not.toBe("none");
    expect(overlays.result.textContent).toContain("9");
    expect(overlays.result.textContent).toContain("12");
    expect(overlays.result.textContent).toContain("胜利");
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
