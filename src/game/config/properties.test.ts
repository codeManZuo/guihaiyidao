import { describe, expect, it } from "vitest";
import { parseProperties } from "./properties";

describe("parseProperties", () => {
  it("parses key=value and ignores comments/blank lines", () => {
    const text = `
# comment
time.startMs=7000

obstacle.avoidSameSide=true
`;
    const map = parseProperties(text);
    expect(map["time.startMs"]).toBe("7000");
    expect(map["obstacle.avoidSameSide"]).toBe("true");
  });

  it("trims whitespace around keys and values", () => {
    const text = `  a.b   =   1  `;
    const map = parseProperties(text);
    expect(map["a.b"]).toBe("1");
  });
});
