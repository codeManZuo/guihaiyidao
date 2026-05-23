import { FixedTimestepLoop } from "./engine/FixedTimestepLoop";
import { attachTapHalvesInput } from "./input/TapHalvesInput";
import { Renderer } from "./render/Renderer";
import { chopSinglePlayer, createSinglePlayerRuntime, tickSinglePlayer } from "./state/singlePlayer";
import { AudioBank } from "./audio/AudioBank";
import { OnlineClient } from "./net/OnlineClient";
import { createInitialFlow, reduceFlow, type FlowState } from "./ui/flow";
import { createOverlays, showHudOnline, showHudSingle, showLeaderboard, showMenu, showResult, type Overlays } from "./ui/overlays";
import { attachOverlayActions } from "./ui/actions";
import { defaultGameConfig, type GameConfig } from "./config/gameConfig";
import { loadGameConfig } from "./config/loadConfig";
import { readLeaderboard, submitScore, type LeaderboardEntry } from "./score/leaderboard";

export class GameApp {
  private overlays: Overlays;
  private renderer: Renderer;
  private loop: FixedTimestepLoop;
  private cleanupInput: (() => void) | null = null;
  private cleanupOverlays: (() => void) | null = null;
  private config: GameConfig = defaultGameConfig();
  private single = createSinglePlayerRuntime(42, this.config);
  private audio = new AudioBank();
  private vibrationEnabled = true;
  private online: OnlineClient | null = null;
  private flow: FlowState;
  private leaderboardEntries: LeaderboardEntry[] = [];
  private singleResult: { bestScore: number; isNewRecord: boolean } | null = null;

  constructor(private root: HTMLElement) {
    this.overlays = createOverlays(document);
    this.root.replaceChildren(this.overlays.root);

    this.renderer = new Renderer(this.overlays.canvas);

    this.flow = createInitialFlow({ url: window.location.href });
    if (this.flow.screen === "online") this.connectOnline();

    loadGameConfig().then((cfg) => {
      this.config = cfg;
    });

    this.loop = new FixedTimestepLoop(
      {
        update: (dtMs) => {
          if (this.flow.screen === "single") tickSinglePlayer(this.single, dtMs);
        },
        render: () => {
          if (this.flow.screen === "menu") {
            showMenu(this.overlays);
            return;
          }

          if (this.flow.screen === "leaderboard") {
            showLeaderboard(this.overlays, { entries: this.leaderboardEntries });
            return;
          }

          if (this.flow.screen === "single") {
            this.renderer.renderSingle(this.single);
            if (this.single.state.status === "dead") {
              if (!this.singleResult) {
                const r = submitScore({ score: this.single.state.score });
                this.singleResult = { bestScore: r.bestScore, isNewRecord: r.isNewRecord };
                this.leaderboardEntries = r.entries;
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
            const s = this.online?.getState();
            if (s?.type === "state") {
              this.renderer.renderOnline(s);
              const max = this.config.time.maxMs || 1;
              const p1Ratio = s.p1.timeMs <= 0 ? 0 : s.p1.timeMs / max;
              const p2Ratio = s.p2.timeMs <= 0 ? 0 : s.p2.timeMs / max;
              showHudOnline(this.overlays, {
                roomId: this.flow.roomId,
                p1: { score: s.p1.score, timeRatio01: p1Ratio, status: s.p1.status },
                p2: { score: s.p2.score, timeRatio01: p2Ratio, status: s.p2.status }
              });

              if (s.status === "finished") {
                const score = this.flow.playerId === "p2" ? s.p2.score : s.p1.score;
                showResult(this.overlays, { score });
              }
            } else {
              this.renderer.renderOnline({
                status: "lobby",
                p1: { score: 0, timeMs: 0, status: "alive", side: "left", obstacleSide: null },
                p2: { score: 0, timeMs: 0, status: "alive", side: "left", obstacleSide: null }
              });
              showHudOnline(this.overlays, {
                roomId: this.flow.roomId,
                p1: { score: 0, timeRatio01: 1, status: "alive" },
                p2: { score: 0, timeRatio01: 1, status: "alive" }
              });
            }
          }
        }
      },
      1000 / 60
    );

    const resize = () => this.renderer.resize(this.root.clientWidth, this.root.clientHeight);
    resize();
    window.addEventListener("resize", resize);

    this.cleanupOverlays = attachOverlayActions(this.overlays, {
      onSingle: () => {
        this.online?.disconnect();
        this.flow = reduceFlow(this.flow, { type: "menu.single" });
        const seed = (Math.random() * 1e9) | 0;
        loadGameConfig().then((cfg) => {
          this.config = cfg;
          this.single = createSinglePlayerRuntime(seed, this.config);
          this.singleResult = null;
        });
      },
      onOnline: ({ roomId, playerId }) => {
        const wsUrl = this.flow.screen === "online" ? this.flow.wsUrl : "ws://localhost:8787";
        this.flow = reduceFlow(this.flow, { type: "menu.online", roomId, playerId, wsUrl });
        this.connectOnline();
      },
      onLeaderboard: () => {
        this.flow = reduceFlow(this.flow, { type: "nav.leaderboard" });
        this.leaderboardEntries = readLeaderboard();
      },
      onRestart: () => {
        if (this.flow.screen === "single") {
          const seed = (Math.random() * 1e9) | 0;
          loadGameConfig().then((cfg) => {
            this.config = cfg;
            this.single = createSinglePlayerRuntime(seed, this.config);
            this.singleResult = null;
          });
          return;
        }
        if (this.flow.screen === "online") {
          this.connectOnline();
        }
      },
      onMenu: () => {
        this.online?.disconnect();
        this.flow = reduceFlow(this.flow, { type: "nav.menu" });
        this.singleResult = null;
      },
      onChopSoundStyle: (style) => {
        this.audio.setChopStyle(style);
        try {
          localStorage.setItem("audio.chopStyle", style);
        } catch {}
      },
      onChopSoundTest: () => {
        this.audio.playChop();
      }
    });

    this.cleanupInput = attachTapHalvesInput(this.overlays.canvas, (side) => {
      if (this.flow.screen === "online") {
        this.renderer.triggerOnlineChop(this.flow.playerId, side);
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
    this.online?.disconnect();
  }

  private connectOnline(): void {
    if (this.flow.screen !== "online") return;
    this.online?.disconnect();
    this.online = new OnlineClient(this.flow.wsUrl, this.flow.roomId, this.flow.playerId);
    this.online.connect();
  }
}
