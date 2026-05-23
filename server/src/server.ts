import { WebSocketServer, type RawData, type WebSocket } from "ws";
import { decode, encode, type StateMessageV1 } from "./protocol";
import { RoomStore } from "./rooms";
import { applyInput, tick } from "./gameSim";

const port = Number(process.env.PORT || 8787);
const wss = new WebSocketServer({ port });
const store = new RoomStore();

type Conn = { roomId: string; playerId: string };
const conns = new WeakMap<WebSocket, Conn>();

function broadcastState(roomId: string): void {
  const room = store.getOrCreate(roomId);
  const msg: StateMessageV1 = {
    v: 1,
    type: "state",
    roomId,
    serverTimeMs: Date.now(),
    status: room.sim.status,
    p1: { score: room.sim.p1.score, timeMs: room.sim.p1.timeMs, status: room.sim.p1.status },
    p2: { score: room.sim.p2.score, timeMs: room.sim.p2.timeMs, status: room.sim.p2.status }
  };
  const raw = encode(msg);
  for (const ws of room.sockets.values()) ws.send(raw);
}

setInterval(() => {
  for (const room of store.listRooms()) {
    tick(room.sim, 50);
    broadcastState(room.roomId);
  }
}, 50);

wss.on("connection", (ws: WebSocket) => {
  ws.on("message", (data: RawData) => {
    const raw = data.toString();
    const msg = decode(raw);
    if (msg.type === "join") {
      store.addPlayer(msg.roomId, msg.playerId, ws);
      conns.set(ws, { roomId: msg.roomId, playerId: msg.playerId });
      broadcastState(msg.roomId);
      return;
    }
    if (msg.type === "input") {
      const conn = conns.get(ws);
      if (!conn) return;
      const player = conn.playerId === "p2" ? "p2" : "p1";
      const room = store.getOrCreate(conn.roomId);
      applyInput(room.sim, player, msg.side);
      broadcastState(conn.roomId);
    }
  });

  ws.on("close", () => {
    const conn = conns.get(ws);
    if (!conn) return;
    store.removePlayer(conn.roomId, conn.playerId);
  });
});

console.log(`ws server listening on ws://localhost:${port}`);
