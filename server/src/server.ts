import { WebSocketServer, type RawData, type WebSocket } from "ws";
import { decode, encode, type ErrorMessageV2, type JoinResultV2, type Seat, type StateMessageV2 } from "./protocol";
import { RoomStore, type Room } from "./rooms";
import { applyInput, computeWinner, tick } from "./gameSim";
import { loadGameConfigFromRepoRoot } from "./config/loadConfig";

type Conn = { roomId: string; seat: Seat };

function send(ws: WebSocket, msg: JoinResultV2 | StateMessageV2 | ErrorMessageV2): void {
  ws.send(encode(msg));
}

function sendError(ws: WebSocket, code: ErrorMessageV2["code"], message: string): void {
  send(ws, { v: 2, type: "error", code, message });
}

function errorMessageFor(code: ErrorMessageV2["code"]): string {
  if (code === "INVALID_ROOM") return "房间号无效（需要 4 位数字）";
  if (code === "ROOM_NOT_FOUND") return "房间不存在";
  if (code === "ROOM_FULL") return "房间已满";
  if (code === "NOT_HOST") return "只有房主可以开始游戏";
  if (code === "NOT_READY") return "双方都需要准备完成才能开始";
  return "状态异常";
}

export function buildStateMessageV2(room: Room): StateMessageV2 {
  const winner = computeWinner(room.sim);
  return {
    v: 2,
    type: "state",
    roomId: room.roomId,
    serverTimeMs: Date.now(),
    status: room.sim.status,
    hostPlayerId: room.host,
    p1: {
      present: room.present.p1,
      online: room.present.p1 && room.online.p1,
      ready: room.present.p1 && room.ready.p1,
      score: room.sim.p1.score,
      timeMs: room.sim.p1.timeMs,
      status: room.sim.p1.status,
      side: room.sim.p1.side,
      obstacleSide: room.sim.p1.obstacleSide
    },
    p2: {
      present: room.present.p2,
      online: room.present.p2 && room.online.p2,
      ready: room.present.p2 && room.ready.p2,
      score: room.sim.p2.score,
      timeMs: room.sim.p2.timeMs,
      status: room.sim.p2.status,
      side: room.sim.p2.side,
      obstacleSide: room.sim.p2.obstacleSide
    },
    winner
  };
}

function broadcastState(room: Room): void {
  const raw = encode(buildStateMessageV2(room));
  for (const ws of room.sockets.values()) ws.send(raw);
}

export function startWsServer(): void {
  const port = Number(process.env.PORT || 8787);
  const wss = new WebSocketServer({ port });
  const config = loadGameConfigFromRepoRoot();
  const store = new RoomStore(config);
  const conns = new WeakMap<WebSocket, Conn>();

  setInterval(() => {
    for (const room of store.listRooms()) {
      tick(room.sim, 50);
      broadcastState(room);
    }
  }, 50);

  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (data: RawData) => {
      const raw = data.toString();
      const wire = decode(raw);

      if (wire.type === "create_room") {
        const { room, seat, isHost } = store.createRoom(ws);
        conns.set(ws, { roomId: room.roomId, seat });
        send(ws, { v: 2, type: "joined", roomId: room.roomId, playerId: seat, isHost });
        broadcastState(room);
        return;
      }

      if (wire.type === "join_room") {
        const joined = store.joinRoom(wire.roomId, ws);
        if ("error" in joined) {
          sendError(ws, joined.error, errorMessageFor(joined.error));
          return;
        }
        conns.set(ws, { roomId: joined.room.roomId, seat: joined.seat });
        send(ws, { v: 2, type: "joined", roomId: joined.room.roomId, playerId: joined.seat, isHost: joined.isHost });
        broadcastState(joined.room);
        return;
      }

      if (wire.type !== "ready" && wire.type !== "start" && wire.type !== "input") return;
      const msg = wire;

      const conn = conns.get(ws);
      if (!conn) {
        sendError(ws, "BAD_STATE", errorMessageFor("BAD_STATE"));
        return;
      }
      if (msg.roomId !== conn.roomId) {
        sendError(ws, "BAD_STATE", errorMessageFor("BAD_STATE"));
        return;
      }

      const room = store.get(conn.roomId);
      if (!room) {
        sendError(ws, "ROOM_NOT_FOUND", errorMessageFor("ROOM_NOT_FOUND"));
        return;
      }

      if (msg.type === "ready") {
        const r = store.setReady(conn.roomId, conn.seat, true);
        if ("error" in r) {
          sendError(ws, r.error, errorMessageFor(r.error === "ROOM_NOT_FOUND" ? "ROOM_NOT_FOUND" : "BAD_STATE"));
          return;
        }
        broadcastState(room);
        return;
      }

      if (msg.type === "start") {
        const r = store.start(conn.roomId, conn.seat);
        if ("error" in r) {
          sendError(ws, r.error === "ROOM_NOT_FOUND" ? "ROOM_NOT_FOUND" : r.error, errorMessageFor(r.error === "ROOM_NOT_FOUND" ? "ROOM_NOT_FOUND" : r.error));
          return;
        }
        broadcastState(room);
        return;
      }

      if (msg.type === "input") {
        applyInput(room.sim, conn.seat, msg.side);
        broadcastState(room);
      }
    });

    ws.on("close", () => {
      const conn = conns.get(ws);
      if (!conn) return;
      store.removeConn(conn.roomId, conn.seat);
      const room = store.get(conn.roomId);
      if (room) broadcastState(room);
    });
  });

  console.log(`ws server listening on ws://localhost:${port}`);
}

if (process.env.NODE_ENV !== "test" && process.env.VITEST !== "true") startWsServer();
