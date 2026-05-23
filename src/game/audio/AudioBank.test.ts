import { describe, expect, it } from "vitest";
import { AudioBank } from "./AudioBank";

describe("AudioBank", () => {
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
