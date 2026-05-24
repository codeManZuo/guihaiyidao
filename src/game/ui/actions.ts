import type { Overlays } from "./overlays";
import type { ChopSoundStyle } from "../audio/AudioBank";
import type { Difficulty } from "../score/leaderboard";

export function attachOverlayActions(
  overlays: Overlays,
  handlers: {
    onUserInteract?: () => void;
    onToggleMute?: (muted: boolean) => void;
    onSingle: () => void;
    onOpenCreate?: () => void;
    onOpenJoin?: () => void;
    onCreateRoomConfirm?: (params: { roomId?: string; difficulty: Difficulty }) => void;
    onJoinRoomConfirm?: (roomId: string) => void;
    onQueryRooms?: (prefix: string) => void;
    onOnlineReady?: () => void;
    onOnlineStart?: () => void;
    onRestart: () => void;
    onMenu: () => void;
    onLeaderboard?: () => void;
    onLeaderboardDifficulty?: (difficulty: Difficulty) => void;
    onDifficulty?: (difficulty: Difficulty) => void;
    onChopSoundStyle?: (style: ChopSoundStyle) => void;
    onChopSoundTest?: () => void;
    onBgmVolume?: (volume01: number) => void;
  }
): () => void {
  const onUserInteract = () => handlers.onUserInteract?.();
  const stopPointer = (e: Event) => {
    if ("stopPropagation" in e) (e as any).stopPropagation();
  };
  const onSingle = () => {
    onUserInteract();
    handlers.onSingle();
  };

  const sanitizeRoomId = (raw: string): string => raw.replace(/[^0-9]/g, "").slice(0, 4);

  const generateRoomId = (): string => String(Math.floor(Math.random() * 10_000)).padStart(4, "0");

  const onOpenCreate = () => {
    onUserInteract();
    overlays.menuCreateRoomInput.value = generateRoomId();
    handlers.onOpenCreate?.();
  };
  const onOpenJoin = () => {
    onUserInteract();
    overlays.menuJoinRoomInput.value = "";
    handlers.onOpenJoin?.();
  };

  const onCreateConfirm = () => {
    onUserInteract();
    const roomIdRaw = sanitizeRoomId(overlays.menuCreateRoomInput.value.trim());
    const roomId = roomIdRaw.length > 0 ? roomIdRaw : undefined;
    const raw = overlays.menuCreateDifficultySelect.value;
    const difficulty = (raw === "easy" || raw === "hard" ? raw : "normal") as Difficulty;
    handlers.onCreateRoomConfirm?.({ roomId, difficulty });
  };

  const onJoinConfirm = () => {
    onUserInteract();
    handlers.onJoinRoomConfirm?.(sanitizeRoomId(overlays.menuJoinRoomInput.value.trim()));
  };

  let roomQueryTimer: number | null = null;
  let lastRoomQueryPrefix = "";
  const onJoinRoomInput = () => {
    const next = sanitizeRoomId(overlays.menuJoinRoomInput.value);
    if (overlays.menuJoinRoomInput.value !== next) overlays.menuJoinRoomInput.value = next;
    if (roomQueryTimer !== null) {
      window.clearTimeout(roomQueryTimer);
      roomQueryTimer = null;
    }
    const prefix = next;
    if (prefix.length === 0) return;
    if (prefix === lastRoomQueryPrefix) return;
    roomQueryTimer = window.setTimeout(() => {
      roomQueryTimer = null;
      lastRoomQueryPrefix = prefix;
      handlers.onQueryRooms?.(prefix);
    }, 120);
  };

  const onCreateRoomInput = () => {
    const next = sanitizeRoomId(overlays.menuCreateRoomInput.value);
    if (overlays.menuCreateRoomInput.value !== next) overlays.menuCreateRoomInput.value = next;
  };

  const onJoinSuggestionClick = (e: Event) => {
    const t = e.target as HTMLElement | null;
    const btn = t && "closest" in t ? (t.closest("button") as HTMLButtonElement | null) : null;
    const roomId = btn?.dataset?.roomid;
    if (!roomId) return;
    overlays.menuJoinRoomInput.value = roomId;
    overlays.menuJoinRoomInput.focus();
  };

  const onRestart = () => {
    onUserInteract();
    handlers.onRestart();
  };
  const onMenu = () => {
    onUserInteract();
    handlers.onMenu();
  };
  const onLeaderboard = () => {
    onUserInteract();
    handlers.onLeaderboard?.();
  };
  const onOnlineReady = () => {
    onUserInteract();
    handlers.onOnlineReady?.();
  };
  const onOnlineStart = () => {
    onUserInteract();
    handlers.onOnlineStart?.();
  };

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

  const onChopSoundTest = () => {
    onUserInteract();
    handlers.onChopSoundTest?.();
  };

  const onBgmInput = () => {
    onUserInteract();
    const raw = Number(overlays.menuBgmVolumeRange.value);
    const pct = Number.isFinite(raw) ? raw : 50;
    const next = Math.max(0, Math.min(1, pct / 100));
    handlers.onBgmVolume?.(next);
  };

  const onToggleMute = () => {
    onUserInteract();
    const currentMuted = overlays.muteBtn.classList.contains("is-muted");
    const nextMuted = !currentMuted;
    overlays.muteBtn.classList.toggle("is-muted", nextMuted);
    overlays.muteBtn.setAttribute("aria-pressed", nextMuted ? "true" : "false");
    handlers.onToggleMute?.(nextMuted);
  };

  overlays.menuSingleBtn.addEventListener("click", onSingle);
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
  overlays.menuBgmVolumeRange.addEventListener("pointerdown", stopPointer as any);
  overlays.menuBgmVolumeRange.addEventListener("input", onBgmInput);
  overlays.muteBtn.addEventListener("pointerdown", stopPointer as any);
  overlays.muteBtn.addEventListener("click", onToggleMute);
  overlays.menuCreateRoomBtn.addEventListener("click", onOpenCreate);
  overlays.menuJoinRoomBtn.addEventListener("click", onOpenJoin);
  overlays.menuCreateConfirmBtn.addEventListener("click", onCreateConfirm);
  overlays.menuJoinConfirmBtn.addEventListener("click", onJoinConfirm);
  overlays.menuCreateBackBtn.addEventListener("click", onMenu);
  overlays.menuJoinBackBtn.addEventListener("click", onMenu);
  overlays.menuCreateRoomInput.addEventListener("input", onCreateRoomInput);
  overlays.menuJoinRoomInput.addEventListener("input", onJoinRoomInput);
  overlays.menuJoinSuggestions.addEventListener("click", onJoinSuggestionClick);
  onDifficulty();
  onChopSoundStyle();

  return () => {
    overlays.menuSingleBtn.removeEventListener("click", onSingle);
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
    overlays.menuBgmVolumeRange.removeEventListener("pointerdown", stopPointer as any);
    overlays.menuBgmVolumeRange.removeEventListener("input", onBgmInput);
    overlays.muteBtn.removeEventListener("pointerdown", stopPointer as any);
    overlays.muteBtn.removeEventListener("click", onToggleMute);
    overlays.menuCreateRoomBtn.removeEventListener("click", onOpenCreate);
    overlays.menuJoinRoomBtn.removeEventListener("click", onOpenJoin);
    overlays.menuCreateConfirmBtn.removeEventListener("click", onCreateConfirm);
    overlays.menuJoinConfirmBtn.removeEventListener("click", onJoinConfirm);
    overlays.menuCreateBackBtn.removeEventListener("click", onMenu);
    overlays.menuJoinBackBtn.removeEventListener("click", onMenu);
    overlays.menuCreateRoomInput.removeEventListener("input", onCreateRoomInput);
    overlays.menuJoinRoomInput.removeEventListener("input", onJoinRoomInput);
    overlays.menuJoinSuggestions.removeEventListener("click", onJoinSuggestionClick);
  };
}
