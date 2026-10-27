// Simulados de Matemática: os números das respostas-modelo da A1 são recalculados aqui,
// e as questões da A2 têm de ser cópias fiéis de questões reais (com fonte) das regiões.
import { describe, expect, it } from 'vitest';
import { IDS_A2, SIMULADOS_MAT } from '../content/mat/simulados';
import { todasFases } from '../content';
import { anagramas, arranjo, comb, fat } from '../lib/contagem';
import { equivalent, parse, truthTable } from '../lib/logic';

const fase = (id: string) => SIMULADOS_MAT.fases.find((f) => f.id === id)!;
const modelos = fase('ms-a1').steps.flatMap((s) => (s.t === 'escrita' ? [s.modelo] : []));

describe('simulado A1: números das respostas-modelo (só U1 a U4)', () => {
  it('Q1 conjuntos: 58, 2 e 18', () => {
    const uniao = 35 + 28 + 20 - 12 - 10 - 8 + 5;
    expect(uniao).toBe(58); expect(60 - uniao).toBe(2); expect(35 - ((12 - 5) + (10 - 5) + 5)).toBe(18);
    expect(modelos[0]).toMatch(/= 58/); expect(modelos[0]).toMatch(/= 18/);
  });
  it('Q2 funções: 16, 10, f bijetora, g não injetora', () => {
    const f = (x: number) => 3 * x - 2, g = (x: number) => x * x, finv = (y: number) => (y + 2) / 3;
    expect(g(f(2))).toBe(16); expect(f(g(2))).toBe(10);
    for (const x of [-3, 0, 1.5, 7]) expect(finv(f(x))).toBeCloseTo(x, 12);
    expect(g(2)).toBe(g(-2));
    expect(modelos[1]).toMatch(/= 16/); expect(modelos[1]).toMatch(/= 10/);
  });
  it('Q3 lógica: 3 de 8; negação por De Morgan', () => {
    const t = truthTable(parse('C·(H + A)'));
    expect(t.filter((l) => l.value).map((l) => ['C', 'H', 'A'].map((v) => (l.env[v] ? 1 : 0)).join(''))).toEqual(expect.arrayContaining(['101', '110', '111']));
    expect(t.filter((l) => l.value)).toHaveLength(3);
    expect(equivalent(parse("(C·(H + A))'"), parse("C' + H'·A'")).equal).toBe(true);
  });
  it('Q4 booleana: 5 de 8 linhas, distributiva e 2 portas', () => {
    const t = truthTable(parse('P·A + B'));
    expect(t).toHaveLength(8); expect(t.filter((l) => l.value)).toHaveLength(5);
    expect(t.filter((l) => !l.value).map((l) => ['P', 'A', 'B'].map((v) => (l.env[v] ? 1 : 0)).join('')).sort()).toEqual(['000', '010', '100']);
    expect(equivalent(parse('P·A + B'), parse('(P + B)·(A + B)')).equal).toBe(true);
  });
  it('Q5 contagem: 56, 336, 21 e 35', () => {
    expect(comb(8, 3)).toBe(56); expect(arranjo(8, 3)).toBe(336); expect(336 / 56).toBe(6);
    expect(comb(7, 2)).toBe(21); expect(comb(7, 3)).toBe(35); expect(comb(7, 2) + comb(7, 3)).toBe(comb(8, 3));
  });
  it('Q6 anagramas: 24, 60 e 30', () => {
    expect(anagramas('AMOS')).toBe(24); expect(anagramas('ARARAS')).toBe(60); expect(anagramas('AARRS')).toBe(30);
    expect(fat(6) / (fat(3) * fat(2))).toBe(60);
  });
  it('toda questão dissertativa tem modelo e rubrica de 6 itens', () => {
    const esc = fase('ms-a1').steps.filter((s) => s.t === 'escrita');
    expect(esc).toHaveLength(6);
    for (const s of esc) if (s.t === 'escrita') { expect(s.modelo.length).toBeGreaterThan(300); expect(s.rubrica).toHaveLength(6); }
  });
  it('é simulado de prova A1 de 4 h e não fala de unidades fora de U1 a U4', () => {
    expect(fase('ms-a1').prova).toEqual({ id: 'A1', horas: 4 });
    const tudo = JSON.stringify(fase('ms-a1').steps);
    expect(tudo).not.toMatch(/binomial|probabilidade|Dijkstra|Kruskal|determinante/i);
  });
});

describe('simulado A2: questões reais, sem repetição entre as versões', () => {
  it('cada questão é cópia de uma questão com fonte da plataforma, e cobre as 7 regiões', () => {
    const originais = todasFases().filter((f) => !f.regiao.simulado).flatMap((f) => f.steps.flatMap((s) => (s.t === 'ex' ? [s.ex] : [])));
    for (const letra of ['a', 'b'] as const) {
      const exs = fase('ms-a2' + letra).steps.flatMap((s) => (s.t === 'ex' ? [s.ex] : []));
      expect(exs).toHaveLength(12);
      IDS_A2[letra].forEach((id, i) => {
        const o = originais.find((x) => x.id === id)!;
        expect(o.fonte, id).toMatch(/^U\d/);
        expect(exs[i].prompt).toBe(o.prompt);
        if (o.kind === 'mcq' && exs[i].kind === 'mcq') expect((exs[i] as typeof o).correct).toBe(o.correct);
      });
      expect(new Set(IDS_A2[letra].map((id) => id.slice(0, 2))).size).toBe(7);
      expect(fase('ms-a2' + letra).prova).toEqual({ id: 'A2', horas: 3 });
    }
    expect(IDS_A2.a.filter((id) => IDS_A2.b.includes(id))).toEqual([]);
  });
});
