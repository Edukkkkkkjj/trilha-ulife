// Refaz, por código, cada conta citada na lista de erros do material (src/content/erros.ts).
// Rode só este arquivo com:  npm run verificar
import { describe, expect, it } from 'vitest';
import { classify, envs, equivalent, evalAst, parse, truthTable } from '../lib/logic';
import { evalSetExpr } from '../lib/sets';

const fat = (n: number): number => (n <= 1 ? 1 : n * fat(n - 1));

describe('erros do material, conferidos por código', () => {
  it('e1 · U1 Venn: nenhuma alternativa é A − (B ∪ C)', () => {
    const alvo = evalSetExpr('A−(B∪C)');
    for (const alt of ['B∪C', '(A∪B)−C', 'A∩B∩C', 'A∪C', '(A∩B)−C']) expect(evalSetExpr(alt)).not.toBe(alvo);
    expect(evalSetExpr("A∩B'∩C'")).toBe(alvo);
  });

  it('e2 · U2: p → q só é falsa em V → F (o card diz "quando o segundo é falso")', () => {
    const falsas = truthTable(parse('p → q')).filter((r) => !r.value).map((r) => r.env);
    expect(falsas).toEqual([{ p: true, q: false }]);
    expect(evalAst(parse('p → q'), { p: false, q: false })).toBe(true); // F → F é verdadeiro
  });

  it('e3 · U3: a tabela 0,1,1,0 é do XOR, não do OR', () => {
    const col = (e: string) => truthTable(parse(e)).map((r) => (r.value ? 1 : 0));
    expect(col('A ⊕ B')).toEqual([0, 1, 1, 0]);
    expect(col('A + B')).toEqual([0, 1, 1, 1]);
    expect(equivalent(parse("A·B' + A'·B"), parse('A ⊕ B')).equal).toBe(true);
  });

  it("e4 · U3 Q1: (A+B)(A'+C) não equivale a AB + A'C", () => {
    const r = equivalent(parse("(A+B)·(A'+C)"), parse("A·B + A'·C"));
    expect(r.equal).toBe(false);
    expect(r.diff).toHaveLength(4);
    expect(r.diff).toContainEqual({ A: true, B: true, C: false });
    // e é mesmo um multiplexador: A = 1 passa B, A = 0 passa C
    const mux = parse("A·B + A'·C");
    for (const e of envs(['A', 'B', 'C'])) expect(evalAst(mux, e)).toBe(e.A ? e.B : e.C);
  });

  it('e5/e6 · U4: BALANÇA = 840, ARARAS = 60 (letras A, R, S; não existe N)', () => {
    expect(fat(7) / fat(3)).toBe(840);
    expect(fat(6) / (fat(3) * fat(2))).toBe(60);
    const letras = [...'ARARAS'].reduce<Record<string, number>>((a, l) => ({ ...a, [l]: (a[l] ?? 0) + 1 }), {});
    expect(letras).toEqual({ A: 3, R: 2, S: 1 });
    expect(fat(8) / fat(2)).toBe(20160); // ALFABETO
  });

  it('e21 · U4: COMPUTADOR não tem 10 letras distintas (dois O); o número real é 10!/2!', () => {
    const letras = [...'COMPUTADOR'].reduce<Record<string, number>>((a, l) => ({ ...a, [l]: (a[l] ?? 0) + 1 }), {});
    expect(letras.O).toBe(2);
    expect(Object.keys(letras)).toHaveLength(9);
    expect(fat(10) / fat(2)).toBe(1814400);
  });

  it('e7 · exercício 9 (Sbrana): 3 de 8 com ordem é arranjo, A(8,3) = 336; permutação de 8 seria 40320', () => {
    expect(fat(8) / fat(5)).toBe(336);
    expect(fat(8)).toBe(40320);
  });

  it('e8 · urna 3 vermelhas, 2 verdes, 1 azul: as cores não são equiprováveis', () => {
    expect(3 / 6).not.toBeCloseTo(1 / 3);
    expect([3 / 6, 2 / 6, 1 / 6].reduce((a, b) => a + b)).toBeCloseTo(1);
  });

  it('e9 · U6 Telecom: solução exata fracionária; (5, 6) estoura o orçamento; (4, 6) cabe', () => {
    // 2x + 5y = 40 ; 3x + 2y = 25  → Cramer com frações exatas
    const D = 2 * 2 - 5 * 3, Dx = 40 * 2 - 5 * 25, Dy = 2 * 25 - 3 * 40;
    expect([D, Dx, Dy]).toEqual([-11, -45, -70]); // x = 45/11, y = 70/11
    expect(Dx / D).toBeCloseTo(4.0909, 3);
    expect(Dy / D).toBeCloseTo(6.3636, 3);
    expect(Number.isInteger(Dx / D) || Number.isInteger(Dy / D)).toBe(false);
    expect([2 * 5 + 5 * 6, 3 * 5 + 2 * 6]).toEqual([40, 27]); // gabarito: usa as 40 h, mas custa 27 mil
    expect([2 * 4 + 5 * 6, 3 * 4 + 2 * 6]).toEqual([38, 24]); // (4, 6) respeita os dois limites
    // nenhum par inteiro não negativo usa exatamente os dois recursos
    let exatos = 0;
    for (let x = 0; x <= 20; x++) for (let y = 0; y <= 8; y++) if (2 * x + 5 * y === 40 && 3 * x + 2 * y === 25) exatos++;
    expect(exatos).toBe(0);
  });

  it('e10 · U6 quatro servidores: o gabarito não satisfaz A·x = b; a solução de norma mínima satisfaz', () => {
    const A = [[2, 1, 1, 1], [1, 3, 1, 2], [1, 1, 2, 3]], b = [20, 25, 30];
    const vezes = (x: number[]) => A.map((l) => l.reduce((s, a, k) => s + a * x[k], 0));
    const gab = vezes([4.74, 4.21, 3.42, 2.5]);
    expect(Math.abs(gab[2] - 30)).toBeGreaterThan(6); // energia dá ≈ 23,29
    // norma mínima: x = Aᵀ (A Aᵀ)⁻¹ b, resolvendo (A Aᵀ) y = b por Gauss-Jordan
    const G = A.map((li) => A.map((lj) => li.reduce((s, a, k) => s + a * lj[k], 0)));
    const M = G.map((l, i) => [...l, b[i]]);
    for (let c = 0; c < 3; c++) {
      const p = M[c][c];
      M[c] = M[c].map((v) => v / p);
      for (let r = 0; r < 3; r++) if (r !== c) { const f = M[r][c]; M[r] = M[r].map((v, k) => v - f * M[c][k]); }
    }
    const y = M.map((l) => l[3]);
    const x = [0, 1, 2, 3].map((k) => A.reduce((s, l, i) => s + l[k] * y[i], 0));
    expect(x.map((v) => Math.round(v * 1000) / 1000)).toEqual([4.344, 2.104, 4.071, 5.137]);
    vezes(x).forEach((v, i) => expect(v).toBeCloseTo(b[i], 9));
    // x = A^T y fica no espaco das linhas de A: e isso que caracteriza a solucao de menor norma.
  });

  it('e11 · U6 metalmecânica: det = −1 e solução (−30, −180, 940), que satisfaz o sistema', () => {
    const A = [[4, 2, 1], [2, 3, 1], [5, 2, 1]], b = [460, 340, 430];
    const det = (m: number[][]) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    expect(det(A)).toBe(-1);
    const x = [0, 1, 2].map((j) => det(A.map((l, i) => l.map((v, k) => (k === j ? b[i] : v)))) / det(A));
    expect(x).toEqual([-30, -180, 940]);
    expect(A.map((l) => l.reduce((s, a, k) => s + a * x[k], 0))).toEqual(b);
  });

  it('e12 · U8 Aegis-Grid: p ∨ (q ∧ r) falha em 5 cenários, não 4', () => {
    const t = truthTable(parse('p ∨ (q ∧ r)'));
    expect(t.filter((r) => r.value)).toHaveLength(5);
    expect(t.filter((r) => r.value && !r.env.p).map((r) => r.env)).toEqual([{ p: false, q: true, r: true }]);
    expect(equivalent(parse('p ∨ (q ∧ r)'), parse('P + Q·R'.toLowerCase())).equal).toBe(true);
    expect(classify(parse('p ∨ (q ∧ r)'))).toBe('contingência');
  });

  it('e14 · U7: as duas ordens de DFS são válidas, dependem da lista de vizinhos', () => {
    const dfs = (g: Record<string, string[]>, s: string, v: string[] = []): string[] => { v.push(s); for (const n of g[s]) if (!v.includes(n)) dfs(g, n, v); return v; };
    const g = { A: ['B', 'C'], B: ['A', 'D'], C: ['A', 'D'], D: ['B', 'C', 'E'], E: ['D'] };
    expect(dfs(g, 'A')).toEqual(['A', 'B', 'D', 'C', 'E']);
    expect(dfs({ ...g, D: ['B', 'E', 'C'] }, 'A')).toEqual(['A', 'B', 'D', 'E', 'C']); // a ordem do material
  });

  it('e15/e16 · U4: 26·10·4·26·16 = 432.640 senhas; 2! = 2', () => {
    expect(26 * 10 * 4 * 26 * 16).toBe(432640);
    expect(fat(2)).toBe(2);
  });
});
