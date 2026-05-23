import { FixedTimestepLoop } from "./engine/FixedTimestepLoop";
import { attachTapHalvesInput } from "./input/TapHalvesInput";
import { Renderer } from "./render/Renderer";
import { chopSinglePlayer, createSinglePlayerRuntime, tickSinglePlayer } from "./state/singlePlayer";
import { AudioBank } from "./audio/AudioBank";
import { getMatchParams } from "./net/matchmaking";
import { OnlineClient } from "./net/OnlineClient";

export class GameApp {
  private renderer: Renderer;
  private loop: FixedTimestepLoop;
  private cleanupInput: (() => void) | null = null;
  private single = createSinglePlayerRuntime(42);
  private audio = new AudioBank();
  private vibrationEnabled = true;
  private online: OnlineClient | null = null;
  private mode: "single" | "online";

  constructor(private root: HTMLElement) {
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    this.root.replaceChildren(canvas);

    this.renderer = new Renderer(canvas);

    const params = getMatchParams();
    this.mode = params.mode;
    if (this.mode === "online") {
      this.online = new OnlineClient(params.wsUrl, params.roomId, params.playerId);
      this.online.connect();
    }
    this.loop = new FixedTimestepLoop(
      {
        update: (dtMs) => {
          if (this.mode === "single") tickSinglePlayer(this.single, dtMs);
        },
        render: () => {
          if (this.mode === "single") this.renderer.renderSingle(this.single);
          if (this.mode === "online") {
            const s = this.online?.getState();
            if (s?.type === "state") this.renderer.renderOnline(s);
            else
              this.renderer.renderOnline({
                status: "lobby",
                p1: { score: 0, timeMs: 0, status: "alive", side: "left", obstacleSide: null },
                p2: { score: 0, timeMs: 0, status: "alive", side: "left", obstacleSide: null }
              });
          }
        }
      },
      1000 / 60
    );

    const resize = () => this.renderer.resize(this.root.clientWidth, this.root.clientHeight);
    resize();
    window.addEventListener("resize", resize);

    this.cleanupInput = attachTapHalvesInput(this.root, (side) => {
      if (this.mode === "online") {
        this.online?.sendInput(side);
        this.audio.playChop();
        if (this.vibrationEnabled) navigator.vibrate?.(12);
        return;
      }
      if (this.single.state.status === "dead") {
        this.single = createSinglePlayerRuntime((Math.random() * 1e9) | 0);
        return;
      }
      chopSinglePlayer(this.single, side);
      this.audio.playChop();
      if (this.vibrationEnabled) navigator.vibrate?.(12);
      const nextStatus = this.single.state.status as "alive" | "dead";
      if (nextStatus === "dead") {
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
    this.online?.disconnect();
  }
}
