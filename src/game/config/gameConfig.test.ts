import { describe, expect, it } from "vitest";
import { configFromProperties, defaultGameConfig } from "./gameConfig";

describe("gameConfig", () => {
  it("uses defaults when keys missing", () => {
    const cfg = configFromProperties({});
    expect(cfg).toEqual(defaultGameConfig());
  });

  it("parses and clamps values", () => {
    const cfg = configFromProperties({
      "time.startMs": "7000",
      "time.maxMs": "6000",
      "time.addPerChopMs": "999999",
      "time.decayScale": "0",
      "obstacle.noneChance": "2",
      "obstacle.avoidSameSide": "false"
    });
    expect(cfg.time.startMs).toBe(7000);
    expect(cfg.time.maxMs).toBe(7000);
    expect(cfg.time.addPerChopMs).toBeGreaterThan(0);
    expect(cfg.time.decayScale).toBeGreaterThan(0);
    expect(cfg.obstacle.noneChance).toBe(1);
    expect(cfg.obstacle.avoidSameSide).toBe(false);
  });
});
