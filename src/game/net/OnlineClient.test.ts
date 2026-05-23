import { describe, expect, it } from "vitest";
import { OnlineClient } from "./OnlineClient";

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = FakeWebSocket.CONNECTING;
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
    (client as any).createRoom();
    expect(ws.sent.length).toBe(0);

    ws.open();
    expect(ws.sent.length).toBe(1);
    expect(JSON.parse(ws.sent[0])).toEqual({ v: 2, type: "create_room" });

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
    expect(ws.sent.length).toBe(1);

    const msg = JSON.parse(ws.sent[0]) as any;
    expect(msg.v).toBe(2);
    expect(msg.type).toBe("input");
    expect(msg.roomId).toBe("1234");
    expect(msg.seq).toBe(1);
    expect(msg.side).toBe("left");
    expect(msg.clientTimeMs).toBe(9999);
  });
});
