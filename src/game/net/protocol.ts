import type { Side } from "../state/types";

export type InputMessageV1 = {
  v: 1;
  type: "input";
  roomId: string;
  playerId: string;
  seq: number;
  side: Side;
  clientTimeMs: number;
};

export type JoinMessageV1 = {
  v: 1;
  type: "join";
  roomId: string;
  playerId: string;
};

export type StateMessageV1 = {
  v: 1;
  type: "state";
  roomId: string;
  serverTimeMs: number;
  status: "lobby" | "playing" | "finished";
  p1: { score: number; timeMs: number; status: "alive" | "dead" };
  p2: { score: number; timeMs: number; status: "alive" | "dead" };
};

export type ClientToServer = JoinMessageV1 | InputMessageV1;
export type ServerToClient = StateMessageV1;
export type WireMessage = ClientToServer | ServerToClient;

export function encodeMessage(msg: WireMessage): string {
  return JSON.stringify(msg);
}

export function decodeMessage(raw: string): WireMessage {
  const parsed = JSON.parse(raw) as WireMessage;
  if (typeof parsed !== "object" || parsed === null) throw new Error("bad message");
  if (!("v" in parsed) || (parsed as any).v !== 1) throw new Error("unsupported version");
  return parsed;
}
