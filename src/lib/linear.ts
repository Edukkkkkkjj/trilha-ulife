// Álgebra linear: vetores, matrizes, determinantes e sistemas. Tudo com números comuns; frações exatas onde importa.

export type Vec = [number, number];
export type Mat = number[][];

export const soma = (u: Vec, v: Vec): Vec => [u[0] + v[0], u[1] + v[1]];
export const escala = (k: number, u: Vec): Vec => [k * u[0], k * u[1]];
export const escalar = (u: number[], v: number[]): number => u.reduce((t, x, i) => t + x * v[i], 0);
export const norma = (u: number[]): number => Math.sqrt(escalar(u, u));
/** Ângulo entre dois vetores, em graus (NaN se algum for o vetor nulo). */
export const angulo = (u: Vec, v: Vec): number => (Math.acos(Math.max(-1, Math.min(1, escalar(u, v) / (norma(u) * norma(v))))) * 180) / Math.PI;

export const ordem = (A: Mat): [number, number] => [A.length, A[0]?.length ?? 0];
export const transposta = (A: Mat): Mat => A[0].map((_, j) => A.map((l) => l[j]));
export const somaMat = (A: Mat, B: Mat): Mat => A.map((l, i) => l.map((x, j) => x + B[i][j]));
/** Produto de matrizes; devolve null quando as ordens não combinam (colunas de A ≠ linhas de B). */
export function produto(A: Mat, B: Mat): Mat | null {
  if (ordem(A)[1] !== ordem(B)[0]) return null;
  return A.map((l) => B[0].map((_, j) => l.reduce((t, x, k) => t + x * B[k][j], 0)));
}
export const aplicar = (A: Mat, v: number[]): number[] => A.map((l) => escalar(l, v));

/** Determinante por expansão em cofatores (serve para qualquer ordem pequena). */
export function det(A: Mat): number {
  const n = A.length;
  if (n === 1) return A[0][0];
  if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
  return A[0].reduce((t, x, j) => t + (j % 2 ? -1 : 1) * x * det(A.slice(1).map((l) => l.filter((_, c) => c !== j))), 0);
}
export const trocaColuna = (A: Mat, j: number, b: number[]): Mat => A.map((l, i) => l.map((x, c) => (c === j ? b[i] : x)));

// ---------- frações exatas ----------
export type Frac = { n: number; d: number };
const mdc = (a: number, b: number): number => (b ? mdc(b, a % b) : Math.abs(a));
export function frac(n: number, d: number): Frac { const g = mdc(n, d) || 1, s = d < 0 ? -1 : 1; return { n: (s * n) / g, d: (s * d) / g }; }
export const fracTxt = (f: Frac) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
export const fracNum = (f: Frac) => f.n / f.d;

// ---------- sistemas ----------
export type Classe = 'SPD' | 'SPI' | 'SI';
/** Sistema 2×2: a1·x + b1·y = c1 ; a2·x + b2·y = c2 (coeficientes inteiros). */
export function sistema2(a1: number, b1: number, c1: number, a2: number, b2: number, c2: number): { classe: Classe; D: number; Dx: number; Dy: number; x?: Frac; y?: Frac } {
  const D = a1 * b2 - b1 * a2, Dx = c1 * b2 - b1 * c2, Dy = a1 * c2 - c1 * a2;
  if (D !== 0) return { classe: 'SPD', D, Dx, Dy, x: frac(Dx, D), y: frac(Dy, D) };
  // D = 0: retas paralelas (SI) ou a mesma reta (SPI). Uma linha toda nula com termo independente não nulo também é impossível.
  const nula1 = a1 === 0 && b1 === 0, nula2 = a2 === 0 && b2 === 0;
  if ((nula1 && c1 !== 0) || (nula2 && c2 !== 0)) return { classe: 'SI', D, Dx, Dy };
  return { classe: Dx === 0 && Dy === 0 ? 'SPI' : 'SI', D, Dx, Dy };
}

/** Regra de Cramer para sistema n×n; null se o determinante principal for zero. */
export function cramer(A: Mat, b: number[]): number[] | null {
  const D = det(A);
  return D === 0 ? null : b.map((_, j) => det(trocaColuna(A, j, b)) / D);
}

export type PassoGauss = { texto: string; M: number[][] };
/** Eliminação de Gauss com os passos, sobre a matriz ampliada [A | b]. Devolve a solução (ou null se não for SPD). */
export function gauss(A: Mat, b: number[]): { passos: PassoGauss[]; x: number[] | null } {
  const n = A.length, M = A.map((l, i) => [...l, b[i]]), passos: PassoGauss[] = [{ texto: 'Matriz ampliada [A | b]', M: M.map((l) => [...l]) }];
  for (let c = 0; c < n; c++) {
    let p = c; while (p < n && Math.abs(M[p][c]) < 1e-12) p++;
    if (p === n) return { passos, x: null };
    if (p !== c) { [M[c], M[p]] = [M[p], M[c]]; passos.push({ texto: `Troca L${c + 1} com L${p + 1} (o pivô não pode ser zero)`, M: M.map((l) => [...l]) }); }
    for (let i = c + 1; i < n; i++) {
      const f = M[i][c] / M[c][c];
      if (Math.abs(f) < 1e-12) continue;
      for (let j = c; j <= n; j++) M[i][j] -= f * M[c][j];
      passos.push({ texto: `L${i + 1} ← L${i + 1} − (${Number(f.toFixed(4))})·L${c + 1}`, M: M.map((l) => l.map((x) => Math.round(x * 1e9) / 1e9)) });
    }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) x[i] = (M[i][n] - M[i].slice(i + 1, n).reduce((t, v, k) => t + v * x[i + 1 + k], 0)) / M[i][i];
  return { passos, x: x.map((v) => Math.round(v * 1e9) / 1e9) };
}
