import { describe, expect, it } from "vitest";
import { Renderer } from "./Renderer";

describe("Renderer ambient background", () => {
  it("advances cloud positions over time", () => {
    const r = new Renderer(document.createElement("canvas"));
    r.tickAmbient(0, 320, 640);
    const before = (r as any).clouds?.map((c: any) => c.x) ?? [];
    r.tickAmbient(1000, 320, 640);
    const after = (r as any).clouds?.map((c: any) => c.x) ?? [];
    expect(after.length).toBeGreaterThan(0);
    expect(after.some((x: number, i: number) => x !== before[i])).toBe(true);
  });

  it("spawns a bird after spawn timer elapses", () => {
    const r = new Renderer(document.createElement("canvas"));
    (r as any).nextBirdInMs = 1;
    r.tickAmbient(5, 320, 640);
    const birds = (r as any).birds ?? [];
    expect(birds.length).toBe(1);
    expect(typeof birds[0].color).toBe("string");
    expect(birds[0].y).toBeGreaterThanOrEqual(64);
    expect(birds[0].y).toBeLessThanOrEqual(307.2);
  });
});
