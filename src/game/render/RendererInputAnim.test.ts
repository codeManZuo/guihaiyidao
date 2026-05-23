import { describe, expect, it, vi } from "vitest";
import { Renderer } from "./Renderer";

describe("Renderer input-triggered chop animation", () => {
  it("starts chop swing when triggerSingleChop is called", () => {
    const canvas = document.createElement("canvas");
    const r = new Renderer(canvas);
    r.triggerSingleChop("left");
    expect((r as any).singleSwingMs).toBeGreaterThan(0);
  });
});
