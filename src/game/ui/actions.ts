import type { PlayerId } from "./flow";
import type { Overlays } from "./overlays";

export function attachOverlayActions(
  overlays: Overlays,
  handlers: {
    onSingle: () => void;
    onOnline: (params: { roomId: string; playerId: PlayerId }) => void;
    onRestart: () => void;
    onMenu: () => void;
  }
): () => void {
  const onSingle = () => handlers.onSingle();

  const onOnline = () => {
    const roomId = overlays.menuRoomInput.value.trim() || "ABCD";
    const playerId = (overlays.menuPlayerSelect.value === "p2" ? "p2" : "p1") as PlayerId;
    handlers.onOnline({ roomId, playerId });
  };

  const onRestart = () => handlers.onRestart();
  const onMenu = () => handlers.onMenu();

  overlays.menuSingleBtn.addEventListener("click", onSingle);
  overlays.menuOnlineBtn.addEventListener("click", onOnline);
  overlays.resultRestartBtn.addEventListener("click", onRestart);
  overlays.resultMenuBtn.addEventListener("click", onMenu);

  return () => {
    overlays.menuSingleBtn.removeEventListener("click", onSingle);
    overlays.menuOnlineBtn.removeEventListener("click", onOnline);
    overlays.resultRestartBtn.removeEventListener("click", onRestart);
    overlays.resultMenuBtn.removeEventListener("click", onMenu);
  };
}
