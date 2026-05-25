import { FixedTimestepLoop } from "./engine/FixedTimestepLoop";
import { attachTapHalvesInput } from "./input/TapHalvesInput";
import { Renderer, computeOnlinePipRect } from "./render/Renderer";
import { chopSinglePlayer, createSinglePlayerRuntime, tickSinglePlayer } from "./state/singlePlayer";
import { AudioBank } from "./audio/AudioBank";
import { OnlineClient } from "./net/OnlineClient";
import { createInitialFlow, reduceFlow, type FlowState } from "./ui/flow";
import { createOverlays, showHudOnline, showHudSingle, showLeaderboard, showMenu, showResult, type Overlays } from "./ui/overlays";
import { attachOverlayActions } from "./ui/actions";
import { defaultGameConfig, type GameConfig } from "./config/gameConfig";
import { loadGameConfig } from "./config/loadConfig";
import { readLeaderboard, submitScore, type Difficulty, type LeaderboardEntry } from "./score/leaderboard";
import type { Side } from "./state/types";

export class GameApp {
  private overlays: Overlays;
  private renderer: Renderer;
  private loop: FixedTimestepLoop;
  private cleanupInput: (() => void) | null = null;
  private cleanupOverlays: (() => void) | null = null;
  private cleanupResize: (() => void) | null = null;
  private config: GameConfig = defaultGameConfig();
  private single = createSinglePlayerRuntime(42, this.config);
  private audio = new AudioBank();
  private vibrationEnabled = true;
  private online: OnlineClient | null = null;
  private flow: FlowState;
  private onlineMySidePrediction: { side: Side; untilPerfMs: number } | null = null;
  private onlineFocus: "me" | "other" = "me";
  private leaderboardEntries: LeaderboardEntry[] = [];
  private singleResult: { bestScore: number; isNewRecord: boolean } | null = null;
  private difficulty: Difficulty = "normal";
  private leaderboardDifficulty: Difficulty = "normal";

  constructor(private root: HTMLElement) {
    this.overlays = createOverlays(document);
    this.root.replaceChildren(this.overlays.root);

    this.renderer = new Renderer(this.overlays.canvas);

    try {
      const raw = localStorage.getItem("game.difficulty");
      if (raw === "easy" || raw === "hard" || raw === "normal") this.difficulty = raw;
    } catch {}

    try {
      const raw = localStorage.getItem("audio.bgmVolume");
      const v = raw ? Number(raw) : NaN;
      if (Number.isFinite(v)) this.audio.setBgmVolume(Math.max(0, Math.min(1, v)));
    } catch {}

    try {
      const raw = localStorage.getItem("audio.muted");
      if (raw === "1") this.audio.setMuted(true);
    } catch {}

    this.overlays.muteBtn.classList.toggle("is-muted", this.audio.isMuted());
    this.overlays.muteBtn.setAttribute("aria-pressed", this.audio.isMuted() ? "true" : "false");

    this.flow = createInitialFlow({ url: window.location.href });

    loadGameConfig().then((cfg) => {
      this.config = cfg;
    });

    this.loop = new FixedTimestepLoop(
      {
        update: (dtMs) => {
          if (this.flow.screen === "single") tickSinglePlayer(this.single, dtMs);
        },
        render: () => {
          const bgmMode = this.flow.screen === "menu" || this.flow.screen === "leaderboard" ? "menu" : "game";
          this.audio.setBgmMode(bgmMode);
          this.overlays.menuTitleRow.classList.toggle("is-vu-on", this.flow.screen === "menu" && !this.audio.isMuted());
          this.overlays.muteBtn.classList.toggle("is-muted", this.audio.isMuted());
          this.overlays.muteBtn.setAttribute("aria-pressed", this.audio.isMuted() ? "true" : "false");

          if (this.flow.screen === "menu") {
            const page = this.flow.page;
            const joined = this.online?.getJoined();
            if ((page === "create" || page === "join") && joined) {
              this.flow = reduceFlow(this.flow, { type: "menu.online" });
              return;
            }

            const createError = page === "create" ? this.online?.getError()?.message ?? null : null;
            const joinError = page === "join" ? this.online?.getError()?.message ?? null : null;
            const joinPrefix = this.overlays.menuJoinRoomInput.value.trim();
            const list = page === "join" ? this.online?.getRoomsList() : null;
            const suggestions = page === "join" && list && list.prefix === joinPrefix ? list.roomIds : [];

            showMenu(this.overlays, {
              page,
              create: { error: createError },
              join: { suggestions, error: joinError }
            });
            return;
          }

          if (this.flow.screen === "leaderboard") {
            showLeaderboard(this.overlays, { difficulty: this.leaderboardDifficulty, entries: this.leaderboardEntries });
            return;
          }

          if (this.flow.screen === "single") {
            this.renderer.renderSingle(this.single);
            if (this.single.state.status === "dead") {
              if (!this.singleResult) {
                const r = submitScore({ difficulty: this.difficulty, score: this.single.state.score });
                this.singleResult = { bestScore: r.bestScore, isNewRecord: r.isNewRecord };
                this.leaderboardEntries = r.entries;
                this.leaderboardDifficulty = this.difficulty;
              }
              showResult(this.overlays, {
                score: this.single.state.score,
                bestScore: this.singleResult.bestScore,
                isNewRecord: this.singleResult.isNewRecord
              });
            } else {
              showHudSingle(this.overlays, {
                score: this.single.state.score,
                timeRatio01: this.single.state.timeMs / this.single.state.config.maxTimeMs
              });
            }
            return;
          }

          if (this.flow.screen === "online") {
            const pipRect = computeOnlinePipRect(
              Math.max(1, this.overlays.canvas.clientWidth),
              Math.max(1, this.overlays.canvas.clientHeight)
            );
            this.overlays.onlinePipToggleBtn.style.left = `${pipRect.x}px`;
            this.overlays.onlinePipToggleBtn.style.top = `${pipRect.y}px`;
            this.overlays.onlinePipToggleBtn.style.width = `${pipRect.w}px`;
            this.overlays.onlinePipToggleBtn.style.height = `${pipRect.h}px`;

            const s = this.online?.getState();
            if (s) {
              const joined = this.online?.getJoined();
              const me = joined?.playerId ?? null;
              const left = me === "p1" ? s.p2 : s.p1;
              const right = me === "p1" ? s.p1 : s.p2;
              const nowPerfMs = performance.now();
              if (this.onlineMySidePrediction && nowPerfMs > this.onlineMySidePrediction.untilPerfMs) this.onlineMySidePrediction = null;
              if (s.status !== "playing") this.onlineMySidePrediction = null;
              const meView = me === "p1" ? s.p1 : me === "p2" ? s.p2 : null;
              if (me && meView?.status === "dead") this.onlineMySidePrediction = null;
              const predictedMySide = me ? this.onlineMySidePrediction?.side ?? null : null;
              if (me && predictedMySide && meView?.side === predictedMySide) this.onlineMySidePrediction = null;
              const p1ForRender = me === "p1" && predictedMySide ? { ...s.p1, side: predictedMySide } : s.p1;
              const p2ForRender = me === "p2" && predictedMySide ? { ...s.p2, side: predictedMySide } : s.p2;
              this.renderer.renderOnline({ status: s.status, p1: p1ForRender, p2: p2ForRender, meSeat: me, focus: this.onlineFocus });
              const max = this.config.time.maxMs || 1;
              const leftRatio = left.timeMs <= 0 ? 0 : left.timeMs / max;
              const rightRatio = right.timeMs <= 0 ? 0 : right.timeMs / max;
              const isHost = joined?.isHost === true;
              const meReady = me === "p1" ? s.p1.ready : me === "p2" ? s.p2.ready : false;
              const other = me === "p1" ? s.p2 : me === "p2" ? s.p1 : null;
              const otherStatus = !other ? "未加入" : !other.present ? "未加入" : !other.online ? "离线" : other.ready ? "已准备" : "未准备";
              const otherLabel = `对方 ${otherStatus}`;
              const error = this.online?.getError()?.message ?? null;
              const canStart =
                s.status === "lobby" &&
                isHost &&
                s.p1.present &&
                s.p2.present &&
                s.p1.online &&
                s.p2.online &&
                s.p1.ready &&
                s.p2.ready;
              const canReady = s.status === "lobby" && !!me && !meReady;
              showHudOnline(this.overlays, {
                roomId: s.roomId,
                left: { score: left.score, timeRatio01: leftRatio, status: left.status },
                right: { score: right.score, timeRatio01: rightRatio, status: right.status },
                lobby: {
                  meLabel: me ? `我${isHost ? "（房主）" : ""}${meReady ? " 已准备" : ""}` : "--",
                  otherLabel,
                  error,
                  readyEnabled: canReady,
                  readyText: meReady ? "已准备" : "准备",
                  startEnabled: canStart,
                  startText: isHost ? "开始" : "等待"
                }
              });

              if (s.status === "finished") {
                const score = me === "p1" ? s.p1.score : me === "p2" ? s.p2.score : 0;
                const title = s.winner === "draw" ? "平局" : me && s.winner === me ? "胜利" : "失败";
                const subtitle = me ? `我 ${right.score} vs 对方 ${left.score}` : `玩家1 ${s.p1.score} vs 玩家2 ${s.p2.score}`;
                showResult(this.overlays, { score, title, subtitle });
              }
            } else {
              this.renderer.renderOnline({
                status: "lobby",
                p1: { score: 0, timeMs: 0, status: "alive", side: "left", obstacleSide: null },
                p2: { score: 0, timeMs: 0, status: "alive", side: "left", obstacleSide: null },
                meSeat: this.online?.getJoined()?.playerId ?? null,
                focus: this.onlineFocus
              });
              const roomId = this.online?.getJoined()?.roomId ?? "";
              showHudOnline(this.overlays, {
                roomId,
                left: { score: 0, timeRatio01: 1, status: "alive" },
                right: { score: 0, timeRatio01: 1, status: "alive" },
                lobby: {
                  meLabel: "--",
                  otherLabel: "对方 未加入",
                  error: this.online?.getError()?.message ?? null,
                  readyEnabled: false,
                  readyText: "准备",
                  startEnabled: false,
                  startText: "开始"
                }
              });
            }
          }
        }
      },
      1000 / 60
    );

    const resize = () => {
      const w = this.overlays.root.clientWidth || this.root.clientWidth;
      const h = this.overlays.root.clientHeight || this.root.clientHeight;
      this.renderer.resize(w, h);
    };
    resize();
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    ro?.observe(this.overlays.root);
    this.cleanupResize = () => {
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("scroll", resize);
      ro?.disconnect();
    };

    this.cleanupOverlays = attachOverlayActions(this.overlays, {
      onUserInteract: () => this.audio.unlockBgm(),
      onToggleMute: (muted) => {
        this.audio.setMuted(muted);
        try {
          localStorage.setItem("audio.muted", muted ? "1" : "0");
        } catch {}
      },
      onSingle: () => {
        this.online?.disconnect();
        this.online = null;
        this.onlineFocus = "me";
        this.flow = reduceFlow(this.flow, { type: "menu.single" });
        const seed = (Math.random() * 1e9) | 0;
        loadGameConfig().then((cfg) => {
          this.config = applyDifficulty(cfg, this.difficulty);
          this.single = createSinglePlayerRuntime(seed, this.config);
          this.singleResult = null;
        });
      },
      onOpenCreate: () => {
        this.online?.clearError();
        this.onlineFocus = "me";
        this.flow = reduceFlow(this.flow, { type: "menu.create" });
        this.overlays.menuCreateRoomInput.focus();
      },
      onOpenJoin: () => {
        this.online?.disconnect();
        this.online = new OnlineClient({ url: this.wsUrl() });
        this.online.connect();
        this.online.clearError();
        this.onlineFocus = "me";
        this.flow = reduceFlow(this.flow, { type: "menu.join" });
        this.overlays.menuJoinRoomInput.focus();
      },
      onCreateRoomConfirm: (params) => {
        this.online?.disconnect();
        this.online = new OnlineClient({ url: this.wsUrl() });
        this.online.connect();
        this.online.clearError();
        this.onlineFocus = "me";
        try {
          localStorage.setItem("game.onlineDifficulty", params.difficulty);
        } catch {}
        this.online?.createRoom(params);
      },
      onJoinRoomConfirm: (roomId) => {
        this.online?.disconnect();
        this.online = new OnlineClient({ url: this.wsUrl() });
        this.online.connect();
        this.online.clearError();
        this.onlineFocus = "me";
        this.online?.joinRoom(roomId);
      },
      onQueryRooms: (prefix) => {
        if (!this.online) {
          this.online = new OnlineClient({ url: this.wsUrl() });
          this.online.connect();
        }
        this.online.clearError();
        this.online.queryRooms(prefix);
      },
      onOnlineReady: () => {
        this.online?.setReady();
      },
      onOnlineStart: () => {
        this.online?.start();
      },
      onLeaderboard: () => {
        this.flow = reduceFlow(this.flow, { type: "nav.leaderboard" });
        this.leaderboardDifficulty = this.difficulty;
        this.leaderboardEntries = readLeaderboard(this.leaderboardDifficulty);
      },
      onLeaderboardDifficulty: (difficulty: Difficulty) => {
        this.leaderboardDifficulty = difficulty;
        this.leaderboardEntries = readLeaderboard(difficulty);
      },
      onRestart: () => {
        if (this.flow.screen === "single") {
          const seed = (Math.random() * 1e9) | 0;
          loadGameConfig().then((cfg) => {
            this.config = applyDifficulty(cfg, this.difficulty);
            this.single = createSinglePlayerRuntime(seed, this.config);
            this.singleResult = null;
          });
          return;
        }
        if (this.flow.screen === "online") this.flow = reduceFlow(this.flow, { type: "nav.menu" });
      },
      onMenu: () => {
        this.online?.disconnect();
        this.online = null;
        this.onlineFocus = "me";
        this.flow = reduceFlow(this.flow, { type: "nav.menu" });
        this.singleResult = null;
      },
      onToggleOnlineFocus: () => {
        this.onlineFocus = this.onlineFocus === "me" ? "other" : "me";
      },
      onDifficulty: (difficulty) => {
        this.difficulty = difficulty;
        try {
          localStorage.setItem("game.difficulty", difficulty);
        } catch {}
        if (this.flow.screen === "leaderboard") {
          this.leaderboardDifficulty = difficulty;
          this.leaderboardEntries = readLeaderboard(difficulty);
        }
      },
      onChopSoundStyle: (style) => {
        this.audio.setChopStyle(style);
        try {
          localStorage.setItem("audio.chopStyle", style);
        } catch {}
      },
      onChopSoundTest: () => {
        this.audio.playChop();
      },
      onBgmVolume: (volume01) => {
        this.audio.setBgmVolume(volume01);
        try {
          localStorage.setItem("audio.bgmVolume", String(volume01));
        } catch {}
      }
    });

    this.cleanupInput = attachTapHalvesInput(this.overlays.canvas, (side) => {
      this.audio.unlockBgm();
      if (this.flow.screen === "online") {
        const state = this.online?.getState();
        if (state?.status !== "playing") return;
        const me = this.online?.getJoined()?.playerId;
        if (!me) return;
        const meView = me === "p1" ? state.p1 : state.p2;
        if (meView.status === "dead") return;
        this.onlineMySidePrediction = { side, untilPerfMs: performance.now() + 800 };
        this.renderer.triggerOnlineChop("p2", side);
        this.online?.sendInput(side);
        this.audio.playChop();
        if (this.vibrationEnabled) navigator.vibrate?.(12);
        return;
      }
      if (this.flow.screen !== "single") return;

      if (this.single.state.status === "dead") return;

      this.renderer.triggerSingleChop(side);
      chopSinglePlayer(this.single, side);
      this.audio.playChop();
      if (this.vibrationEnabled) navigator.vibrate?.(12);
      const status = this.single.state.status as "alive" | "dead";
      if (status === "dead") {
        this.audio.playFail();
        if (this.vibrationEnabled) navigator.vibrate?.([20, 30, 30]);
      }
    });
  }

  start(): void {
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
    this.cleanupInput?.();
    this.cleanupOverlays?.();
    this.cleanupResize?.();
    this.online?.disconnect();
    this.audio.stopBgm();
  }

  private connectOnline(): void {
    if (!this.online) {
      this.online = new OnlineClient({ url: this.wsUrl() });
      this.online.connect();
    }
  }

  private wsUrl(): string {
    if (window.location.protocol === "https:") {
      return `wss://${window.location.host}/ws`;
    }
    return `ws://${window.location.hostname}:8787`;
  }
}

function applyDifficulty(cfg: GameConfig, difficulty: Difficulty): GameConfig {
  const decayScale = difficulty === "easy" ? 1.2 : difficulty === "hard" ? 2.5 : 2;
  return { ...cfg, time: { ...cfg.time, decayScale } };
}
