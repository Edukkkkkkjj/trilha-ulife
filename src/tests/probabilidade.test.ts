// Probabilidade: as fórmulas, as simulações e os números citados na M4.
import { describe, expect, it } from 'vitest';
import { areaEntre, binomCdf, binomPmf, esperanca, lancar, mediasDeDados, phi, simularBinomial } from '../lib/prob';
import { rng } from '../lib/rng';
import { DESAFIOS_SIM, type EstadoSim } from '../components/toys/Simulador';
import { GERADORES } from '../engine/geradores';
import { TABELAS_ESP } from '../engine/geradores-m4';
import { M4 } from '../content/mat/m4';
import { lerNumero } from '../engine/corrigir';
import type { Ex } from '../engine/types';

const fixos: Ex[] = M4.fases.flatMap((f) => f.steps.flatMap((s) => (s.t === 'ex' ? [s.ex] : [])));
const porId = (id: string) => { const e = fixos.find((x) => x.id === id); if (!e) throw new Error('não achei ' + id); return e as any; };
const certa = (id: string) => { const e = porId(id); return e.options[e.correct] as string; };

describe('fórmulas de probabilidade', () => {
  it('binomial: soma 1, média n·p e os exemplos do curso', () => {
    for (const [n, p] of [[10, 0.8], [3, 0.5], [20, 0.05], [5, 0.1]] as const) {
      const ps = Array.from({ length: n + 1 }, (_, k) => binomPmf(n, p, k));
      expect(ps.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
      expect(ps.reduce((a, x, k) => a + k * x, 0)).toBeCloseTo(n * p, 10);
      expect(binomCdf(n, p, n)).toBeCloseTo(1, 10);
    }
    expect(binomPmf(3, 0.5, 2)).toBeCloseTo(3 / 8, 12);
    expect(binomPmf(3, 0.8, 2)).toBeCloseTo(0.384, 12);
    expect(binomPmf(10, 0.8, 10)).toBeCloseTo(0.1074, 4);
    expect(binomPmf(5, 0.1, 0)).toBeCloseTo(0.59, 2);
    const ps = Array.from({ length: 11 }, (_, k) => binomPmf(10, 0.8, k));
    expect(ps.indexOf(Math.max(...ps))).toBe(8); // desafio s-rede
  });

  it('normal: regra 68-95-99,7 e a cauda acima de 2 desvios', () => {
    expect(phi(0)).toBeCloseTo(0.5, 6);
    expect(areaEntre(-1, 1)).toBeCloseTo(0.6827, 3);
    expect(areaEntre(-2, 2)).toBeCloseTo(0.9545, 3);
    expect(areaEntre(-3, 3)).toBeCloseTo(0.9973, 3);
    expect(1 - phi(2)).toBeCloseTo(0.0228, 3); // a regra arredonda para 2,5%
    expect(areaEntre(2, 4)).toBeGreaterThan(0.02);
  });

  it('simulações com semente: frequência perto da teoria', () => {
    const c = lancar(rng(7), 6, 60000);
    for (const x of c) expect(x / 60000).toBeCloseTo(1 / 6, 1);
    const b = simularBinomial(rng(7), 10, 0.8, 20000);
    expect(b.reduce((a, x, k) => a + k * x, 0) / 20000).toBeCloseTo(8, 1);
    const m1 = mediasDeDados(rng(7), 1, 5000), m30 = mediasDeDados(rng(7), 30, 5000);
    expect(m1.media).toBeCloseTo(3.5, 1); expect(m30.media).toBeCloseTo(3.5, 1);
    expect(m1.desvio).toBeCloseTo(Math.sqrt(35 / 12), 1);
    expect(m30.desvio).toBeCloseTo(Math.sqrt(35 / 12 / 30), 1);
    expect(m30.hist.reduce((a, x) => a + x, 0)).toBe(5000);
  });

  it('desafios do simulador: começam por resolver e têm solução', () => {
    const base: EstadoSim = { aba: 'sorteio', faces: 6, evento: [4, 5], cont: [0, 0, 0, 0, 0, 0], n: 10, p: 0.5, k: null, sim: null, mu: 150, sigma: 20, za: -1, zb: 1, m: 1, hist: null, mediaObs: 0, desvioObs: 0 };
    for (const d of DESAFIOS_SIM) expect(d.falta({ ...base, ...d.ini }), d.id).not.toBeNull();
    const ok = (id: string, s: Partial<EstadoSim>) => { const d = DESAFIOS_SIM.find((x) => x.id === id)!; expect(d.falta({ ...base, ...d.ini, ...s }), id).toBeNull(); };
    ok('s-dado', { cont: [50, 50, 50, 50, 50, 50] });
    ok('s-evento', { evento: [1, 3, 5] });
    ok('s-moedas', { n: 3, p: 0.5, k: 2 });
    ok('s-rede', { n: 10, p: 0.8, k: 8 });
    ok('s-68', { za: -2, zb: 2 });
    ok('s-cauda', { za: 2, zb: 4 });
    ok('s-tcl', { m: 10, hist: [1] });
  });
});

describe('M4 · gabaritos recalculados', () => {
  it('questões do curso e chefão', () => {
    expect(certa('m4-r-ex4')).toBe('1/3');
    expect(lerNumero(certa('m4-r-ex5'))).toBeCloseTo(3 / 10);
    expect(lerNumero(certa('m4-r-ex11'))).toBeCloseTo(0.9 * 0.9);
    expect(lerNumero(certa('m4-r-ex10'))).toBeCloseTo(0.7 * 0.6 + 0.5 * 0.4);
    expect(certa('m4-r-ex7')).toBe('10');
    expect(certa('m4-r-ex9')).toBe(String(8 * 7 * 6));
    expect(porId('m4-r-senha').answer).toBeCloseTo(0.0003, 5);
    expect(porId('m4-b1').answer).toBe(50 / 1000);
    expect(porId('m4-b2').answer).toBeCloseTo(0.95 ** 2);
    expect(porId('m4-b3').answer).toBe(10 * 0.8);
    expect(porId('m4-b4').answer).toBeCloseTo(0.8 ** 10, 4);
    expect(porId('m4-b5').answer).toBe((190 - 150) / 20);
  });

  it('leitura de números: 0.025 e 0,025 são vinte e cinco milésimos; 1.814.400 é milhão', () => {
    expect(lerNumero('0.025')).toBe(0.025);
    expect(lerNumero('0,025')).toBe(0.025);
    expect(lerNumero('2,5%')).toBeCloseTo(0.025);
    expect(lerNumero('1.814.400')).toBe(1814400);
    expect(lerNumero('1/3')).toBeCloseTo(1 / 3);
  });

  it('geradores: tabelas de valor esperado somam 1 e a binomial bate com a fórmula', () => {
    for (const [xs, ps] of TABELAS_ESP) { expect(ps.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10); expect(esperanca(xs, ps)).toBeGreaterThanOrEqual(0); }
    for (let i = 0; i < 200; i++) {
      const b = GERADORES['m4.binom'](rng(i * 7919 + 13), i % 3) as any;
      const [n, p, k] = [...b.prompt.matchAll(/\*\*(?:exatamente )?([\d,]+)\*\*/g)].map((m: RegExpMatchArray) => Number(m[1].replace(',', '.')));
      expect(b.passos.at(-1).pede.resposta).toBeCloseTo(binomPmf(n, p, k), 10);
    }
  });
});
