import type { WebSocket } from "ws";
import { createMatchSim, startMatch } from "./gameSim";
import type { GameConfig } from "./config/gameConfig";
import type { Difficulty } from "./protocol";

export type Seat = "p1" | "p2";

export type Room = {
  roomId: string;
  difficulty: Difficulty;
  host: Seat;
  sockets: Map<Seat, WebSocket>;
  present: Record<Seat, boolean>;
  online: Record<Seat, boolean>;
  ready: Record<Seat, boolean>;
  sim: ReturnType<typeof createMatchSim>;
  lastActiveAtMs: number;
};

export type JoinError = "ROOM_NOT_FOUND" | "ROOM_FULL" | "INVALID_ROOM";
export type CreateError = "INVALID_ROOM" | "ROOM_EXISTS";
export type StartError = "ROOM_NOT_FOUND" | "NOT_HOST" | "NOT_READY" | "BAD_STATE";
export type ReadyError = "ROOM_NOT_FOUND" | "BAD_STATE";

export class RoomStore {
  private rooms = new Map<string, Room>();
  constructor(
    private config: GameConfig,
    private rng: () => number = Math.random,
    private now: () => number = Date.now
  ) {}

  private createUniqueRoomId(): string {
    for (let i = 0; i < MAX_ROOM_ID_ATTEMPTS; i += 1) {
      const roomId = generateRoomId(this.rng);
      if (!this.rooms.has(roomId)) return roomId;
    }
    throw new Error("failed to allocate room id");
  }

  get(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  listRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  createRoom(
    ws: WebSocket,
    params: { roomId?: string; difficulty: Difficulty }
  ): { room: Room; seat: Seat; isHost: boolean } | { error: CreateError } {
    const roomId =
      typeof params.roomId === "string"
        ? (() => {
            if (!isValidRoomId(params.roomId)) return null;
            if (this.rooms.has(params.roomId)) return undefined;
            return params.roomId;
          })()
        : this.createUniqueRoomId();

    if (roomId === null) return { error: "INVALID_ROOM" };
    if (roomId === undefined) return { error: "ROOM_EXISTS" };
    const seat: Seat = this.rng() < 0.5 ? "p1" : "p2";
    const room: Room = {
      roomId,
      difficulty: params.difficulty,
      host: seat,
      sockets: new Map([[seat, ws]]),
      present: { p1: seat === "p1", p2: seat === "p2" },
      online: { p1: seat === "p1", p2: seat === "p2" },
      ready: { p1: false, p2: false },
      sim: createMatchSim(hashSeed(roomId), applyDifficulty(this.config, params.difficulty)),
      lastActiveAtMs: this.now()
    };
    this.rooms.set(roomId, room);
    return { room, seat, isHost: true };
  }

  joinRoom(roomId: string, ws: WebSocket): { room: Room; seat: Seat; isHost: boolean } | { error: JoinError } {
    if (!isValidRoomId(roomId)) return { error: "INVALID_ROOM" };
    const room = this.rooms.get(roomId);
    if (!room) return { error: "ROOM_NOT_FOUND" };
    room.lastActiveAtMs = this.now();

    if (room.present.p1 && room.present.p2) return { error: "ROOM_FULL" };
    const seat: Seat = room.present.p1 ? "p2" : "p1";

    room.present[seat] = true;
    room.online[seat] = true;
    room.ready[seat] = false;
    room.sockets.set(seat, ws);

    return { room, seat, isHost: seat === room.host };
  }

  setReady(roomId: string, seat: Seat, ready: boolean): { ok: true } | { error: ReadyError } {
    const room = this.rooms.get(roomId);
    if (!room) return { error: "ROOM_NOT_FOUND" };
    room.lastActiveAtMs = this.now();
    if (room.sim.status !== "lobby") return { error: "BAD_STATE" };
    if (!room.present[seat]) return { error: "BAD_STATE" };
    room.ready[seat] = ready;
    return { ok: true };
  }

  start(roomId: string, seat: Seat): { ok: true } | { error: StartError } {
    const room = this.rooms.get(roomId);
    if (!room) return { error: "ROOM_NOT_FOUND" };
    room.lastActiveAtMs = this.now();
    if (room.sim.status !== "lobby") return { error: "BAD_STATE" };
    if (room.host !== seat) return { error: "NOT_HOST" };
    const bothReady =
      room.present.p1 &&
      room.present.p2 &&
      room.online.p1 &&
      room.online.p2 &&
      room.ready.p1 &&
      room.ready.p2;
    if (!bothReady) return { error: "NOT_READY" };
    startMatch(room.sim);
    return { ok: true };
  }

  removeConn(roomId: string, seat: Seat): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.lastActiveAtMs = this.now();
    room.sockets.delete(seat);
    room.online[seat] = false;
    room.ready[seat] = false;
    if (room.sockets.size === 0) this.rooms.delete(roomId);
  }

  cleanup(params: { maxIdleMs: number }): void {
    const now = this.now();
    for (const room of this.rooms.values()) {
      if (room.sockets.size > 0) continue;
      if (now - room.lastActiveAtMs >= params.maxIdleMs) this.rooms.delete(room.roomId);
    }
  }
}

export function isValidRoomId(roomId: string): boolean {
  return /^[0-9]{4}$/.test(roomId);
}

export function generateRoomId(rng: () => number): string {
  const n = Math.floor(rng() * 10_000);
  return String(n).padStart(4, "0");
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

const MAX_ROOM_ID_ATTEMPTS = 25;

function applyDifficulty(cfg: GameConfig, difficulty: Difficulty): GameConfig {
  const decayScale = difficulty === "easy" ? 1.5 : difficulty === "hard" ? 2.5 : 2;
  return {
    ...cfg,
    time: {
      ...cfg.time,
      decayScale
    }
  };
}
