export class AudioBank {
  private ctx: AudioContext | null = null;
  muted = false;

  private ensure(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  playChop(): void {
    if (this.muted) return;
    const ctx = this.ensure();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = 220;
    g.gain.value = 0.08;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.05);
  }

  playFail(): void {
    if (this.muted) return;
    const ctx = this.ensure();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = 110;
    g.gain.value = 0.1;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.12);
    o.stop(ctx.currentTime + 0.14);
  }
}
