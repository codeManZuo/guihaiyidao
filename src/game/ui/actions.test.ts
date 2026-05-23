import { describe, expect, it, vi } from "vitest";
import { createOverlays } from "./overlays";
import { attachOverlayActions } from "./actions";

describe("overlay actions", () => {
  it("invokes onMenu when clicking result menu button", () => {
    const overlays = createOverlays(document);
    const onMenu = vi.fn();

    const cleanup = attachOverlayActions(overlays, {
      onSingle: () => {},
      onOnline: () => {},
      onRestart: () => {},
      onMenu
    });

    overlays.resultMenuBtn.click();
    expect(onMenu).toHaveBeenCalledTimes(1);
    cleanup();
  });
});
