export class AudioBank {
  private ctx: AudioContext | null = null;
  muted = false;
  chopStyle: ChopSoundStyle = "mix";
  private tungtungPool: HTMLAudioElement[] = [];
  private tungtungPoolIdx = 0;
  private tungtungBuffer: AudioBuffer | null = null;
  private tungtungLoading: Promise<void> | null = null;

  private bgmUnlocked = false;
  private bgmVolume01 = 0.5;
  private bgmMode: BgmMode = "menu";
  private bgmMenu: HTMLAudioElement | null = null;
  private bgmGame: HTMLAudioElement | null = null;
  private bgmPlaying: BgmMode | null = null;

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopBgm();
      return;
    }
    if (this.bgmUnlocked) this.playBgm(this.bgmMode);
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof AudioContext === "undefined") return null;
    this.ctx = new AudioContext();
    try {
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {}
    return this.ctx;
  }

  setBgmVolume(volume01: number): void {
    const v = Math.max(0, Math.min(1, volume01));
    this.bgmVolume01 = v;
    if (this.bgmMenu) this.bgmMenu.volume = v;
    if (this.bgmGame) this.bgmGame.volume = v;
  }

  setBgmMode(mode: BgmMode): void {
    this.bgmMode = mode;
    if (!this.bgmUnlocked) return;
    if (this.muted) return;
    this.playBgm(mode);
  }

  unlockBgm(): void {
    if (this.bgmUnlocked) return;
    this.bgmUnlocked = true;
    if (this.muted) return;
    this.playBgm(this.bgmMode);
  }

  stopBgm(): void {
    this.bgmMenu?.pause();
    this.bgmGame?.pause();
    this.bgmPlaying = null;
  }

  setChopStyle(style: ChopSoundStyle): void {
    this.chopStyle = style;
    if (style === "tungtung") void this.preloadTungtung();
  }

  playChop(): void {
    if (this.muted) return;
    if (this.chopStyle === "tungtung") {
      const ctx = this.ensureContext();
      if (ctx) {
        if (this.playTungtungViaContext(ctx)) return;
        void this.preloadTungtung();
        playMixChop(ctx);
        return;
      }
      if (this.playTungtungChop()) return;
    }

    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.chopStyle === "thud") {
      playThudChop(ctx);
      return;
    }
    if (this.chopStyle === "swish") {
      playSwishChop(ctx);
      return;
    }
    if (this.chopStyle === "click") {
      playClickChop(ctx);
      return;
    }
    playMixChop(ctx);
  }

  playFail(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
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

  private playTungtungChop(): boolean {
    if (typeof Audio === "undefined") return false;
    if (this.tungtungPool.length === 0) {
      for (let i = 0; i < 4; i += 1) {
        const a = new Audio("/assets/audio/chop/tungtung.mp3");
        a.preload = "auto";
        this.tungtungPool.push(a);
      }
    }

    const a = this.tungtungPool[this.tungtungPoolIdx % this.tungtungPool.length];
    this.tungtungPoolIdx += 1;
    try {
      a.currentTime = 0;
    } catch {}
    try {
      void a.play();
    } catch {}
    return true;
  }

  private playTungtungViaContext(ctx: AudioContext): boolean {
    if (!this.tungtungBuffer) return false;
    const src = ctx.createBufferSource();
    src.buffer = this.tungtungBuffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.75, ctx.currentTime);
    src.connect(g).connect(ctx.destination);
    src.start(ctx.currentTime);
    return true;
  }

  private playBgm(mode: BgmMode): void {
    if (this.muted) return;
    if (typeof Audio === "undefined") return;
    if (!this.bgmMenu) {
      const a = new Audio("/assets/audio/bgm/sound_menu_background.mp3");
      a.loop = true;
      a.preload = "auto";
      a.volume = this.bgmVolume01;
      this.bgmMenu = a;
    }
    if (!this.bgmGame) {
      const a = new Audio("/assets/audio/bgm/sound_game_background.mp3");
      a.loop = true;
      a.preload = "auto";
      a.volume = this.bgmVolume01;
      this.bgmGame = a;
    }

    if (this.bgmPlaying === mode) return;
    const menu = this.bgmMenu;
    const game = this.bgmGame;
    if (!menu || !game) return;

    if (mode === "menu") {
      game.pause();
      try {
        game.currentTime = 0;
      } catch {}
      try {
        menu.currentTime = 0;
      } catch {}
      try {
        const p = menu.play();
        if (p && typeof (p as any).catch === "function") void (p as any).catch(() => {});
      } catch {}
      this.bgmPlaying = "menu";
      return;
    }

    menu.pause();
    try {
      menu.currentTime = 0;
    } catch {}
    try {
      game.currentTime = 0;
    } catch {}
    try {
      const p = game.play();
      if (p && typeof (p as any).catch === "function") void (p as any).catch(() => {});
    } catch {}
    this.bgmPlaying = "game";
  }

  private async preloadTungtung(): Promise<void> {
    if (this.tungtungBuffer) return;
    if (this.tungtungLoading) return this.tungtungLoading;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (typeof fetch === "undefined") return;

    this.tungtungLoading = (async () => {
      try {
        const res = await fetch("/assets/audio/chop/tungtung.mp3", { cache: "force-cache" });
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        const audioBuf = await decodeAudioBuffer(ctx, buf);
        this.tungtungBuffer = audioBuf;
      } finally {
        this.tungtungLoading = null;
      }
    })();

    return this.tungtungLoading;
  }
}

export type ChopSoundStyle = "mix" | "thud" | "swish" | "click" | "tungtung";
export type BgmMode = "menu" | "game";

async function decodeAudioBuffer(ctx: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  const out = ctx.decodeAudioData(data);
  if (out instanceof Promise) return out;
  return new Promise((resolve, reject) => {
    ctx.decodeAudioData(
      data,
      (b) => resolve(b),
      (e) => reject(e)
    );
  });
}

function envGain(ctx: AudioContext, at: number, peak: number, attackMs: number, decayMs: number): GainNode {
  const g = ctx.createGain();
  const a = Math.max(0.001, attackMs / 1000);
  const d = Math.max(0.004, decayMs / 1000);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + a);
  g.gain.exponentialRampToValueAtTime(0.0001, at + a + d);
  return g;
}

function playToneBurst(
  ctx: AudioContext,
  params: { type: OscillatorType; freq: number; peak: number; attackMs: number; decayMs: number; detune?: number }
): void {
  const at = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = envGain(ctx, at, params.peak, params.attackMs, params.decayMs);
  o.type = params.type;
  o.frequency.setValueAtTime(params.freq, at);
  if (params.detune) o.detune.setValueAtTime(params.detune, at);
  o.connect(g).connect(ctx.destination);
  o.start(at);
  o.stop(at + (params.attackMs + params.decayMs) / 1000 + 0.02);
}

function playToneSweep(
  ctx: AudioContext,
  params: {
    type: OscillatorType;
    startFreq: number;
    endFreq: number;
    peak: number;
    attackMs: number;
    decayMs: number;
    sweepMs: number;
  }
): void {
  const at = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = envGain(ctx, at, params.peak, params.attackMs, params.decayMs);
  o.type = params.type;
  o.frequency.setValueAtTime(params.startFreq, at);
  o.frequency.exponentialRampToValueAtTime(params.endFreq, at + Math.max(0.01, params.sweepMs / 1000));
  o.connect(g).connect(ctx.destination);
  o.start(at);
  o.stop(at + (params.attackMs + params.decayMs) / 1000 + 0.03);
}

function playNoiseBurst(
  ctx: AudioContext,
  params: {
    peak: number;
    attackMs: number;
    decayMs: number;
    filter: { type: BiquadFilterType; freq: number; q: number };
  }
): void {
  const at = ctx.currentTime;
  const durMs = params.attackMs + params.decayMs + 20;
  const frames = Math.max(16, Math.floor((ctx.sampleRate * durMs) / 1000));
  const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.9;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const f = ctx.createBiquadFilter();
  f.type = params.filter.type;
  f.frequency.setValueAtTime(params.filter.freq, at);
  f.Q.setValueAtTime(params.filter.q, at);

  const g = envGain(ctx, at, params.peak, params.attackMs, params.decayMs);
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(at);
  src.stop(at + durMs / 1000);
}

function playThudChop(ctx: AudioContext): void {
  playToneSweep(ctx, {
    type: "sine",
    startFreq: 150,
    endFreq: 95,
    peak: 0.16,
    attackMs: 2,
    decayMs: 80,
    sweepMs: 60
  });
  playToneBurst(ctx, { type: "square", freq: 1100, peak: 0.035, attackMs: 1, decayMs: 18, detune: -20 });
}

function playSwishChop(ctx: AudioContext): void {
  playNoiseBurst(ctx, { peak: 0.14, attackMs: 2, decayMs: 70, filter: { type: "highpass", freq: 650, q: 0.7 } });
  playToneSweep(ctx, {
    type: "triangle",
    startFreq: 520,
    endFreq: 220,
    peak: 0.05,
    attackMs: 1,
    decayMs: 60,
    sweepMs: 55
  });
}

function playClickChop(ctx: AudioContext): void {
  playToneBurst(ctx, { type: "square", freq: 880, peak: 0.11, attackMs: 1, decayMs: 25 });
  playToneBurst(ctx, { type: "triangle", freq: 660, peak: 0.07, attackMs: 1, decayMs: 35, detune: 12 });
}

function playMixChop(ctx: AudioContext): void {
  playToneSweep(ctx, {
    type: "sine",
    startFreq: 165,
    endFreq: 105,
    peak: 0.11,
    attackMs: 2,
    decayMs: 85,
    sweepMs: 65
  });
  playNoiseBurst(ctx, { peak: 0.07, attackMs: 2, decayMs: 55, filter: { type: "bandpass", freq: 900, q: 0.9 } });
  playToneBurst(ctx, { type: "square", freq: 1200, peak: 0.03, attackMs: 1, decayMs: 14, detune: -10 });
}
