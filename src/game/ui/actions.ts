import type { Overlays } from "./overlays";
import type { ChopSoundStyle } from "../audio/AudioBank";
import type { Difficulty } from "../score/leaderboard";

export function attachOverlayActions(
  overlays: Overlays,
  handlers: {
    onSingle: () => void;
    onCreateRoom: (params: { roomId?: string; difficulty: Difficulty }) => void;
    onJoinRoom: (roomId: string) => void;
    onOnlineReady?: () => void;
    onOnlineStart?: () => void;
    onRestart: () => void;
    onMenu: () => void;
    onLeaderboard?: () => void;
    onLeaderboardDifficulty?: (difficulty: Difficulty) => void;
    onDifficulty?: (difficulty: Difficulty) => void;
    onChopSoundStyle?: (style: ChopSoundStyle) => void;
    onChopSoundTest?: () => void;
  }
): () => void {
  const onSingle = () => handlers.onSingle();

  const onCreateRoom = () => {
    const roomIdRaw = overlays.menuRoomInput.value.trim();
    const roomId = roomIdRaw.length > 0 ? roomIdRaw : undefined;
    const raw = overlays.menuOnlineDifficultySelect.value;
    const difficulty = (raw === "easy" || raw === "hard" ? raw : "normal") as Difficulty;
    handlers.onCreateRoom({ roomId, difficulty });
  };
  const onJoinRoom = () => handlers.onJoinRoom(overlays.menuRoomInput.value.trim());

  const onRestart = () => handlers.onRestart();
  const onMenu = () => handlers.onMenu();
  const onLeaderboard = () => handlers.onLeaderboard?.();
  const onOnlineReady = () => handlers.onOnlineReady?.();
  const onOnlineStart = () => handlers.onOnlineStart?.();

  const onLeaderboardDifficulty = (difficulty: Difficulty) => handlers.onLeaderboardDifficulty?.(difficulty);
  const onLeaderboardEasy = () => onLeaderboardDifficulty("easy");
  const onLeaderboardNormal = () => onLeaderboardDifficulty("normal");
  const onLeaderboardHard = () => onLeaderboardDifficulty("hard");

  const onDifficulty = () => {
    const raw = overlays.menuDifficultySelect.value;
    const difficulty = (raw === "easy" || raw === "hard" ? raw : "normal") as Difficulty;
    handlers.onDifficulty?.(difficulty);
  };

  const onChopSoundStyle = () => {
    const raw = overlays.menuChopSoundSelect.value;
    const style = (raw === "thud" || raw === "swish" || raw === "click" || raw === "tungtung" ? raw : "mix") as ChopSoundStyle;
    handlers.onChopSoundStyle?.(style);
  };

  const onChopSoundTest = () => handlers.onChopSoundTest?.();

  overlays.menuSingleBtn.addEventListener("click", onSingle);
  overlays.menuCreateRoomBtn.addEventListener("click", onCreateRoom);
  overlays.menuJoinRoomBtn.addEventListener("click", onJoinRoom);
  overlays.menuLeaderboardBtn.addEventListener("click", onLeaderboard);
  overlays.onlineReadyBtn.addEventListener("click", onOnlineReady);
  overlays.onlineStartBtn.addEventListener("click", onOnlineStart);
  overlays.resultRestartBtn.addEventListener("click", onRestart);
  overlays.resultMenuBtn.addEventListener("click", onMenu);
  overlays.leaderboardBackBtn.addEventListener("click", onMenu);
  overlays.leaderboardEasyBtn.addEventListener("click", onLeaderboardEasy);
  overlays.leaderboardNormalBtn.addEventListener("click", onLeaderboardNormal);
  overlays.leaderboardHardBtn.addEventListener("click", onLeaderboardHard);
  overlays.menuDifficultySelect.addEventListener("change", onDifficulty);
  overlays.menuChopSoundSelect.addEventListener("change", onChopSoundStyle);
  overlays.menuChopSoundTestBtn.addEventListener("click", onChopSoundTest);
  onDifficulty();
  onChopSoundStyle();

  return () => {
    overlays.menuSingleBtn.removeEventListener("click", onSingle);
    overlays.menuCreateRoomBtn.removeEventListener("click", onCreateRoom);
    overlays.menuJoinRoomBtn.removeEventListener("click", onJoinRoom);
    overlays.menuLeaderboardBtn.removeEventListener("click", onLeaderboard);
    overlays.onlineReadyBtn.removeEventListener("click", onOnlineReady);
    overlays.onlineStartBtn.removeEventListener("click", onOnlineStart);
    overlays.resultRestartBtn.removeEventListener("click", onRestart);
    overlays.resultMenuBtn.removeEventListener("click", onMenu);
    overlays.leaderboardBackBtn.removeEventListener("click", onMenu);
    overlays.leaderboardEasyBtn.removeEventListener("click", onLeaderboardEasy);
    overlays.leaderboardNormalBtn.removeEventListener("click", onLeaderboardNormal);
    overlays.leaderboardHardBtn.removeEventListener("click", onLeaderboardHard);
    overlays.menuDifficultySelect.removeEventListener("change", onDifficulty);
    overlays.menuChopSoundSelect.removeEventListener("change", onChopSoundStyle);
    overlays.menuChopSoundTestBtn.removeEventListener("click", onChopSoundTest);
  };
}
