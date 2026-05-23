import type { Side } from "./protocol";

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
  rng: number;
};

export function createMatchSim(seed: number): MatchSim {
  const sim: MatchSim = {
    status: "lobby",
    maxTimeMs: 5000,
    addTimePerChopMs: 250,
    rng: seed | 0,
    p1: { status: "alive", score: 0, timeMs: 5000, side: "left", obstacleSide: null, lastObstacleSide: null },
    p2: { status: "alive", score: 0, timeMs: 5000, side: "left", obstacleSide: null, lastObstacleSide: null }
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
  for (const p of [sim.p1, sim.p2]) {
    if (p.status === "dead") continue;
    p.timeMs = Math.max(0, p.timeMs - dtMs);
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
  const value: Side | null = r < 0.1 ? null : r < 0.55 ? "left" : "right";

  if (value !== null && value === p.lastObstacleSide) {
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
