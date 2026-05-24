import { describe, expect, it, vi } from "vitest";
import { createOverlays } from "./overlays";
import { attachOverlayActions } from "./actions";

describe("overlay actions", () => {
  it("invokes onMenu when clicking result menu button", () => {
    const overlays = createOverlays(document);
    const onMenu = vi.fn();

    const cleanup = attachOverlayActions(overlays, {
      onSingle: () => {},
      onOpenCreate: () => {},
      onOpenJoin: () => {},
      onCreateRoomConfirm: () => {},
      onJoinRoomConfirm: () => {},
      onRestart: () => {},
      onMenu
    });

    overlays.resultMenuBtn.click();
    expect(onMenu).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it("invokes create/join navigation and confirm actions", () => {
    const overlays = createOverlays(document);
    const onOpenCreate = vi.fn();
    const onOpenJoin = vi.fn();
    const onCreateRoomConfirm = vi.fn();
    const onJoinRoomConfirm = vi.fn();

    const cleanup = attachOverlayActions(overlays, {
      onSingle: () => {},
      onOpenCreate,
      onOpenJoin,
      onCreateRoomConfirm,
      onJoinRoomConfirm,
      onRestart: () => {},
      onMenu: () => {}
    } as any);

    overlays.menuCreateRoomBtn.click();
    expect(onOpenCreate).toHaveBeenCalledTimes(1);

    overlays.menuJoinRoomBtn.click();
    expect(onOpenJoin).toHaveBeenCalledTimes(1);

    overlays.menuCreateRoomInput.value = "1234";
    overlays.menuCreateDifficultySelect.value = "hard";
    overlays.menuCreateConfirmBtn.click();
    expect(onCreateRoomConfirm).toHaveBeenCalledWith({ roomId: "1234", difficulty: "hard" });

    overlays.menuJoinRoomInput.value = "1299";
    overlays.menuJoinConfirmBtn.click();
    expect(onJoinRoomConfirm).toHaveBeenCalledWith("1299");

    cleanup();
  });

  it("invokes onBgmVolume when scrolling bgm control", () => {
    const overlays = createOverlays(document);
    const onBgmVolume = vi.fn();

    const cleanup = attachOverlayActions(overlays, {
      onSingle: () => {},
      onOpenCreate: () => {},
      onOpenJoin: () => {},
      onCreateRoomConfirm: () => {},
      onJoinRoomConfirm: () => {},
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
