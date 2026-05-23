import type { Side } from "./protocol";

export type PlayerSim = {
  status: "alive" | "dead";
  score: number;
  timeMs: number;
  side: Side;
};

export type MatchSim = {
  status: "lobby" | "playing" | "finished";
  p1: PlayerSim;
  p2: PlayerSim;
  maxTimeMs: number;
  addTimePerChopMs: number;
};

export function createMatchSim(): MatchSim {
  return {
    status: "lobby",
    maxTimeMs: 5000,
    addTimePerChopMs: 250,
    p1: { status: "alive", score: 0, timeMs: 5000, side: "left" },
    p2: { status: "alive", score: 0, timeMs: 5000, side: "left" }
  };
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
  p.score += 1;
  p.timeMs = Math.min(sim.maxTimeMs, p.timeMs + sim.addTimePerChopMs);
}
