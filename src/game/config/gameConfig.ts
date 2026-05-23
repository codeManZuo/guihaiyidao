export type GameConfig = {
  time: {
    startMs: number;
    maxMs: number;
    addPerChopMs: number;
    decayScale: number;
  };
  obstacle: {
    noneChance: number;
    avoidSameSide: boolean;
  };
};

export function defaultGameConfig(): GameConfig {
  return {
    time: {
      startMs: 7000,
      maxMs: 7000,
      addPerChopMs: 650,
      decayScale: 0.95
    },
    obstacle: {
      noneChance: 0.14,
      avoidSameSide: true
    }
  };
}

export function configFromProperties(props: Record<string, string>): GameConfig {
  const d = defaultGameConfig();

  const startMs = parseNumber(props["time.startMs"], d.time.startMs, 1000, 600000);
  const maxMs = parseNumber(props["time.maxMs"], d.time.maxMs, 1000, 600000);
  const addPerChopMs = parseNumber(props["time.addPerChopMs"], d.time.addPerChopMs, 0, 600000);
  const decayScale = parseNumber(props["time.decayScale"], d.time.decayScale, 0.05, 5);

  const noneChance = parseNumber(props["obstacle.noneChance"], d.obstacle.noneChance, 0, 1);
  const avoidSameSide = parseBoolean(props["obstacle.avoidSameSide"], d.obstacle.avoidSameSide);

  const max = Math.max(startMs, maxMs);

  return {
    time: {
      startMs: max,
      maxMs: max,
      addPerChopMs,
      decayScale
    },
    obstacle: {
      noneChance,
      avoidSameSide
    }
  };
}

function parseNumber(raw: string | undefined, fallback: number, min: number, max: number): number {
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  const v = raw.trim().toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  return fallback;
}
