import type { Side } from "./types";
import type { SinglePlayerState } from "./types";
import { applyChop, applyTick, createInitialSinglePlayerState } from "../rules/TimberRules";
import { ObstacleGenerator } from "../obstacles/ObstacleGenerator";

export type SinglePlayerRuntime = {
  state: SinglePlayerState;
  gen: ObstacleGenerator;
  nextObstacleSide: Side | null;
};

export function createSinglePlayerRuntime(seed: number): SinglePlayerRuntime {
  const gen = new ObstacleGenerator(seed);
  return {
    state: createInitialSinglePlayerState({
      timeMs: 5000,
      addTimePerChopMs: 250,
      maxTimeMs: 5000
    }),
    gen,
    nextObstacleSide: gen.next()
  };
}

export function tickSinglePlayer(rt: SinglePlayerRuntime, dtMs: number): void {
  rt.state = applyTick(rt.state, dtMs);
}

export function chopSinglePlayer(rt: SinglePlayerRuntime, side: Side): void {
  rt.state = applyChop(rt.state, {
    side,
    nextObstacleSide: rt.nextObstacleSide
  });
  rt.nextObstacleSide = rt.gen.next();
}
