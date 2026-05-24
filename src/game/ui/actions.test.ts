import { describe, expect, it, vi } from "vitest";
import { createOverlays } from "./overlays";
import { attachOverlayActions } from "./actions";

describe("overlay actions", () => {
  it("invokes onMenu when clicking result menu button", () => {
    const overlays = createOverlays(document);
    const onMenu = vi.fn();

    const cleanup = attachOverlayActions(overlays, {
      onSingle: () => {},
      onCreateRoom: () => {},
      onJoinRoom: () => {},
      onRestart: () => {},
      onMenu
    });

    overlays.resultMenuBtn.click();
    expect(onMenu).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it("invokes onBgmVolume when scrolling bgm control", () => {
    const overlays = createOverlays(document);
    const onBgmVolume = vi.fn();

    const cleanup = attachOverlayActions(overlays, {
      onSingle: () => {},
      onCreateRoom: () => {},
      onJoinRoom: () => {},
      onRestart: () => {},
      onMenu: () => {},
      onBgmVolume
    } as any);

    overlays.menuBgmVolumeRange.value = "60";
    overlays.menuBgmVolumeRange.dispatchEvent(new Event("input", { bubbles: true }));
    expect(onBgmVolume).toHaveBeenCalledTimes(1);
    cleanup();
  });
});
