export type Side = "left" | "right";

export type Seat = "p1" | "p2";

export type Difficulty = "easy" | "normal" | "hard";

export type CreateRoomV2 = {
  v: 2;
  type: "create_room";
  roomId?: string;
  difficulty: Difficulty;
};

export type JoinRoomV2 = {
  v: 2;
  type: "join_room";
  roomId: string;
};

export type ReadyV2 = {
  v: 2;
  type: "ready";
  roomId: string;
};

export type StartV2 = {
  v: 2;
  type: "start";
  roomId: string;
};

export type InputV2 = {
  v: 2;
  type: "input";
  roomId: string;
  seq: number;
  side: Side;
  clientTimeMs: number;
};

export type JoinResultV2 = {
  v: 2;
  type: "joined";
  roomId: string;
  playerId: Seat;
  isHost: boolean;
};

export type ErrorMessageV2 = {
  v: 2;
  type: "error";
  code: "ROOM_NOT_FOUND" | "ROOM_FULL" | "INVALID_ROOM" | "ROOM_EXISTS" | "NOT_HOST" | "NOT_READY" | "BAD_STATE";
  message: string;
};

export type PlayerViewV2 = {
  present: boolean;
  online: boolean;
  ready: boolean;
  score: number;
  timeMs: number;
  status: "alive" | "dead";
  side: Side;
  obstacleSide: Side | null;
  upcomingObstacles: Array<Side | null>;
  upcomingObstacleStyles: number[];
};

export type StateMessageV2 = {
  v: 2;
  type: "state";
  roomId: string;
  serverTimeMs: number;
  status: "lobby" | "playing" | "finished";
  hostPlayerId: Seat;
  difficulty: Difficulty;
  p1: PlayerViewV2;
  p2: PlayerViewV2;
  winner: Seat | "draw" | null;
};

export type ClientToServer = CreateRoomV2 | JoinRoomV2 | ReadyV2 | StartV2 | InputV2;
export type ServerToClient = JoinResultV2 | StateMessageV2 | ErrorMessageV2;
export type WireMessage = ClientToServer | ServerToClient;

export function decode(raw: string): WireMessage {
  const parsed = JSON.parse(raw) as WireMessage;
  if (!parsed || typeof parsed !== "object") throw new Error("bad message");
  if ((parsed as any).v !== 2) throw new Error("unsupported version");
  return parsed;
}

export function encode(msg: WireMessage): string {
  return JSON.stringify(msg);
}
