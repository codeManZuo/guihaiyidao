import type { Side, SinglePlayerState } from "../state/types";

export type { Side } from "../state/types";

export function createInitialSinglePlayerState(params: {
  timeMs: number;
  addTimePerChopMs: number;
  maxTimeMs: number;
}): SinglePlayerState {
  return {
    status: "alive",
    side: "left",
    score: 0,
    timeMs: params.timeMs,
    config: {
      addTimePerChopMs: params.addTimePerChopMs,
      maxTimeMs: params.maxTimeMs
    }
  };
}

export function applyTick(state: SinglePlayerState, dtMs: number): SinglePlayerState {
  if (state.status === "dead") return state;
  const nextTime = Math.max(0, state.timeMs - dtMs);
  return {
    ...state,
    timeMs: nextTime,
    status: nextTime === 0 ? "dead" : "alive"
  };
}

export function applyChop(
  state: SinglePlayerState,
  input: { side: Side; nextObstacleSide: Side | null }
): SinglePlayerState {
  if (state.status === "dead") return state;

  const nextSide = input.side;
  const obstacleSide = input.nextObstacleSide;
  const isDead = obstacleSide !== null && obstacleSide === nextSide;

  if (isDead) {
    return {
      ...state,
      side: nextSide,
      status: "dead"
    };
  }

  const nextTime = Math.min(
    state.timeMs + state.config.addTimePerChopMs,
    state.config.maxTimeMs
  );

  return {
    ...state,
    side: nextSide,
    score: state.score + 1,
    timeMs: nextTime
  };
}
