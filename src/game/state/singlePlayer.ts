import type { Side } from "./types";
import type { SinglePlayerState } from "./types";
import { applyChop, applyTick, createInitialSinglePlayerState } from "../rules/TimberRules";
import { ObstacleGenerator } from "../obstacles/ObstacleGenerator";
import type { GameConfig } from "../config/gameConfig";

export type SinglePlayerRuntime = {
  state: SinglePlayerState;
  gen: ObstacleGenerator;
  upcomingObstacles: Array<Side | null>;
  config: GameConfig;
};

export function createSinglePlayerRuntime(seed: number, config: GameConfig): SinglePlayerRuntime {
  const gen = new ObstacleGenerator(seed, {
    noneChance: config.obstacle.noneChance,
    avoidSameSide: config.obstacle.avoidSameSide
  });
  const upcomingObstacles = Array.from({ length: 16 }, () => gen.next());
  return {
    config,
    state: createInitialSinglePlayerState({
      timeMs: config.time.startMs,
      addTimePerChopMs: config.time.addPerChopMs,
      maxTimeMs: config.time.maxMs
    }),
    gen,
    upcomingObstacles
  };
}

export function tickSinglePlayer(rt: SinglePlayerRuntime, dtMs: number): void {
  rt.state = applyTick(rt.state, dtMs * rt.config.time.decayScale);
}

export function chopSinglePlayer(rt: SinglePlayerRuntime, side: Side): void {
  rt.state = applyChop(rt.state, {
    side,
    nextObstacleSide: rt.upcomingObstacles[0] ?? null
  });
  rt.upcomingObstacles.shift();
  rt.upcomingObstacles.push(rt.gen.next());
}
