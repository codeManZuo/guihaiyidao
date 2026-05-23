import type { Side } from "./types";
import type { SinglePlayerState } from "./types";
import { applyChop, applyTick, createInitialSinglePlayerState } from "../rules/TimberRules";
import { ObstacleGenerator } from "../obstacles/ObstacleGenerator";
import type { GameConfig } from "../config/gameConfig";
import { XorShift32 } from "../rng/XorShift32";

export type SinglePlayerRuntime = {
  state: SinglePlayerState;
  gen: ObstacleGenerator;
  upcomingObstacles: Array<Side | null>;
  upcomingObstacleStyles: number[];
  styleRng: XorShift32;
  config: GameConfig;
};

export function createSinglePlayerRuntime(seed: number, config: GameConfig): SinglePlayerRuntime {
  const gen = new ObstacleGenerator(seed, {
    noneChance: config.obstacle.noneChance,
    avoidSameSide: config.obstacle.avoidSameSide
  });
  const styleRng = new XorShift32((seed ^ 0x51633e2d) | 0);
  const upcomingObstacles = Array.from({ length: 16 }, () => gen.next());
  const upcomingObstacleStyles = Array.from({ length: 16 }, () => styleRng.nextUint32() % 4);
  return {
    config,
    state: createInitialSinglePlayerState({
      timeMs: config.time.startMs,
      addTimePerChopMs: config.time.addPerChopMs,
      maxTimeMs: config.time.maxMs
    }),
    gen,
    upcomingObstacles,
    upcomingObstacleStyles,
    styleRng
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
  rt.upcomingObstacleStyles.shift();
  rt.upcomingObstacleStyles.push(rt.styleRng.nextUint32() % 4);
}
