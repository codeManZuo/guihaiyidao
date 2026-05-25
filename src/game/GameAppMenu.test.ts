import { describe, expect, it, vi } from "vitest";
import { GameApp } from "./GameApp";

describe("GameApp menu", () => {
  it("renders menu on boot when opening root url", () => {
    (HTMLCanvasElement.prototype as any).getContext = () => ({
      setTransform: () => {},
      clearRect: () => {},
      fillRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      quadraticCurveTo: () => {},
      closePath: () => {},
      fill: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      fillText: () => {},
      set imageSmoothingEnabled(_: boolean) {},
      set fillStyle(_: string) {},
      set font(_: string) {},
      set textAlign(_: CanvasTextAlign) {},
      set textBaseline(_: CanvasTextBaseline) {},
      set globalAlpha(_: number) {},
      drawImage: () => {}
    });
    const root = document.createElement("div");
    new GameApp(root);
    expect(root.querySelector(".overlay-menu")).not.toBeNull();
    expect(root.textContent).toContain("单人");
    expect(root.textContent).toContain("创建房间");
    expect(root.textContent).toContain("加入房间");
  });

  it("predicts my online side for render without waiting for server state", () => {
    (HTMLCanvasElement.prototype as any).getContext = () => ({
      setTransform: () => {},
      clearRect: () => {},
      fillRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      quadraticCurveTo: () => {},
      closePath: () => {},
      fill: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      fillText: () => {},
      set imageSmoothingEnabled(_: boolean) {},
      set fillStyle(_: string) {},
      set font(_: string) {},
      set textAlign(_: CanvasTextAlign) {},
      set textBaseline(_: CanvasTextBaseline) {},
      set globalAlpha(_: number) {},
      drawImage: () => {}
    });

    vi.spyOn(performance, "now").mockReturnValue(1000);

    const root = document.createElement("div");
    const app = new GameApp(root) as any;

    app.flow = { screen: "online", mode: "playing", roomId: "1234" };
    app.online = {
      getJoined: () => ({ roomId: "1234", playerId: "p1", isHost: true }),
      getState: () => ({
        v: 2,
        type: "state",
        roomId: "1234",
        serverTimeMs: 0,
        status: "playing",
        hostPlayerId: "p1",
        difficulty: "normal",
        p1: {
          present: true,
          online: true,
          ready: true,
          score: 0,
          timeMs: 1000,
          status: "alive",
          side: "left",
          obstacleSide: null,
          upcomingObstacles: [],
          upcomingObstacleStyles: []
        },
        p2: {
          present: true,
          online: true,
          ready: true,
          score: 0,
          timeMs: 1000,
          status: "alive",
          side: "left",
          obstacleSide: null,
          upcomingObstacles: [],
          upcomingObstacleStyles: []
        },
        winner: null
      }),
      getError: () => null
    };

    app.onlineMySidePrediction = { side: "right", untilPerfMs: 2000 };

    const renderOnlineSpy = vi.fn();
    app.renderer.renderOnline = renderOnlineSpy;

    app.loop.cb.render();

    expect(renderOnlineSpy).toHaveBeenCalledTimes(1);
    const arg = renderOnlineSpy.mock.calls[0]?.[0];
    expect(arg.p1.side).toBe("right");
  });
});
