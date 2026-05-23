import { describe, expect, it } from "vitest";
import { decodeMessage, encodeMessage } from "./protocol";

describe("net protocol", () => {
  it("round-trips v2 messages", () => {
    const create = {
      v: 2,
      type: "create_room"
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
});
