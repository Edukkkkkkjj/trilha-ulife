import { describe, expect, it } from 'vitest';
import { countIn, evalSetExpr, parseSetList, regionExpr, regionOf, regionsOf, sameSet, SetParseError } from '../lib/sets';
import { analisar, compor, rotulo } from '../lib/functions';
import { build, describe as descreve, exprOf, matches, signal, tableOf, wouldCycle, type Circuit } from '../lib/circuit';
import { equivalent, parse, vars } from '../lib/logic';
import { DESAFIOS_BANCADA, PRESETS_BANCADA } from '../components/toys/Bancada';

describe('conjuntos (Venn)', () => {
  it('regiões de expressões conhecidas', () => {
    expect(regionsOf(evalSetExpr('A∩B∩C'))).toEqual([7]);
    expect(regionsOf(evalSetExpr('A−(B∪C)'))).toEqual([1]);
    expect(regionsOf(evalSetExpr('(B∩C)−A'))).toEqual([6]);
    expect(regionsOf(evalSetExpr("(A∪B∪C)'"))).toEqual([0]);
    expect(regionsOf(evalSetExpr('A∪B', 2), 2)).toEqual([1, 2, 3]);
    expect(evalSetExpr('A - B')).toBe(evalSetExpr("A ∩ B'"));
  });

  it('De Morgan e distributiva valem para conjuntos', () => {
    expect(evalSetExpr("(A∪B)'")).toBe(evalSetExpr("A'∩B'"));
    expect(evalSetExpr("(A∩B)'")).toBe(evalSetExpr("A'∪B'"));
    expect(evalSetExpr('A∩(B∪C)')).toBe(evalSetExpr('(A∩B)∪(A∩C)'));
  });

  it('inclusão-exclusão bate com a contagem por regiões (300 distribuições)', () => {
    for (let s = 0; s < 300; s++) {
      const q = Array.from({ length: 8 }, (_, r) => (s * (r + 3) * 7 + r) % 5);
      const n = (e: string) => countIn(evalSetExpr(e), q);
      expect(n('A∪B')).toBe(n('A') + n('B') - n('A∩B'));
      expect(n('A∪B∪C')).toBe(n('A') + n('B') + n('C') - n('A∩B') - n('A∩C') - n('B∩C') + n('A∩B∩C'));
    }
  });

  it('nomes de região e erros de digitação', () => {
    expect(regionOf(true, false, true)).toBe(5);
    expect(regionExpr(1)).toBe("A ∩ B' ∩ C'");
    expect(() => evalSetExpr('A∪')).toThrow(SetParseError);
    expect(() => evalSetExpr('C', 2)).toThrow(SetParseError);
  });

  it('leitura de listas digitadas', () => {
    expect(parseSetList('{1, 2,2 ,3}')).toEqual(['1', '2', '3']);
    expect(parseSetList('')).toEqual([]);
    expect(parseSetList('vazio')).toEqual([]);
    expect(sameSet(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(sameSet(['a'], ['a', 'b'])).toBe(false);
  });
});

describe('funções', () => {
  const A = ['1', '2', '3'];

  it('classifica os casos da lição', () => {
    expect(rotulo(analisar(A, ['a', 'b', 'c'], [['1', 'a'], ['2', 'b'], ['3', 'c']]))).toBe('bijetora');
    expect(rotulo(analisar(A, ['a', 'b', 'c', 'd'], [['1', 'a'], ['2', 'b'], ['3', 'c']]))).toBe('injetora');
    expect(rotulo(analisar(['1', '2', '3', '4'], ['a', 'b', 'c'], [['1', 'a'], ['2', 'b'], ['3', 'c'], ['4', 'c']]))).toBe('sobrejetora');
    expect(analisar(A, ['a', 'b'], [['1', 'a'], ['3', 'b']]).isFunction).toBe(false);
    expect(analisar(A, ['a', 'b'], [['1', 'a'], ['1', 'b'], ['2', 'a'], ['3', 'b']]).comVarias).toEqual(['1']);
  });

  it('composição aplica f primeiro', () => {
    expect(compor([['1', 'a'], ['2', 'b']], [['a', 'x'], ['b', 'y']])).toEqual([['1', 'x'], ['2', 'y']]);
    expect(compor([['1', 'a']], [['b', 'y']])).toEqual([]);
  });

  it('é impossível uma injetora de 4 em 3 (as 81 funções testadas)', () => {
    const B = ['a', 'b', 'c'];
    let inj = 0;
    for (let k = 0; k < 81; k++) {
      const f = [0, 1, 2, 3].map((i) => [String(i), B[Math.floor(k / 3 ** i) % 3]] as [string, string]);
      if (analisar(['0', '1', '2', '3'], B, f).injetora) inj++;
    }
    expect(inj).toBe(0);
  });
});

describe('bancada de circuitos', () => {
  it('cada exemplo pronto calcula a expressão do seu nome', () => {
    const esperado: Record<string, string> = { and: 'A·B', mux: "A·B + A'·C", xor: 'A ⊕ B', alarme: 'A·B + M', aegis: 'P + Q·R', sobra: 'A', absorcao: 'A' };
    for (const [k, p] of Object.entries(PRESETS_BANCADA)) {
      expect(equivalent(exprOf(p.c(), 'S')!, parse(esperado[k])).equal, k).toBe(true);
    }
  });

  it("NAND sozinha faz NOT e AND; e NAND(NAND(A,B), C) = AB + C' (questão da ALU)", () => {
    const not = build({ ins: ['A'], gates: [['n', 'NAND', 'A', 'A']], out: 'n' });
    expect(equivalent(exprOf(not, 'S')!, parse("A'")).equal).toBe(true);
    const and = build({ ins: ['A', 'B'], gates: [['n', 'NAND', 'A', 'B'], ['m', 'NAND', 'n', 'n']], out: 'm' });
    expect(equivalent(exprOf(and, 'S')!, parse('A·B')).equal).toBe(true);
    const alu = build({ ins: ['A', 'B', 'C'], gates: [['n', 'NAND', 'A', 'B'], ['m', 'NAND', 'n', 'C']], out: 'm' });
    expect(equivalent(exprOf(alu, 'S')!, parse("A·B + C'")).equal).toBe(true);
  });

  it('sinal, tabela, entrada solta e laço', () => {
    const c = PRESETS_BANCADA.mux.c();
    expect(tableOf(c, 'S').rows.filter((r) => r.value).length).toBe(4);
    c.nodes.find((n) => n.id === 'A')!.on = true;
    c.nodes.find((n) => n.id === 'B')!.on = true;
    expect(signal(c, 'S')).toBe(true);
    const solto: Circuit = { nodes: [...c.nodes], wires: c.wires.slice(1) };
    expect(signal(solto, 'S')).toBeNull();
    expect(matches(solto, 'S', parse('A'), ['A']).ok).toBe(false);
    expect(wouldCycle(c, 'o', 'x')).toBe(true);
    expect(wouldCycle(c, 'A', 'o')).toBe(false);
    expect(descreve(c, 'S')).toContain('A');
  });

  it('todo desafio tem alvo válido, e os de "enxugar" são mesmo iguais a uma chave só', () => {
    for (const d of DESAFIOS_BANCADA) {
      const alvo = parse(d.alvo);
      expect(vars(alvo).every((v) => d.entradas.includes(v)), d.id).toBe(true);
      if (d.maxPortas === 0) expect(equivalent(alvo, parse('A')).equal, d.id).toBe(true);
    }
  });
});
