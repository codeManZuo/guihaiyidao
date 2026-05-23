import { describe, expect, it } from "vitest";
import { decodeMessage, encodeMessage } from "./protocol";

describe("net protocol", () => {
  it("round-trips input message", () => {
    const msg = {
      v: 1,
      type: "input",
      roomId: "ABCD",
      playerId: "p1",
      seq: 10,
      side: "left",
      clientTimeMs: 1234
    } as const;

    const raw = encodeMessage(msg);
    const parsed = decodeMessage(raw);
    expect(parsed).toEqual(msg);
  });
});
