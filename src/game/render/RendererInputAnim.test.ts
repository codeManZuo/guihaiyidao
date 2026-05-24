import { describe, expect, it, vi } from "vitest";
import { Renderer } from "./Renderer";

describe("Renderer input-triggered chop animation", () => {
  it("starts chop swing when triggerSingleChop is called", () => {
    const canvas = document.createElement("canvas");
    const r = new Renderer(canvas);
    r.triggerSingleChop("left");
    expect((r as any).singleSwingMs).toBeGreaterThan(0);
  });

  it("renders left online player with red torso", () => {
    const canvas = document.createElement("canvas");
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    let currentFillStyle = "";
    const torsoColors: string[] = [];

    const ctx = new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (prop === "measureText") return () => ({ width: 0 });
          if (prop === "createLinearGradient" || prop === "createRadialGradient") return () => ({ addColorStop: () => {} });
          if (prop === "fillRect")
            return (_x: number, _y: number, w: number, h: number) => {
              if (w === 8 && h === 10) torsoColors.push(currentFillStyle);
            };
          return () => {};
        },
        set: (_target, prop, value) => {
          if (prop === "fillStyle") currentFillStyle = String(value);
          return true;
        }
      }
    ) as any;

    HTMLCanvasElement.prototype.getContext = () => ctx;
    Object.defineProperty(canvas, "clientWidth", { value: 360 });
    Object.defineProperty(canvas, "clientHeight", { value: 640 });
    const r = new Renderer(canvas);

    r.renderOnline({
      status: "playing",
      p1: { score: 0, timeMs: 7000, status: "alive", side: "left", obstacleSide: null },
      p2: { score: 0, timeMs: 7000, status: "alive", side: "left", obstacleSide: null }
    });

    expect(torsoColors[0]).toBe("#b04a4a");
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it("renders online upcoming branches when obstacleSide is null", () => {
    const canvas = document.createElement("canvas");
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const ctx = new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (prop === "measureText") return () => ({ width: 0 });
          if (prop === "createLinearGradient" || prop === "createRadialGradient") return () => ({ addColorStop: () => {} });
          return () => {};
        },
        set: () => true
      }
    ) as any;
    HTMLCanvasElement.prototype.getContext = () => ctx;
    Object.defineProperty(canvas, "clientWidth", { value: 360 });
    Object.defineProperty(canvas, "clientHeight", { value: 640 });
    const r = new Renderer(canvas);
    const drawBranch = vi.spyOn(r as any, "drawBranch");

    r.renderOnline({
      status: "playing",
      p1: {
        score: 0,
        timeMs: 7000,
        status: "alive",
        side: "left",
        obstacleSide: null,
        upcomingObstacles: ["left"],
        upcomingObstacleStyles: [1]
      },
      p2: {
        score: 0,
        timeMs: 7000,
        status: "alive",
        side: "left",
        obstacleSide: null,
        upcomingObstacles: [null],
        upcomingObstacleStyles: [0]
      }
    });

    expect(drawBranch).toHaveBeenCalled();
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });
});
