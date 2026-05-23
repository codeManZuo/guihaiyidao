import type { WebSocket } from "ws";
import { createMatchSim, startMatch } from "./gameSim";
import type { GameConfig } from "./config/gameConfig";

export type Room = {
  roomId: string;
  sockets: Map<string, WebSocket>;
  sim: ReturnType<typeof createMatchSim>;
};

export class RoomStore {
  private rooms = new Map<string, Room>();
  constructor(private config: GameConfig) {}

  getOrCreate(roomId: string): Room {
    const existing = this.rooms.get(roomId);
    if (existing) return existing;
    const room: Room = { roomId, sockets: new Map(), sim: createMatchSim(hashSeed(roomId), this.config) };
    this.rooms.set(roomId, room);
    return room;
  }

  listRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  addPlayer(roomId: string, playerId: string, ws: WebSocket): Room {
    const room = this.getOrCreate(roomId);
    if (!room.sockets.has(playerId) && room.sockets.size >= 2) return room;
    room.sockets.set(playerId, ws);
    if (room.sockets.size === 2 && room.sim.status === "lobby") startMatch(room.sim);
    return room;
  }

  removePlayer(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.sockets.delete(playerId);
    if (room.sockets.size === 0) this.rooms.delete(roomId);
  }
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}
