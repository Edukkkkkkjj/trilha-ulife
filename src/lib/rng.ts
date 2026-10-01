// Gerador de números aleatórios com semente: a mesma semente gera sempre o mesmo exercício
// (isso permite testar os geradores e refazer exatamente o exercício que você errou).

export type Rng = {
  next(): number;
  int(a: number, b: number): number;
  pick<T>(xs: readonly T[]): T;
  shuffle<T>(xs: readonly T[]): T[];
  sample<T>(xs: readonly T[], k: number): T[];
  bool(p?: number): boolean;
};

export function rng(seed: number): Rng {
  let a = seed >>> 0 || 1;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1));
  const shuffle = <T,>(xs: readonly T[]) => {
    const r = [...xs];
    for (let i = r.length - 1; i > 0; i--) { const j = int(0, i); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  return {
    next, int, shuffle,
    pick: (xs) => xs[int(0, xs.length - 1)],
    sample: (xs, k) => shuffle(xs).slice(0, k),
    bool: (p = 0.5) => next() < p,
  };
}

export const newSeed = () => (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;

/** Semente estável a partir de um texto (para embaralhar alternativas de forma repetível). */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0 || 1;
}
