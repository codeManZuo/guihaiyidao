import { describe, expect, it } from "vitest";
import { defaultGameConfig } from "./config/gameConfig";
import { RoomStore } from "./rooms";
import * as server from "./server";

describe("server", () => {
  it("builds a v2 state message from a room snapshot", () => {
    const store = new RoomStore(defaultGameConfig(), () => 0.1);
    const created = store.createRoom({} as any, { difficulty: "normal" });
    if ("error" in created) throw new Error("unexpected error");
    const joined = store.joinRoom(created.room.roomId, {} as any);
    if ("error" in joined) throw new Error("unexpected error");

    store.setReady(created.room.roomId, created.seat, true);
    store.setReady(created.room.roomId, joined.seat, true);
    store.start(created.room.roomId, created.seat);

    created.room.sim.p1.score = 7;
    created.room.sim.p2.score = 7;
    created.room.sim.p1.status = "dead";
    created.room.sim.p2.status = "dead";
    created.room.sim.status = "finished";

    expect(typeof (server as any).buildStateMessageV2).toBe("function");
    const state = (server as any).buildStateMessageV2(created.room);
    expect(state.v).toBe(2);
    expect(state.type).toBe("state");
    expect(state.roomId).toBe(created.room.roomId);
    expect(state.status).toBe("finished");
    expect(state.winner).toBe("draw");
    expect(state.hostPlayerId).toBe(created.room.host);
  });
});
