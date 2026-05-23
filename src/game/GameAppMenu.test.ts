import { describe, expect, it } from "vitest";
import { GameApp } from "./GameApp";

describe("GameApp menu", () => {
  it("renders menu on boot when opening root url", () => {
    (HTMLCanvasElement.prototype as any).getContext = () => ({
      setTransform: () => {}
    });
    const root = document.createElement("div");
    new GameApp(root);
    expect(root.querySelector(".overlay-menu")).not.toBeNull();
    expect(root.textContent).toContain("单人");
    expect(root.textContent).toContain("在线双人");
  });
});
