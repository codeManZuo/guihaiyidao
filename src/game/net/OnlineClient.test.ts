import { describe, expect, it } from "vitest";
import { OnlineClient } from "./OnlineClient";

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = FakeWebSocket.CONNECTING;
  bufferedAmount = 0;
  sent: string[] = [];
  onopen: null | (() => void) = null;
  onmessage: null | ((ev: { data: unknown }) => void) = null;
  onclose: null | (() => void) = null;

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.();
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  message(data: unknown): void {
    this.onmessage?.({ data });
  }
}

describe("OnlineClient v2", () => {
  it("queues create_room until socket opens and stores joined info", () => {
    const ws = new FakeWebSocket();
    const client = new (OnlineClient as any)({
      url: "ws://example/ws",
      wsFactory: () => ws as any,
      nowMs: () => 1234,
      perfNowMs: () => 5678
    });

    (client as any).connect();
    (client as any).createRoom({ roomId: "1234", difficulty: "hard" });
    expect(ws.sent.length).toBe(0);

    ws.open();
    expect(ws.sent.length).toBe(1);
    expect(JSON.parse(ws.sent[0])).toEqual({ v: 2, type: "create_room", roomId: "1234", difficulty: "hard" });

    ws.message(JSON.stringify({ v: 2, type: "joined", roomId: "1234", playerId: "p1", isHost: true }));
    expect((client as any).getJoined()).toEqual({ roomId: "1234", playerId: "p1", isHost: true });
  });

  it("sends input with seq and joined roomId", () => {
    const ws = new FakeWebSocket();
    const client = new (OnlineClient as any)({
      url: "ws://example/ws",
      wsFactory: () => ws as any,
      nowMs: () => 1234,
      perfNowMs: () => 9999
    });

    (client as any).connect();
    ws.open();
    ws.message(JSON.stringify({ v: 2, type: "joined", roomId: "1234", playerId: "p2", isHost: false }));

    (client as any).sendInput("left");
    expect(ws.sent.length).toBe(0);

    (client as any).flushInput();
    expect(ws.sent.length).toBe(1);

    const msg = JSON.parse(ws.sent[0]) as any;
    expect(msg.v).toBe(2);
    expect(msg.type).toBe("input");
    expect(msg.roomId).toBe("1234");
    expect(msg.seq).toBe(1);
    expect(msg.side).toBe("left");
    expect(msg.clientTimeMs).toBe(9999);
  });

  it("can query rooms and store rooms_list result", () => {
    const ws = new FakeWebSocket();
    const client = new (OnlineClient as any)({
      url: "ws://example/ws",
      wsFactory: () => ws as any,
      nowMs: () => 1234,
      perfNowMs: () => 9999
    });

    (client as any).connect();
    ws.open();

    (client as any).queryRooms("12");
    expect(ws.sent.length).toBe(1);
    expect(JSON.parse(ws.sent[0])).toEqual({ v: 2, type: "rooms_query", prefix: "12" });

    ws.message(JSON.stringify({ v: 2, type: "rooms_list", prefix: "12", roomIds: ["1234", "1299"] }));
    expect((client as any).getRoomsList()).toEqual({ prefix: "12", roomIds: ["1234", "1299"] });
  });

  it("stores only the latest raw state and decodes at getState time", () => {
    const ws = new FakeWebSocket();
    const client = new (OnlineClient as any)({
      url: "ws://example/ws",
      wsFactory: () => ws as any
    });

    (client as any).connect();
    ws.open();
    ws.message(JSON.stringify({ v: 2, type: "joined", roomId: "1234", playerId: "p1", isHost: true }));

    ws.message(JSON.stringify({ v: 2, type: "state", roomId: "1234", serverTimeMs: 1, status: "lobby", hostPlayerId: "p1", difficulty: "normal", p1: { present: true, online: true, ready: false, score: 1, timeMs: 1, status: "alive", side: "left", obstacleSide: null, upcomingObstacles: [], upcomingObstacleStyles: [] }, p2: { present: false, online: false, ready: false, score: 0, timeMs: 1, status: "alive", side: "left", obstacleSide: null, upcomingObstacles: [], upcomingObstacleStyles: [] }, winner: null }));
    ws.message(JSON.stringify({ v: 2, type: "state", roomId: "1234", serverTimeMs: 2, status: "lobby", hostPlayerId: "p1", difficulty: "normal", p1: { present: true, online: true, ready: false, score: 2, timeMs: 1, status: "alive", side: "right", obstacleSide: null, upcomingObstacles: [], upcomingObstacleStyles: [] }, p2: { present: false, online: false, ready: false, score: 0, timeMs: 1, status: "alive", side: "left", obstacleSide: null, upcomingObstacles: [], upcomingObstacleStyles: [] }, winner: null }));

    const state = (client as any).getState();
    expect(state.p1.score).toBe(2);
    expect(state.p1.side).toBe("right");
  });
});
