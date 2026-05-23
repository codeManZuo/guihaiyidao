import { describe, expect, it } from "vitest";
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
});
