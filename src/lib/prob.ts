// Probabilidade: as contas que o simulador desenha e que os testes conferem.
import { comb } from './contagem';
import type { Rng } from './rng';

/** Binomial: probabilidade de exatamente k sucessos em n tentativas independentes, cada uma com chance p. */
export const binomPmf = (n: number, p: number, k: number): number => (k < 0 || k > n ? 0 : comb(n, k) * p ** k * (1 - p) ** (n - k));
export const binomCdf = (n: number, p: number, k: number): number => { let t = 0; for (let i = 0; i <= k; i++) t += binomPmf(n, p, i); return t; };

/** Curva normal (densidade) e área acumulada até x. */
export const normalPdf = (x: number, mu = 0, sigma = 1): number => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
/** Φ(z): área da normal padrão à esquerda de z (aproximação de Abramowitz e Stegun, erro < 1,5e-7). */
export function phi(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const erf = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}
/** Área da normal entre dois valores, dados em desvios-padrão (z). */
export const areaEntre = (za: number, zb: number): number => Math.abs(phi(zb) - phi(za));

/** Valor esperado e variância de uma variável discreta. */
export const esperanca = (xs: number[], ps: number[]): number => xs.reduce((t, x, i) => t + x * ps[i], 0);
export const variancia = (xs: number[], ps: number[]): number => { const m = esperanca(xs, ps); return xs.reduce((t, x, i) => t + (x - m) ** 2 * ps[i], 0); };

// ---------- simulações (com semente, para serem repetíveis nos testes) ----------
export const lancar = (r: Rng, faces: number, vezes: number): number[] => { const c = Array(faces).fill(0); for (let i = 0; i < vezes; i++) c[r.int(0, faces - 1)]++; return c; };
export const simularBinomial = (r: Rng, n: number, p: number, vezes: number): number[] => {
  const c = Array(n + 1).fill(0);
  for (let i = 0; i < vezes; i++) { let k = 0; for (let j = 0; j < n; j++) if (r.next() < p) k++; c[k]++; }
  return c;
};
/** Sorteia `vezes` médias de m dados e conta quantas caem em cada uma das `caixas` faixas entre 1 e 6. */
export function mediasDeDados(r: Rng, m: number, vezes: number, caixas = 26): { hist: number[]; media: number; desvio: number } {
  const hist = Array(caixas).fill(0); let s = 0, s2 = 0;
  for (let i = 0; i < vezes; i++) {
    let t = 0; for (let j = 0; j < m; j++) t += r.int(1, 6);
    const x = t / m; s += x; s2 += x * x;
    hist[Math.min(caixas - 1, Math.floor(((x - 1) / 5) * (caixas - 1) + 0.5))]++;
  }
  const media = s / vezes;
  return { hist, media, desvio: Math.sqrt(Math.max(0, s2 / vezes - media * media)) };
}
