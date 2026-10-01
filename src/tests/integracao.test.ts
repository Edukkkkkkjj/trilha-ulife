// Integração (M7): indução, recorrência e o modelo Aegis-Grid.
import { describe, expect, it } from 'vitest';
import { AFIRMACOES, falha, fib, hanoi, primo, recorrencia, risco, tabela, type Aegis } from '../lib/integracao';
import { DESAFIOS_AEG, DESAFIOS_DOM, caidos } from '../components/toys/Integracao';
import { MODELOS } from '../engine/geradores-m7';
import { GERADORES } from '../engine/geradores';
import { equivalent, parse, truthTable } from '../lib/logic';
import { rng } from '../lib/rng';
import { M7 } from '../content/mat/m7';
import type { Ex } from '../engine/types';

const fixos: Ex[] = M7.fases.flatMap((f) => f.steps.flatMap((s) => (s.t === 'ex' ? [s.ex] : [])));
const porId = (id: string) => { const e = fixos.find((x) => x.id === id); if (!e) throw new Error('não achei ' + id); return e as any; };
const BASE: Aegis = { P: false, P2: false, Q: false, R: false, T: false, reserva: false, rota3: false, pp: 0.1, pq: 0.2, pr: 0.2 };

describe('indução e recorrência', () => {
  it('as afirmações do conferidor', () => {
    const a = (id: string) => AFIRMACOES.find((x) => x.id === id)!;
    for (let n = 1; n <= 60; n++) { expect(a('soma').vale(n)).toBe(true); expect(Array.from({ length: n }, (_, i) => 2 * i + 1).reduce((x, y) => x + y, 0)).toBe(n * n); }
    expect([1, 2, 3, 4, 5, 6].map((n) => a('pot').vale(n))).toEqual([true, false, false, false, true, true]);
    for (let n = 1; n <= 39; n++) expect(a('primos').vale(n), String(n)).toBe(true);
    expect(a('primos').vale(40)).toBe(false); expect(40 * 40 + 40 + 41).toBe(41 * 41); expect(41 * 41 + 41 + 41).toBe(41 * 43);
    expect(primo(41)).toBe(true); expect(primo(1681)).toBe(false);
  });
  it('recorrências citadas', () => {
    expect([1, 2, 3, 4, 5].map((n) => recorrencia(1, 2, 1, n))).toEqual([1, 3, 7, 15, 31]);
    for (let n = 1; n <= 20; n++) expect(recorrencia(1, 2, 1, n)).toBe(hanoi(n));
    expect(hanoi(10)).toBe(porId('m7-r1').answer);
    expect(recorrencia(3, 2, 0, 6)).toBe(96); // o vídeo que dobra
    expect([1, 2, 3, 4, 5, 6, 7].map(fib)).toEqual([1, 1, 2, 3, 5, 8, 13]);
    expect((100 * 101) / 2).toBe(5050);
  });
  it('dominós: desafios', () => {
    for (const d of DESAFIOS_DOM) expect(d.falta(d.ini), d.id).not.toBeNull();
    const ok = (id: string, s: object) => { const d = DESAFIOS_DOM.find((x) => x.id === id)!; expect(d.falta({ ...d.ini, ...s }), id).toBeNull(); };
    ok('d-todos', { base: true }); ok('d-base', { base: false }); ok('d-elo', { quebra: 4 }); ok('d-primos', { nTeste: 40 });
    expect(caidos({ base: true, quebra: 6, afirmacao: 'soma', nTeste: 1 })).toBe(6);
  });
});

describe('Aegis-Grid', () => {
  it('S = P + QR: 5 falhas em 8, igual à tabela da lógica; não equivale às variações erradas', () => {
    const t = tabela(BASE);
    expect(t).toHaveLength(8);
    expect(t.filter((l) => l.S).map((l) => l.ent.join(''))).toEqual(['011', '100', '101', '110', '111']);
    expect(truthTable(parse('P + Q·R')).filter((l) => l.value)).toHaveLength(5);
    expect(porId('m7-q2').answer).toBe(5); expect(porId('m7-b2').answer).toBe(8 - 5);
    expect(equivalent(parse('p ∨ (q ∧ r)'), parse('(p ∨ q) ∧ (p ∨ r)')).equal).toBe(true);
    expect(equivalent(parse('p ∨ (q ∧ r)'), parse('(p ∨ q) ∧ r')).equal).toBe(false);
    expect(falha({ ...BASE, Q: true, R: true })).toBe(true); expect(falha({ ...BASE, Q: true })).toBe(false);
  });
  it('com reserva e com terceira rota', () => {
    expect(tabela({ ...BASE, reserva: true }).filter((l) => l.S)).toHaveLength(7); // de 16
    expect(tabela({ ...BASE, rota3: true }).filter((l) => l.S)).toHaveLength(9); // de 16
    expect(falha({ ...BASE, reserva: true, P: true })).toBe(false);
    expect(falha({ ...BASE, reserva: true, P: true, P2: true })).toBe(true);
  });
  it('risco: 13,6% original; 4,96% com reserva; 10,72% com terceira rota', () => {
    expect(risco(BASE).total).toBeCloseTo(0.136, 10);
    expect(risco(BASE).total).toBeCloseTo(0.1 + 0.04 - 0.1 * 0.04, 10);
    expect(risco({ ...BASE, reserva: true }).total).toBeCloseTo(0.0496, 10);
    expect(risco({ ...BASE, rota3: true }).total).toBeCloseTo(0.1072, 10);
    // conferindo o risco somando as linhas da tabela, cada uma com a sua probabilidade
    const p = [0.1, 0.2, 0.2];
    const soma = tabela(BASE).filter((l) => l.S).reduce((t, l) => t + l.ent.reduce((x, b, i) => x * (b ? p[i] : 1 - p[i]), 1), 0);
    expect(soma).toBeCloseTo(0.136, 10);
  });
  it('desafios e geradores', () => {
    for (const d of DESAFIOS_AEG) expect(d.falta(d.ini), d.id).not.toBeNull();
    const ok = (id: string, s: object) => { const d = DESAFIOS_AEG.find((x) => x.id === id)!; expect(d.falta({ ...d.ini, ...s }), id).toBeNull(); };
    ok('ag-rotas', { Q: true, R: true }); ok('ag-conta', { Q: true, R: true }); ok('ag-risco', { reserva: true }); ok('ag-reserva', { P: true, P2: true });
    expect(DESAFIOS_AEG.find((x) => x.id === 'ag-risco')!.falta({ ...BASE, rota3: true })).toMatch(/10,7/);
    for (const m of MODELOS) expect(() => parse(m.e)).not.toThrow();
    for (let i = 0; i < 100; i++) {
      const r = GERADORES['m7.risco'](rng(i * 7919 + 13), 2) as any;
      const [pp, pq, pr] = [...r.prompt.matchAll(/\*\*([\d,]+)\*\*/g)].map((m: RegExpMatchArray) => Number(m[1].replace(',', '.')));
      expect(r.passos.at(-1).pede.resposta).toBeCloseTo(risco({ ...BASE, pp, pq, pr }).total, 10);
    }
  });
});
