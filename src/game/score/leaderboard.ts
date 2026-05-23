export type LeaderboardEntry = {
  score: number;
  atMs: number;
};

export type Difficulty = "easy" | "normal" | "hard";

export type LeaderboardStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function keyForDifficulty(difficulty: Difficulty): string {
  return `scores.leaderboard.v1.${difficulty}`;
}

export function readLeaderboard(
  difficulty: Difficulty,
  storage: LeaderboardStorage = localStorage
): LeaderboardEntry[] {
  try {
    const raw = storage.getItem(keyForDifficulty(difficulty));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    const entries = (parsed as any)?.entries;
    if (!Array.isArray(entries)) return [];
    const out: LeaderboardEntry[] = [];
    for (const e of entries) {
      const score = Number((e as any)?.score);
      const atMs = Number((e as any)?.atMs);
      if (!Number.isFinite(score) || !Number.isFinite(atMs)) continue;
      if (score < 0) continue;
      out.push({ score, atMs });
    }
    return normalize(out, 5);
  } catch {
    return [];
  }
}

export function submitScore(params: {
  difficulty: Difficulty;
  score: number;
  storage?: LeaderboardStorage;
  nowMs?: number;
  limit?: number;
}): {
  entries: LeaderboardEntry[];
  previousBestScore: number;
  bestScore: number;
  isNewRecord: boolean;
} {
  const storage = params.storage ?? localStorage;
  const nowMs = params.nowMs ?? Date.now();
  const limit = params.limit ?? 5;
  const score = Number(params.score);
  if (!Number.isFinite(score) || score < 0) {
    const entries = readLeaderboard(params.difficulty, storage);
    const bestScore = entries[0]?.score ?? 0;
    return { entries, previousBestScore: bestScore, bestScore, isNewRecord: false };
  }

  const existing = readLeaderboard(params.difficulty, storage);
  const previousBestScore = existing[0]?.score ?? 0;
  const merged = normalize([...existing, { score, atMs: nowMs }], limit);
  const bestScore = merged[0]?.score ?? 0;
  const isNewRecord = score > previousBestScore;
  try {
    storage.setItem(keyForDifficulty(params.difficulty), JSON.stringify({ v: 1, entries: merged }));
  } catch {}
  return { entries: merged, previousBestScore, bestScore, isNewRecord };
}

function normalize(entries: LeaderboardEntry[], limit: number): LeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.atMs - a.atMs;
  });
  const lim = Math.max(1, Math.min(100, Math.floor(limit)));
  return sorted.slice(0, lim);
}
