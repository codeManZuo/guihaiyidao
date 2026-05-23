import { describe, expect, it } from "vitest";
import { defaultGameConfig } from "./config/gameConfig";
import { RoomStore } from "./rooms";
import * as rooms from "./rooms";

describe("rooms", () => {
  it("validates 4-digit numeric room ids", () => {
    expect((rooms as any).isValidRoomId("0123")).toBe(true);
    expect((rooms as any).isValidRoomId("1234")).toBe(true);
    expect((rooms as any).isValidRoomId("123")).toBe(false);
    expect((rooms as any).isValidRoomId("12345")).toBe(false);
    expect((rooms as any).isValidRoomId("abcd")).toBe(false);
  });

  it("creates and joins rooms with random seat assignment", () => {
    let rngState = 0;
    const rng = () => {
      rngState += 1;
      return rngState % 2 === 0 ? 0.9 : 0.1;
    };

    const store = new (RoomStore as any)(defaultGameConfig(), rng);
    expect(typeof store.createRoom).toBe("function");
    expect(typeof store.joinRoom).toBe("function");

    const ws1 = {} as any;
    const created = store.createRoom(ws1, { difficulty: "normal" });
    expect(created.room.roomId).toMatch(/^[0-9]{4}$/);
    expect(["p1", "p2"]).toContain(created.seat);
    expect(created.isHost).toBe(true);
    expect(created.room.host).toBe(created.seat);

    const ws2 = {} as any;
    const joined = store.joinRoom(created.room.roomId, ws2);
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error("unexpected error");
    expect(joined.room.roomId).toBe(created.room.roomId);
    expect(joined.seat).not.toBe(created.seat);
    expect(joined.isHost).toBe(false);
  });

  it("rejects join for missing/invalid/full rooms", () => {
    const store = new (RoomStore as any)(defaultGameConfig(), () => 0.123);

    const missing = store.joinRoom("1234", {} as any);
    expect(missing).toEqual({ error: "ROOM_NOT_FOUND" });

    const invalid = store.joinRoom("12ab", {} as any);
    expect(invalid).toEqual({ error: "INVALID_ROOM" });

    const c = store.createRoom({} as any, { difficulty: "normal" });
    const _j = store.joinRoom(c.room.roomId, {} as any);
    const full = store.joinRoom(c.room.roomId, {} as any);
    expect(full).toEqual({ error: "ROOM_FULL" });
  });

  it("creates room with specified roomId and rejects duplicates", () => {
    const store = new (RoomStore as any)(defaultGameConfig(), () => 0.123);
    const c = store.createRoom({} as any, { roomId: "1234", difficulty: "hard" });
    expect("error" in c).toBe(false);
    if ("error" in c) throw new Error("unexpected error");
    expect(c.room.roomId).toBe("1234");
    expect(c.room.difficulty).toBe("hard");

    const dup = store.createRoom({} as any, { roomId: "1234", difficulty: "normal" });
    expect(dup).toEqual({ error: "ROOM_EXISTS" });
  });

  it("requires both players ready and host to start", () => {
    const store = new (RoomStore as any)(defaultGameConfig(), () => 0.1);
    const c = store.createRoom({} as any, { difficulty: "normal" });
    const j = store.joinRoom(c.room.roomId, {} as any);
    if ("error" in j) throw new Error("unexpected error");

    const notReady = store.start(c.room.roomId, c.seat);
    expect(notReady).toEqual({ error: "NOT_READY" });

    store.setReady(c.room.roomId, c.seat, true);
    const stillNotReady = store.start(c.room.roomId, c.seat);
    expect(stillNotReady).toEqual({ error: "NOT_READY" });

    const nonHostSeat = j.seat;
    store.setReady(c.room.roomId, nonHostSeat, true);
    const nonHostStart = store.start(c.room.roomId, nonHostSeat);
    expect(nonHostStart).toEqual({ error: "NOT_HOST" });

    const ok = store.start(c.room.roomId, c.seat);
    expect(ok).toEqual({ ok: true });
    expect(c.room.sim.status).toBe("playing");
  });
});
