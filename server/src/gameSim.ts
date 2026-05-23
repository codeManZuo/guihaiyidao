import type { Side } from "./protocol";
import type { GameConfig } from "./config/gameConfig";

export type PlayerSim = {
  status: "alive" | "dead";
  score: number;
  timeMs: number;
  side: Side;
  obstacleSide: Side | null;
  lastObstacleSide: Side | null;
};

export type MatchSim = {
  status: "lobby" | "playing" | "finished";
  p1: PlayerSim;
  p2: PlayerSim;
  maxTimeMs: number;
  addTimePerChopMs: number;
  decayScale: number;
  noneChance: number;
  avoidSameSide: boolean;
  rng: number;
};

export function createMatchSim(seed: number, config: GameConfig): MatchSim {
  const sim: MatchSim = {
    status: "lobby",
    maxTimeMs: config.time.maxMs,
    addTimePerChopMs: config.time.addPerChopMs,
    decayScale: config.time.decayScale,
    noneChance: config.obstacle.noneChance,
    avoidSameSide: config.obstacle.avoidSameSide,
    rng: seed | 0,
    p1: {
      status: "alive",
      score: 0,
      timeMs: config.time.startMs,
      side: "left",
      obstacleSide: null,
      lastObstacleSide: null
    },
    p2: {
      status: "alive",
      score: 0,
      timeMs: config.time.startMs,
      side: "left",
      obstacleSide: null,
      lastObstacleSide: null
    }
  };
  sim.p1.obstacleSide = nextObstacle(sim, sim.p1);
  sim.p2.obstacleSide = nextObstacle(sim, sim.p2);
  return sim;
}

export function startMatch(sim: MatchSim): void {
  sim.status = "playing";
}

export function tick(sim: MatchSim, dtMs: number): void {
  if (sim.status !== "playing") return;
  const scaled = dtMs * sim.decayScale;
  for (const p of [sim.p1, sim.p2]) {
    if (p.status === "dead") continue;
    p.timeMs = Math.max(0, p.timeMs - scaled);
    if (p.timeMs === 0) p.status = "dead";
  }
  if (sim.p1.status === "dead" || sim.p2.status === "dead") sim.status = "finished";
}

export function applyInput(sim: MatchSim, player: "p1" | "p2", side: Side): void {
  if (sim.status !== "playing") return;
  const p = player === "p1" ? sim.p1 : sim.p2;
  if (p.status === "dead") return;
  p.side = side;
  const isDead = p.obstacleSide !== null && p.obstacleSide === side;
  if (isDead) {
    p.status = "dead";
    sim.status = "finished";
    return;
  }
  p.score += 1;
  p.timeMs = Math.min(sim.maxTimeMs, p.timeMs + sim.addTimePerChopMs);
  p.obstacleSide = nextObstacle(sim, p);
}

function nextObstacle(sim: MatchSim, p: PlayerSim): Side | null {
  const r = nextFloat01(sim);
  const none = Math.max(0, Math.min(1, sim.noneChance));
  const value: Side | null = r < none ? null : r < none + (1 - none) * 0.5 ? "left" : "right";

  if (sim.avoidSameSide && value !== null && value === p.lastObstacleSide) {
    const flip = nextFloat01(sim) < 0.5;
    const out = flip ? value : value === "left" ? "right" : "left";
    p.lastObstacleSide = out;
    return out;
  }

  p.lastObstacleSide = value;
  return value;
}

function nextFloat01(sim: MatchSim): number {
  return nextUint32(sim) / 0xffffffff;
}

function nextUint32(sim: MatchSim): number {
  let x = sim.rng | 0;
  if (x === 0) x = 123456789;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  sim.rng = x | 0;
  return sim.rng >>> 0;
}
