import { describe, expect, it } from "vitest";
import { decodeMessage, encodeMessage } from "./protocol";

describe("net protocol", () => {
  it("round-trips v2 messages", () => {
    const create = {
      v: 2,
      type: "create_room",
      roomId: "1234",
      difficulty: "normal"
    } as const;
    expect(decodeMessage(encodeMessage(create))).toEqual(create);

    const msg = {
      v: 2,
      type: "input",
      roomId: "1234",
      seq: 10,
      side: "left",
      clientTimeMs: 1234
    } as const;

    const raw = encodeMessage(msg);
    const parsed = decodeMessage(raw);
    expect(parsed).toEqual(msg);
  });

  it("round-trips v2 state with difficulty and upcoming queues", () => {
    const msg = {
      v: 2,
      type: "state",
      roomId: "1234",
      serverTimeMs: 1,
      status: "lobby",
      hostPlayerId: "p1",
      difficulty: "hard",
      p1: {
        present: true,
        online: true,
        ready: false,
        score: 0,
        timeMs: 7000,
        status: "alive",
        side: "left",
        obstacleSide: null,
        upcomingObstacles: [null, "left"],
        upcomingObstacleStyles: [0, 1]
      },
      p2: {
        present: false,
        online: false,
        ready: false,
        score: 0,
        timeMs: 7000,
        status: "alive",
        side: "left",
        obstacleSide: null,
        upcomingObstacles: [null, "right"],
        upcomingObstacleStyles: [2, 3]
      },
      winner: null
    } as const;

    expect(decodeMessage(encodeMessage(msg))).toEqual(msg);
  });

  it("round-trips v2 error ROOM_EXISTS", () => {
    const msg = { v: 2, type: "error", code: "ROOM_EXISTS", message: "x" } as const;
    expect(decodeMessage(encodeMessage(msg))).toEqual(msg);
  });
});
