import type { PlayerId } from "./flow";
import type { Overlays } from "./overlays";
import type { ChopSoundStyle } from "../audio/AudioBank";

export function attachOverlayActions(
  overlays: Overlays,
  handlers: {
    onSingle: () => void;
    onOnline: (params: { roomId: string; playerId: PlayerId }) => void;
    onRestart: () => void;
    onMenu: () => void;
    onLeaderboard?: () => void;
    onChopSoundStyle?: (style: ChopSoundStyle) => void;
    onChopSoundTest?: () => void;
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
  const onLeaderboard = () => handlers.onLeaderboard?.();

  const onChopSoundStyle = () => {
    const raw = overlays.menuChopSoundSelect.value;
    const style = (raw === "thud" || raw === "swish" || raw === "click" || raw === "tungtung" ? raw : "mix") as ChopSoundStyle;
    handlers.onChopSoundStyle?.(style);
  };

  const onChopSoundTest = () => handlers.onChopSoundTest?.();

  overlays.menuSingleBtn.addEventListener("click", onSingle);
  overlays.menuOnlineBtn.addEventListener("click", onOnline);
  overlays.menuLeaderboardBtn.addEventListener("click", onLeaderboard);
  overlays.resultRestartBtn.addEventListener("click", onRestart);
  overlays.resultMenuBtn.addEventListener("click", onMenu);
  overlays.leaderboardBackBtn.addEventListener("click", onMenu);
  overlays.menuChopSoundSelect.addEventListener("change", onChopSoundStyle);
  overlays.menuChopSoundTestBtn.addEventListener("click", onChopSoundTest);
  onChopSoundStyle();

  return () => {
    overlays.menuSingleBtn.removeEventListener("click", onSingle);
    overlays.menuOnlineBtn.removeEventListener("click", onOnline);
    overlays.menuLeaderboardBtn.removeEventListener("click", onLeaderboard);
    overlays.resultRestartBtn.removeEventListener("click", onRestart);
    overlays.resultMenuBtn.removeEventListener("click", onMenu);
    overlays.leaderboardBackBtn.removeEventListener("click", onMenu);
    overlays.menuChopSoundSelect.removeEventListener("change", onChopSoundStyle);
    overlays.menuChopSoundTestBtn.removeEventListener("click", onChopSoundTest);
  };
}
