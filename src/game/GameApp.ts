import { FixedTimestepLoop } from "./engine/FixedTimestepLoop";
import { attachTapHalvesInput } from "./input/TapHalvesInput";
import { Renderer } from "./render/Renderer";
import { chopSinglePlayer, createSinglePlayerRuntime, tickSinglePlayer } from "./state/singlePlayer";
import { AudioBank } from "./audio/AudioBank";

export class GameApp {
  private renderer: Renderer;
  private loop: FixedTimestepLoop;
  private cleanupInput: (() => void) | null = null;
  private single = createSinglePlayerRuntime(42);
  private audio = new AudioBank();
  private vibrationEnabled = true;

  constructor(private root: HTMLElement) {
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    this.root.replaceChildren(canvas);

    this.renderer = new Renderer(canvas);
    this.loop = new FixedTimestepLoop(
      {
        update: (dtMs) => tickSinglePlayer(this.single, dtMs),
        render: () => this.renderer.renderSingle(this.single)
      },
      1000 / 60
    );

    const resize = () => this.renderer.resize(this.root.clientWidth, this.root.clientHeight);
    resize();
    window.addEventListener("resize", resize);

    this.cleanupInput = attachTapHalvesInput(this.root, (side) => {
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
  }
}
