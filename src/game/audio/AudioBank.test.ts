import { describe, expect, it } from "vitest";
import { AudioBank } from "./AudioBank";

describe("AudioBank", () => {
  it("uses AudioContext gain for bgm volume when AudioContext is available", async () => {
    const prevAudio = (globalThis as any).Audio;
    const prevAudioContext = (globalThis as any).AudioContext;

    class FakeAudio {
      src = "";
      loop = false;
      preload = "";
      volume = 1;
      currentTime = 0;

      constructor(src?: string) {
        if (src) this.src = src;
      }

      play(): Promise<void> {
        return Promise.resolve();
      }

      pause(): void {}
    }

    class FakeAudioContext {
      static lastGain: any = null;
      state = "running";
      currentTime = 0;
      destination = {};

      resume(): Promise<void> {
        return Promise.resolve();
      }

      createGain(): any {
        const g = {
          gain: {
            value: 1,
            setValueAtTime: (v: number) => {
              g.gain.value = v;
            }
          },
          connect: () => g
        };
        FakeAudioContext.lastGain = g;
        return g;
      }

      createMediaElementSource(): any {
        return { connect: () => ({ connect: () => ({}) }) };
      }
    }

    (globalThis as any).Audio = FakeAudio;
    (globalThis as any).AudioContext = FakeAudioContext;

    try {
      const a = new AudioBank();
      a.setBgmMode("menu");
      a.unlockBgm();
      await Promise.resolve();
      a.setBgmVolume(0.2);
      expect(FakeAudioContext.lastGain?.gain?.value).toBeCloseTo(0.2);
    } finally {
      (globalThis as any).Audio = prevAudio;
      (globalThis as any).AudioContext = prevAudioContext;
    }
  });

  it("does not play bgm when muted and resumes when unmuted", async () => {
    const prevAudio = (globalThis as any).Audio;
    const prevAudioContext = (globalThis as any).AudioContext;

    class FakeAudio {
      static plays = 0;
      src = "";
      loop = false;
      preload = "";
      volume = 1;
      currentTime = 0;

      constructor(src?: string) {
        if (src) this.src = src;
      }

      play(): Promise<void> {
        FakeAudio.plays += 1;
        return Promise.resolve();
      }

      pause(): void {}
    }

    (globalThis as any).Audio = FakeAudio;
    (globalThis as any).AudioContext = undefined;

    try {
      const a = new AudioBank();
      a.setMuted(true);
      a.setBgmMode("menu");
      a.unlockBgm();
      await Promise.resolve();
      expect(FakeAudio.plays).toBe(0);

      a.setMuted(false);
      await Promise.resolve();
      expect(FakeAudio.plays).toBeGreaterThanOrEqual(1);
    } finally {
      (globalThis as any).Audio = prevAudio;
      (globalThis as any).AudioContext = prevAudioContext;
    }
  });

  it("plays menu bgm after unlock and switches to game bgm", async () => {
    const prevAudio = (globalThis as any).Audio;
    const prevAudioContext = (globalThis as any).AudioContext;

    class FakeAudio {
      static plays: string[] = [];
      static pauses: string[] = [];

      src = "";
      loop = false;
      preload = "";
      volume = 1;
      currentTime = 0;

      constructor(src?: string) {
        if (src) this.src = src;
      }

      play(): Promise<void> {
        FakeAudio.plays.push(this.src);
        return Promise.resolve();
      }

      pause(): void {
        FakeAudio.pauses.push(this.src);
      }
    }

    (globalThis as any).Audio = FakeAudio;
    (globalThis as any).AudioContext = undefined;

    try {
      const a = new AudioBank();
      a.setBgmVolume(0.3);
      a.setBgmMode("menu");
      a.unlockBgm();
      await Promise.resolve();
      expect(FakeAudio.plays[0]).toContain("/assets/audio/bgm/sound_menu_background.mp3");

      a.setBgmMode("game");
      await Promise.resolve();
      expect(FakeAudio.pauses.length).toBeGreaterThanOrEqual(1);
      expect(FakeAudio.plays.some((s) => s.includes("/assets/audio/bgm/sound_game_background.mp3"))).toBe(true);
    } finally {
      (globalThis as any).Audio = prevAudio;
      (globalThis as any).AudioContext = prevAudioContext;
    }
  });

  it("plays external mp3 chop sound through AudioContext when available", async () => {
    const prevAudio = (globalThis as any).Audio;
    const prevAudioContext = (globalThis as any).AudioContext;
    const prevFetch = (globalThis as any).fetch;

    let bufferSourceStarts = 0;

    class FakeAudioContext {
      state = "running";
      currentTime = 0;
      sampleRate = 48000;
      destination = {};

      private chain(): any {
        return { connect: () => this.chain() };
      }

      resume(): Promise<void> {
        return Promise.resolve();
      }

      createGain(): any {
        return {
          gain: {
            value: 1,
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {}
          },
          connect: () => this.chain()
        };
      }

      createOscillator(): any {
        return {
          type: "sine",
          frequency: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          detune: { setValueAtTime: () => {} },
          connect: () => this.chain(),
          start: () => {},
          stop: () => {}
        };
      }

      createBufferSource(): any {
        return {
          buffer: null,
          connect: () => this.chain(),
          start: () => {
            bufferSourceStarts += 1;
          },
          stop: () => {}
        };
      }

      createBiquadFilter(): any {
        return {
          type: "bandpass",
          frequency: { setValueAtTime: () => {} },
          Q: { setValueAtTime: () => {} },
          connect: () => this.chain()
        };
      }

      createBuffer(): any {
        return { getChannelData: () => new Float32Array(64) };
      }

      decodeAudioData(): Promise<any> {
        return Promise.resolve({});
      }
    }

    (globalThis as any).Audio = undefined;
    (globalThis as any).AudioContext = FakeAudioContext;
    (globalThis as any).fetch = () =>
      Promise.resolve({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(16)
      });

    try {
      const a = new AudioBank();
      a.setChopStyle("tungtung" as any);
      for (let i = 0; i < 6; i += 1) await Promise.resolve();
      a.playChop();
      expect(bufferSourceStarts).toBe(1);
    } finally {
      (globalThis as any).Audio = prevAudio;
      (globalThis as any).AudioContext = prevAudioContext;
      (globalThis as any).fetch = prevFetch;
    }
  });

  it("can play external mp3 chop sound when style is tungtung (no AudioContext needed)", () => {
    const prevAudio = (globalThis as any).Audio;
    const prevAudioContext = (globalThis as any).AudioContext;

    class FakeAudio {
      static plays = 0;
      src = "";
      currentTime = 0;

      constructor(src?: string) {
        if (src) this.src = src;
      }

      play(): Promise<void> {
        FakeAudio.plays += 1;
        return Promise.resolve();
      }
    }

    (globalThis as any).Audio = FakeAudio;
    (globalThis as any).AudioContext = undefined;

    try {
      const a = new AudioBank();
      a.setChopStyle("tungtung" as any);
      expect(() => a.playChop()).not.toThrow();
      expect(FakeAudio.plays).toBe(1);
    } finally {
      (globalThis as any).Audio = prevAudio;
      (globalThis as any).AudioContext = prevAudioContext;
    }
  });
});
