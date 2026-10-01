// Grafos: propriedades, representações, os cinco algoritmos e os números citados na M6.
import { describe, expect, it } from 'vitest';
import { bellmanFord, bfs, caminho, conexo, dfs, dijkstra, dirac, ehArvore, euleriano, graus, kruskal, listaAdj, matrizAdj, matrizInc, temCiclo, type Grafo } from '../lib/grafos';
import { DESAFIOS_GRAFO, G_BELLMAN, G_BUSCA, G_EXERCICIO, G_PESOS, G_TAREFAS } from '../components/toys/Grafos';
import { GERADORES } from '../engine/geradores';
import { grafoSorteado } from '../engine/geradores-m6';
import { rng } from '../lib/rng';
import { M6 } from '../content/mat/m6';
import type { Ex } from '../engine/types';

const fixos: Ex[] = M6.fases.flatMap((f) => f.steps.flatMap((s) => (s.t === 'ex' ? [s.ex] : [])));
const porId = (id: string) => { const e = fixos.find((x) => x.id === id); if (!e) throw new Error('não achei ' + id); return e as any; };
const certa = (id: string) => { const e = porId(id); return e.options[e.correct] as string; };
const g = (nos: string, arestas: [string, string, number?][], dirigido = false): Grafo => ({ nos: [...nos].map((id) => ({ id, x: 0, y: 0 })), arestas: arestas.map(([a, b, w]) => ({ a, b, w: w ?? 1 })), dirigido, ponderado: arestas.some((e) => e[2] !== undefined) });

describe('grafos', () => {
  it('exercício do curso: conexo, com ciclo, graus 2, 2, 3, 2, 1', () => {
    expect(conexo(G_EXERCICIO)).toBe(true);
    expect(temCiclo(G_EXERCICIO)).toBe(true);
    expect(Object.values(graus(G_EXERCICIO)).map((x) => x.grau)).toEqual([2, 2, 3, 2, 1]);
    expect(ehArvore(G_EXERCICIO)).toBe(false);
    expect(euleriano(G_EXERCICIO)).toBe(false);
    expect(euleriano({ ...G_EXERCICIO, arestas: [...G_EXERCICIO.arestas, { a: 'C', b: 'E', w: 1 }] })).toBe(true); // desafio g-euler
  });

  it('árvore do curso: A-B, B-C, C-D é árvore; com A-D deixa de ser', () => {
    const t = g('ABCD', [['A', 'B'], ['B', 'C'], ['C', 'D']]);
    expect(ehArvore(t)).toBe(true); expect(t.arestas.length).toBe(t.nos.length - 1);
    expect(ehArvore(g('ABCD', [['A', 'B'], ['B', 'C'], ['C', 'D'], ['A', 'D']]))).toBe(false);
    const anel = g('ABCD', [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']]);
    expect(euleriano(anel)).toBe(true); expect(dirac(anel)).toBe(true); // texto modelo do chefão
  });

  it('representações do exemplo 1–2, 2–3', () => {
    const p = g('123', [['1', '2'], ['2', '3']]);
    expect(matrizAdj(p)).toEqual([[0, 1, 0], [1, 0, 1], [0, 1, 0]]);
    expect(matrizInc(p)).toEqual([[1, 0], [1, 1], [0, 1]]);
    expect(Object.fromEntries(Object.entries(listaAdj(p)).map(([k, v]) => [k, v.map((x) => x.v)]))).toEqual({ 1: ['2'], 2: ['1', '3'], 3: ['2'] });
    expect(matrizAdj(G_EXERCICIO).flat().reduce((a, b) => a + b, 0)).toBe(2 * 5);
  });

  it('BFS e DFS no grafo do curso', () => {
    expect(bfs(G_BUSCA, 'A').ordem).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(dfs(G_BUSCA, 'A').ordem).toEqual(['A', 'B', 'D', 'C', 'E']); // vizinhos em ordem alfabética
    expect(bfs(G_BUSCA, 'A').dist).toEqual({ A: 0, B: 1, C: 1, D: 2, E: 3 });
    expect(bfs(G_TAREFAS, 'A').ordem).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(dfs(G_TAREFAS, 'A').ordem).toEqual(['A', 'B', 'D', 'F', 'G', 'C', 'E']);
    expect(temCiclo(G_TAREFAS)).toBe(false);
    expect(temCiclo({ ...G_TAREFAS, arestas: [...G_TAREFAS.arestas, { a: 'G', b: 'A', w: 1 }] })).toBe(true);
  });

  it('Bellman-Ford na rede do curso; ciclo negativo quando C→B = −3', () => {
    const r = bellmanFord(G_BELLMAN, 'A');
    expect(r.dist).toEqual({ A: 0, B: 1, C: 3, D: 4, E: 4, F: 6 });
    expect(r.cicloNegativo).toBe(false);
    expect(caminho(r.ant!, 'F')).toEqual(['A', 'B', 'C', 'E', 'F']);
    expect(porId('m6-r-bf').answer).toBe(r.dist!.F);
    const ruim = { ...G_BELLMAN, arestas: G_BELLMAN.arestas.map((e) => (e.a === 'C' && e.b === 'B' ? { ...e, w: -3 } : e)) };
    expect(bellmanFord(ruim, 'A').cicloNegativo).toBe(true);
  });

  it('Dijkstra e Kruskal na rede com pesos do chefão', () => {
    const d = dijkstra(G_PESOS, 'A');
    expect(d.dist).toEqual({ A: 0, B: 3, C: 2, D: 8, E: 10, F: 13 });
    expect(porId('m6-b4').answer).toBe(d.dist!.F);
    const k = kruskal(G_PESOS);
    expect(k.total).toBe(porId('m6-b5').answer);
    expect(k.passos.at(-1)!.marcadas).toHaveLength(5);
    // sem pesos negativos, Dijkstra e Bellman-Ford concordam
    for (let i = 0; i < 60; i++) { const x = grafoSorteado(rng(i * 31 + 7), 6, 4, true); expect(dijkstra(x, 'A').dist).toEqual(bellmanFord(x, 'A').dist); }
  });

  it('gabaritos e desafios', () => {
    expect(certa('m6-r-ativ1')).toMatch(/conexo e contém o ciclo/);
    expect(porId('m6-r-graus').answer).toEqual(['A', 'B', 'D']);
    expect(certa('m6-r-bfsproj')).toBe('A, B, C, D, E, F, G');
    expect(porId('m6-b3').answer).toBe(5);
    for (const d of DESAFIOS_GRAFO) expect(d.falta(d.ini), d.id).not.toBeNull();
    const ok = (id: string, s: Grafo) => expect(DESAFIOS_GRAFO.find((d) => d.id === id)!.falta(s), id).toBeNull();
    const semAr = (a: string, b: string) => ({ ...G_EXERCICIO, arestas: G_EXERCICIO.arestas.filter((e) => !(e.a === a && e.b === b)) });
    ok('g-arvore', semAr('B', 'C')); ok('g-ponte', semAr('C', 'D'));
    ok('g-euler', { ...G_EXERCICIO, arestas: [...G_EXERCICIO.arestas, { a: 'C', b: 'E', w: 1 }] });
    const ini4 = DESAFIOS_GRAFO.find((d) => d.id === 'g-graus')!.ini;
    ok('g-graus', { ...ini4, arestas: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']].map(([a, b]) => ({ a, b, w: 1 })) });
    const at = DESAFIOS_GRAFO.find((d) => d.id === 'g-atalho')!.ini;
    ok('g-atalho', { ...at, arestas: at.arestas.map((e) => (e.a === 'C' ? { ...e, w: 0 } : e.a === 'B' ? { ...e, w: 9 } : e)) });
  });

  it('geradores: respostas recalculadas', () => {
    for (let i = 0; i < 150; i++) {
      const s = i * 7919 + 13;
      const b = GERADORES['m6.busca'](rng(s), 1) as any;
      expect(b.correct).toBeGreaterThanOrEqual(0);
      const ar = [...b.prompt.matchAll(/([A-E])–([A-E])/g)].map((m: RegExpMatchArray) => [m[1], m[2]] as [string, string]);
      const gg = g('ABCDE', ar);
      expect(b.options[b.correct]).toBe((/BFS/.test(b.prompt) ? bfs(gg, 'A') : dfs(gg, 'A')).ordem.join(', '));
      const k = GERADORES['m6.kru'](rng(s), 1) as any;
      const ak = [...k.prompt.matchAll(/([A-E])–([A-E]) \((\d)\)/g)].map((m: RegExpMatchArray) => [m[1], m[2], Number(m[3])] as [string, string, number]);
      expect(k.answer).toBe(kruskal(g('ABCDE', ak)).total);
    }
  });
});
