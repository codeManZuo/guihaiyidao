import { describe, expect, it } from "vitest";
import { defaultGameConfig } from "./config/gameConfig";
import { applyInput, createMatchSim, startMatch, tick } from "./gameSim";
import * as gameSim from "./gameSim";

describe("gameSim", () => {
  it("does not finish the match when only one player dies", () => {
    const sim = createMatchSim(123, defaultGameConfig());
    startMatch(sim);

    sim.p1.upcomingObstacles[0] = "left";
    applyInput(sim, "p1", "left");

    expect(sim.p1.status).toBe("dead");
    expect(sim.status).toBe("playing");
  });

  it("finishes only when both players are dead and computes winner", () => {
    const sim = createMatchSim(123, defaultGameConfig());
    startMatch(sim);

    sim.p1.score = 10;
    sim.p2.score = 9;

    sim.p1.upcomingObstacles[0] = "left";
    applyInput(sim, "p1", "left");
    expect(sim.status).toBe("playing");

    sim.p2.upcomingObstacles[0] = "right";
    applyInput(sim, "p2", "right");
    expect(sim.status).toBe("finished");

    expect(typeof (gameSim as any).computeWinner).toBe("function");
    expect((gameSim as any).computeWinner(sim)).toBe("p1");
  });

  it("keeps upcoming obstacle styles stable across shifts", () => {
    const sim = createMatchSim(123, defaultGameConfig());
    startMatch(sim);

    const beforeObstacle1 = sim.p1.upcomingObstacles[1];
    const beforeStyle1 = sim.p1.upcomingObstacleStyles[1];

    sim.p1.upcomingObstacles[0] = null;
    applyInput(sim, "p1", "left");

    expect(sim.p1.upcomingObstacles[0]).toBe(beforeObstacle1);
    expect(sim.p1.upcomingObstacleStyles[0]).toBe(beforeStyle1);
    expect(sim.p1.obstacleSide).toBe(sim.p1.upcomingObstacles[0]);
  });

  it("does not finish on tick when only one player is dead", () => {
    const sim = createMatchSim(123, defaultGameConfig());
    startMatch(sim);

    sim.p1.status = "dead";
    tick(sim, 1000);

    expect(sim.status).toBe("playing");
  });
});
