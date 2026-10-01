// Simulados de Matemática: os números das respostas-modelo da A1 são recalculados aqui,
// e as questões da A2 têm de ser cópias fiéis de questões reais (com fonte) das regiões.
import { describe, expect, it } from 'vitest';
import { IDS_A2, SIMULADOS_MAT } from '../content/mat/simulados';
import { todasFases } from '../content';
import { arranjo, comb } from '../lib/contagem';
import { binomPmf } from '../lib/prob';
import { sistema2, fracTxt } from '../lib/linear';
import { dijkstra, kruskal, caminho, graus, conexo, temCiclo, ehArvore, type Grafo } from '../lib/grafos';
import { equivalent, parse, truthTable } from '../lib/logic';

const fase = (id: string) => SIMULADOS_MAT.fases.find((f) => f.id === id)!;
const modelos = fase('ms-a1').steps.flatMap((s) => (s.t === 'escrita' ? [s.modelo] : []));

describe('simulado A1: números das respostas-modelo', () => {
  it('Q1 conjuntos: 58, 2 e 18', () => {
    const uniao = 35 + 28 + 20 - 12 - 10 - 8 + 5;
    expect(uniao).toBe(58); expect(60 - uniao).toBe(2); expect(35 - ((12 - 5) + (10 - 5) + 5)).toBe(18);
    expect(modelos[0]).toMatch(/= 58/); expect(modelos[0]).toMatch(/= 18/);
  });
  it('Q2 lógica: 3 de 8; negação por De Morgan', () => {
    const t = truthTable(parse('C·(H + A)'));
    expect(t.filter((l) => l.value).map((l) => ['C', 'H', 'A'].map((v) => (l.env[v] ? 1 : 0)).join(''))).toEqual(expect.arrayContaining(['101', '110', '111']));
    expect(t.filter((l) => l.value)).toHaveLength(3);
    expect(equivalent(parse("(C·(H + A))'"), parse("C' + H'·A'")).equal).toBe(true);
  });
  it('Q3 contagem: 56, 336, 3/8', () => {
    expect(comb(8, 3)).toBe(56); expect(arranjo(8, 3)).toBe(336); expect(336 / 56).toBe(6);
    expect(comb(7, 2) / comb(8, 3)).toBeCloseTo(3 / 8, 12);
  });
  it('Q4 binomial: 0,6561, 0,3439, 0,2916', () => {
    expect(binomPmf(4, 0.9, 4)).toBeCloseTo(0.6561, 10); expect(1 - binomPmf(4, 0.9, 4)).toBeCloseTo(0.3439, 10); expect(binomPmf(4, 0.9, 3)).toBeCloseTo(0.2916, 10);
  });
  it('Q5 sistema: D = −10, solução (30, 20)', () => {
    const r = sistema2(1, 1, 50, 20, 10, 800);
    expect([r.D, r.Dx, r.Dy]).toEqual([-10, -300, -200]); expect([fracTxt(r.x!), fracTxt(r.y!)]).toEqual(['30', '20']);
  });
  it('Q6 grafo: graus, Dijkstra 7 por A-B-C-D-E, Kruskal 7', () => {
    const g: Grafo = { nos: [...'ABCDE'].map((id) => ({ id, x: 0, y: 0 })), arestas: [['A', 'B', 2], ['A', 'C', 5], ['B', 'C', 1], ['B', 'D', 4], ['C', 'D', 1], ['D', 'E', 3]].map(([a, b, w]) => ({ a: a as string, b: b as string, w: w as number })), dirigido: false, ponderado: true };
    expect(Object.values(graus(g)).map((x) => x.grau)).toEqual([2, 3, 3, 3, 1]);
    expect([conexo(g), temCiclo(g), ehArvore(g)]).toEqual([true, true, false]);
    const d = dijkstra(g, 'A');
    expect(d.dist).toEqual({ A: 0, B: 2, C: 3, D: 4, E: 7 }); expect(caminho(d.ant!, 'E')).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(kruskal(g).total).toBe(7);
  });
  it('toda questão dissertativa tem modelo e rubrica de 6 itens', () => {
    const esc = fase('ms-a1').steps.filter((s) => s.t === 'escrita');
    expect(esc).toHaveLength(6);
    for (const s of esc) if (s.t === 'escrita') { expect(s.modelo.length).toBeGreaterThan(300); expect(s.rubrica).toHaveLength(6); }
  });
});

describe('simulado A2: questões reais, sem repetição entre as versões', () => {
  it('cada questão é cópia de uma questão com fonte da plataforma, e cobre as 7 regiões', () => {
    const originais = todasFases().filter((f) => !f.regiao.simulado).flatMap((f) => f.steps.flatMap((s) => (s.t === 'ex' ? [s.ex] : [])));
    for (const letra of ['a', 'b'] as const) {
      const exs = fase('ms-a2' + letra).steps.flatMap((s) => (s.t === 'ex' ? [s.ex] : []));
      expect(exs).toHaveLength(16);
      IDS_A2[letra].forEach((id, i) => {
        const o = originais.find((x) => x.id === id)!;
        expect(o.fonte, id).toMatch(/^U\d/);
        expect(exs[i].prompt).toBe(o.prompt);
        if (o.kind === 'mcq' && exs[i].kind === 'mcq') expect((exs[i] as typeof o).correct).toBe(o.correct);
      });
      expect(new Set(IDS_A2[letra].map((id) => id.slice(0, 2))).size).toBe(7);
    }
    expect(IDS_A2.a.filter((id) => IDS_A2.b.includes(id))).toEqual([]);
  });
});
