export type Side = "left" | "right";
export type LifeStatus = "alive" | "dead";

export type SinglePlayerConfig = {
  addTimePerChopMs: number;
  maxTimeMs: number;
};

export type SinglePlayerState = {
  status: LifeStatus;
  side: Side;
  score: number;
  timeMs: number;
  config: SinglePlayerConfig;
};
