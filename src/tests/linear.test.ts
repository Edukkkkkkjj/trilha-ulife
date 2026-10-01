// Álgebra linear: operações, determinantes, sistemas e os números citados na M5.
import { describe, expect, it } from 'vitest';
import { angulo, aplicar, cramer, det, escalar, fracTxt, gauss, norma, produto, sistema2, transposta } from '../lib/linear';
import { DESAFIOS_MAT, DESAFIOS_RET, DESAFIOS_VET } from '../components/toys/Linear';
import { GERADORES } from '../engine/geradores';
import { rng } from '../lib/rng';
import { M5 } from '../content/mat/m5';
import type { Ex } from '../engine/types';

const fixos: Ex[] = M5.fases.flatMap((f) => f.steps.flatMap((s) => (s.t === 'ex' ? [s.ex] : [])));
const porId = (id: string) => { const e = fixos.find((x) => x.id === id); if (!e) throw new Error('não achei ' + id); return e as any; };
const certa = (id: string) => { const e = porId(id); return e.options[e.correct] as string; };

describe('álgebra linear', () => {
  it('vetores: exemplos do curso', () => {
    expect(escalar([1, 2], [-2, 1])).toBe(0);
    expect(norma([3, 4])).toBe(5);
    expect(angulo([3, 0], [3 * Math.sqrt(3), 3])).toBeCloseTo(30, 6);
    expect(angulo([1, 2], [-2, 1])).toBeCloseTo(90, 6);
  });

  it('matrizes: ordem do produto, não comutatividade, transposta', () => {
    const A = [[1, 2], [3, 4], [5, 6]], B = [[1, 0, 2, 1, 0], [0, 1, 1, 0, 3]];
    expect(produto(A, B)!.length).toBe(3); expect(produto(A, B)![0].length).toBe(5);
    expect(produto(B, A)).toBeNull(); // 5 colunas × 3 linhas: não existe
    const X = [[1, 2], [3, 4]], Y = [[0, 1], [1, 0]];
    expect(produto(X, Y)).not.toEqual(produto(Y, X));
    expect(transposta(A)).toEqual([[1, 3, 5], [2, 4, 6]]);
    expect(aplicar([[20, 15], [30, 10]], [6, 4])).toEqual([180, 220]); // a cantina da aula
  });

  it('determinantes: propriedades citadas', () => {
    const A = [[4, 2, 1], [2, 3, 1], [5, 2, 1]], B = [[1, 2, 0], [0, 1, 3], [2, 0, 1]];
    expect(det(A)).toBe(-1);
    expect(det(transposta(A))).toBe(det(A));
    expect(det(produto(A, B)!)).toBe(det(A) * det(B));
    expect(det([A[1], A[0], A[2]])).toBe(-det(A)); // trocar linhas muda o sinal
    expect(det([A[0].map((x) => 3 * x), A[1], A[2]])).toBe(3 * det(A));
    expect(det([[2, 1], [4, 2]])).toBe(0);
    expect(det([[1, 2, 3], [2, 4, 6], [0, 1, 5]])).toBe(0); // linha 2 = 2 × linha 1
  });

  it('sistemas: servidores, curso, Telecom, fábrica e o exemplo de Gauss da aula', () => {
    expect(sistema2(1, 1, 10, 2, 5, 32)).toMatchObject({ classe: 'SPD', D: 3, Dx: 18, Dy: 12 });
    const c = sistema2(1, 1, 10, 2, -1, 2); expect([fracTxt(c.x!), fracTxt(c.y!)]).toEqual(['4', '6']);
    const t = sistema2(2, 5, 40, 3, 2, 25); expect(t.D).toBe(-11); expect([fracTxt(t.x!), fracTxt(t.y!)]).toEqual(['45/11', '70/11']);
    expect(sistema2(1, 1, 10, 1, 1, 6).classe).toBe('SI');
    expect(sistema2(1, 1, 10, 2, 2, 20).classe).toBe('SPI');
    expect(cramer([[4, 2, 1], [2, 3, 1], [5, 2, 1]], [460, 340, 430])).toEqual([-30, -180, 940]);
    const g = gauss([[1, 1, 1], [2, 1, -1], [1, -1, 1]], [6, 1, 2]);
    expect(g.x).toEqual([1, 2, 3]);
    expect(g.passos.at(-1)!.M).toEqual([[1, 1, 1, 6], [0, -1, -3, -11], [0, 0, 6, 18]]); // a escada mostrada no texto
    expect(gauss([[1, 2, 1], [0, 1, 2], [0, 0, 2]], [9, 8, 6]).x).toEqual([2, 2, 3]);
    // planos inteiros do Telecom com 10 instalações dentro dos limites: só (4, 6) e (5, 5)
    const bons: number[][] = [];
    for (let x = 0; x <= 14; x++) for (let y = 0; y <= 14; y++) if (2 * x + 5 * y <= 40 && 3 * x + 2 * y <= 25 && x + y >= 10) bons.push([x, y]);
    expect(bons).toEqual([[4, 6], [5, 5]]);
  });

  it('quatro servidores: a solução inteira fecha; o padrão de resposta não', () => {
    const A = [[2, 1, 1, 1], [1, 3, 1, 2], [1, 1, 2, 3]];
    expect(aplicar(A, [3, 3, 9, 2])).toEqual([20, 25, 30]);
    expect(aplicar(A, [4.74, 4.21, 3.42, 2.5])[2]).toBeCloseTo(porId('m5-b5').answer, 2);
  });

  it('gabaritos da M5', () => {
    expect(certa('m5-q2')).toBe('30°');
    expect(certa('m5-q4')).toMatch(/n = 4 .* 3 × 2/);
    expect(certa('m5-q8')).toMatch(/x = 6 .* y = 4/);
    expect(certa('m5-q12')).toBe('3×5');
    expect(porId('m5-t1').answer).toBe(2 * 2 - 5 * 3);
    expect(porId('m5-t2').answer).toBe(3 * 5 + 2 * 6);
    expect(porId('m5-b1').answer).toBe(-1);
    expect(porId('m5-b2').answer).toBe(-30);
    expect(porId('m5-b3').answer).toBe(2 * -30 + 3 * -180 + 940);
  });

  it('desafios dos três brinquedos: começam por resolver e têm solução', () => {
    for (const d of [...DESAFIOS_VET, ...DESAFIOS_MAT, ...DESAFIOS_RET] as any[]) expect(d.falta(d.ini), d.id).not.toBeNull();
    const ok = (lista: any[], id: string, s: object) => { const d = lista.find((x) => x.id === id); expect(d.falta({ ...d.ini, ...s }), id).toBeNull(); };
    ok(DESAFIOS_VET, 'vt-soma', { v: [3, 2] }); ok(DESAFIOS_VET, 'vt-perp', { v: [-1, 3] }); ok(DESAFIOS_VET, 'vt-norma', { u: [3, 4] }); ok(DESAFIOS_VET, 'vt-k', { k: -2 });
    ok(DESAFIOS_MAT, 'tm-area', { a: 3, d: 2 }); ok(DESAFIOS_MAT, 'tm-zero', { a: 2, b: 1, c: 4, d: 2 }); ok(DESAFIOS_MAT, 'tm-espelho', { a: -1 }); ok(DESAFIOS_MAT, 'tm-gira', { a: 0, b: -1, c: 1, d: 0 });
    ok(DESAFIOS_RET, 'rt-cruza', { sel: [4, 6] }); ok(DESAFIOS_RET, 'rt-si', { a2: 1, b2: 1, c2: 6 }); ok(DESAFIOS_RET, 'rt-spi', { a2: 2, b2: 2, c2: 20 });
    ok(DESAFIOS_RET, 'rt-telecom', { sel: [4, 6] }); ok(DESAFIOS_RET, 'rt-telecom', { sel: [5, 5] });
    expect(DESAFIOS_RET.find((x) => x.id === 'rt-telecom')!.falta({ ...DESAFIOS_RET[3].ini, sel: [5, 6] })).toMatch(/estoura o orçamento/);
  });

  it('geradores: classificação e sistema batem com o cálculo', () => {
    for (let i = 0; i < 200; i++) {
      const s = GERADORES['m5.sis'](rng(i * 7919 + 13), 2) as any;
      const [tot, p, q, val] = [...s.prompt.matchAll(/\*\*(\d+)\*\*/g)].map((m: RegExpMatchArray) => Number(m[1]));
      const r = sistema2(1, 1, tot, p, q, val);
      expect([s.passos[4].pede.resposta, s.passos[5].pede.resposta]).toEqual([r.x!.n / r.x!.d, r.y!.n / r.y!.d]);
      const d = GERADORES['m5.det'](rng(i * 7919 + 13), i % 3) as any;
      const nums = [...d.prompt.matchAll(/-?\d+/g)].map((m: RegExpMatchArray) => Number(m[0]));
      const lado = nums.length === 4 ? 2 : 3, M = Array.from({ length: lado }, (_, k) => nums.slice(k * lado, k * lado + lado));
      expect(d.kind === 'num' ? d.answer : d.passos.at(-1).pede.resposta).toBe(det(M));
    }
  });
});
