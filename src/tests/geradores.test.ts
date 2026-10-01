// Cada gerador é rodado com centenas de sementes. Para cada exercício gerado:
// (1) a resposta do gabarito passa no verificador; (2) nenhuma "armadilha" coincide com a resposta certa
// de um jeito que faça a certa ser recusada; (3) quando dá, a resposta é recalculada por outro caminho.
import { describe, expect, it } from 'vitest';
import { CATEGORIAS_FN, GERADORES, POOL_EQUIV, POOL_SIMPL, categoriaFn } from '../engine/geradores';
import { colunasDaTabela, corrigir, corrigirTabela, lerNumero, nota } from '../engine/corrigir';
import { rng } from '../lib/rng';
import { classify, equivalent, literalCount, parse } from '../lib/logic';
import { evalSetExpr, regionsOf } from '../lib/sets';
import type { Ex } from '../engine/types';

const SEMENTES = Array.from({ length: 200 }, (_, i) => i * 7919 + 13);
const numeros = (s: string) => (s.match(/\*\*(\d+)\*\*/g) ?? []).map((x) => Number(x.replace(/\*/g, '')));

/** Devolve a resposta "do gabarito" no formato que o aluno digitaria. */
function respostaCerta(ex: Ex) {
  switch (ex.kind) {
    case 'mcq': return ex.correct;
    case 'multi': return ex.correct;
    case 'num': return String(ex.answer).replace('.', ',');
    case 'set': return ex.answer.join(', ');
    case 'expr': return ex.target;
    case 'venn': return regionsOf(evalSetExpr(ex.target, ex.n), ex.n);
    case 'classificar': return ex.itens.map((i) => i.cat);
    case 'tabela': return colunasDaTabela(ex.expr, ex.ordem).gabarito;
    case 'passos': return ex.passos.filter((p) => p.pede).slice(-ex.ocultos).map(() => 1);
  }
}

describe('geradores de exercício', () => {
  for (const [nome, g] of Object.entries(GERADORES)) {
    it(`${nome}: o gabarito sempre passa no verificador (200 sementes × 3 níveis)`, () => {
      for (const s of SEMENTES) for (const nivel of [0, 1, 2]) {
        const ex = g(rng(s), nivel);
        expect(ex.hints).toHaveLength(3);
        expect(ex.explain.length).toBeGreaterThan(5);
        const r = corrigir(ex, respostaCerta(ex));
        expect(r.ok, `${nome} semente ${s}: ${ex.prompt}`).toBe(true);
        if (ex.kind === 'mcq') { expect(ex.correct).toBeGreaterThanOrEqual(0); expect(new Set(ex.options).size).toBe(ex.options.length); }
      }
    });
    it(`${nome}: a mesma semente gera o mesmo exercício`, () => {
      const a = g(rng(123), 1), b = g(rng(123), 1);
      expect({ ...a, id: '' }).toEqual({ ...b, id: '' });
    });
  }

  it('m1.ie2: resposta recalculada a partir dos números do enunciado', () => {
    for (const s of SEMENTES) {
      const ex = GERADORES['m1.ie2'](rng(s), 0);
      if (ex.kind !== 'num') throw new Error('tipo');
      const [a, b, x] = numeros(ex.prompt);
      expect(ex.answer).toBe(a + b - x);
      expect(x).toBeLessThan(Math.min(a, b));
      // somar sem descontar é reconhecido como erro de conceito, com explicação
      const errado = corrigir(ex, String(a + b));
      expect(errado.ok).toBe(false);
      expect(errado.diag?.msg).toMatch(/esqueceu de tirar/);
    }
  });

  it('m1.ie3: a soma das sete regiões é igual à fórmula de inclusão-exclusão', () => {
    for (const s of SEMENTES) {
      const ex = GERADORES['m1.ie3'](rng(s), 2);
      if (ex.kind !== 'passos') throw new Error('tipo');
      const [a, b, c, ab, ac, bc, t] = (ex.prompt.match(/= (\d+)|: (\d+)/g) ?? []).map((x) => Number(x.replace(/\D/g, '')));
      const total = ex.passos[ex.passos.length - 1].pede!.resposta;
      expect(total).toBe(a + b + c - ab - ac - bc + t);
      const pedacos = ex.passos.slice(1, 7).map((p) => p.pede!.resposta);
      expect(pedacos.reduce((x, y) => x + y, 0) + t).toBe(total);
      expect(pedacos.every((v) => v > 0)).toBe(true);
    }
  });

  it('m1.partes, m1.cart e m2.linhas: fórmulas diretas', () => {
    for (const s of SEMENTES) {
      const p = GERADORES['m1.partes'](rng(s), 0), l = GERADORES['m2.linhas'](rng(s), 0), c = GERADORES['m1.cart'](rng(s), 0);
      if (p.kind !== 'num' || l.kind !== 'num' || c.kind !== 'num') throw new Error('tipo');
      expect(p.answer).toBe(2 ** p.prompt.match(/\{([^}]*)\}/)![1].split(', ').length);
      expect(l.answer).toBe(2 ** Number(l.prompt.match(/(\d+) proposi/)![1]));
      const [m, k] = (c.prompt.match(/\*\*(\d+) /g) ?? []).map((x) => Number(x.replace(/\D/g, '')));
      expect(c.answer).toBe(m * k);
    }
  });

  it('m1.classf: a categoria marcada é a que a análise das setas dá', () => {
    const vistas = new Set<number>();
    for (const s of SEMENTES) {
      const ex = GERADORES['m1.classf'](rng(s), 0);
      if (ex.kind !== 'mcq') throw new Error('tipo');
      const A = ex.prompt.match(/A = \{([^}]*)\}/)![1].split(', '), B = ex.prompt.match(/B = \{([^}]*)\}/)![1].split(', ');
      const f = [...ex.prompt.matchAll(/(\w) → (\w)/g)].map((m) => [m[1], m[2]] as [string, string]);
      expect(ex.correct).toBe(categoriaFn(A, B, f));
      expect(ex.options).toEqual(CATEGORIAS_FN);
      vistas.add(ex.correct);
    }
    expect(vistas.size).toBe(5); // as cinco categorias aparecem
  });

  it('m1.comp: trocar a ordem das funções é diagnosticado', () => {
    let diagnosticos = 0;
    for (const s of SEMENTES) {
      const ex = GERADORES['m1.comp'](rng(s), 0);
      if (ex.kind !== 'num') throw new Error('tipo');
      const troca = ex.armadilhas![0];
      if (troca.valor !== ex.answer) { const r = corrigir(ex, String(troca.valor)); expect(r.ok).toBe(false); if (r.diag?.msg.includes('primeiro')) diagnosticos++; }
    }
    expect(diagnosticos).toBeGreaterThan(100);
  });

  it('m2.equiv: a certa é equivalente e as erradas não são', () => {
    for (const it of POOL_EQUIV) {
      expect(equivalent(parse(it.x), parse(it.certa)).equal, `${it.x} ≡ ${it.certa}`).toBe(true);
      for (const e of it.erradas) expect(equivalent(parse(it.x), parse(e)).equal, `${it.x} vs ${e}`).toBe(false);
    }
  });

  it('m2.simpl: cada simplificação está certa e não dá para usar menos variáveis', () => {
    for (const it of POOL_SIMPL) {
      expect(equivalent(parse(it.e), parse(it.alvo)).equal, it.e).toBe(true);
      expect(literalCount(parse(it.alvo))).toBe(it.lits);
      // a expressão original (mais longa) é recusada por não estar enxuta
      const ex = GERADORES['m2.simpl'](rng(1), 0);
      if (ex.kind === 'expr' && ex.target === it.alvo) expect(corrigir({ ...ex, target: it.alvo, maxLits: it.lits }, it.e).ok).toBe(false);
    }
  });

  it('m2.classe: a classificação bate com a tabela-verdade', () => {
    for (const s of SEMENTES) {
      const ex = GERADORES['m2.classe'](rng(s), 0);
      if (ex.kind !== 'mcq') throw new Error('tipo');
      const expr = ex.prompt.match(/\*\*(.+?)\*\*/)![1];
      expect(['tautologia', 'contradição', 'contingência'][ex.correct]).toBe(classify(parse(expr)));
    }
  });

  it('m2.tabela: um erro numa coluna intermediária é apontado na coluna certa', () => {
    const ex = GERADORES['m2.tabela'](rng(5), 2);
    if (ex.kind !== 'tabela') throw new Error('tipo');
    const { gabarito } = colunasDaTabela(ex.expr, ex.ordem);
    const errada: number[][] = gabarito.map((c) => [...c]);
    errada[0][2] = 1 - errada[0][2];
    const r = corrigirTabela(ex.expr, ex.ordem, errada);
    expect(r.ok).toBe(false);
    expect(r.erros[0]).toEqual([2]);
    expect(r.msg).toMatch(/Coluna/);
    expect(corrigirTabela(ex.expr, ex.ordem, gabarito.map((c) => c.map(() => -1))).msg).toMatch(/vazia/);
  });
});

describe('verificador de respostas', () => {
  it('lê números do jeito que se digita no Brasil', () => {
    expect(lerNumero('0,62')).toBeCloseTo(0.62);
    expect(lerNumero('1/3')).toBeCloseTo(1 / 3);
    expect(lerNumero('25%')).toBeCloseTo(0.25);
    expect(lerNumero('432.640')).toBe(432640);
    expect(lerNumero('1.822,12')).toBeCloseTo(1822.12);
    expect(lerNumero('-30')).toBe(-30);
    expect(lerNumero('abc')).toBeNull();
    expect(lerNumero('1/0')).toBeNull();
    expect(lerNumero('')).toBeNull();
  });

  it('a nota leva em conta dicas e tentativas', () => {
    expect(nota(true, true, 0)).toBe(1);
    expect(nota(true, true, 1)).toBe(0.85);
    expect(nota(true, true, 3)).toBe(0.35);
    expect(nota(false, true, 0)).toBe(0.5);
    expect(nota(false, false, 0)).toBe(0);
    expect(nota(true, true, 2)).toBeGreaterThan(nota(false, true, 0));
  });

  it('expressão: aceita qualquer equivalente, recusa não equivalente com contraexemplo', () => {
    const ex: Ex = { id: 'x', kind: 'expr', topic: 't', prompt: '', target: "A·B + A'·C", hints: ['', '', ''], explain: '' };
    expect(corrigir(ex, "(A AND B) OR (NOT A AND C)").ok).toBe(true);
    const r = corrigir(ex, "(A+B)·(A'+C)");
    expect(r.ok).toBe(false);
    expect(r.diag?.msg).toMatch(/Não é equivalente/);
    expect(corrigir(ex, 'A + (').diag?.causa).toBe('leitura');
  });

  it('conjunto vazio e Venn', () => {
    const vazio: Ex = { id: 'v', kind: 'set', topic: 't', prompt: '', answer: [], hints: ['', '', ''], explain: '' };
    expect(corrigir(vazio, '').ok).toBe(true);
    expect(corrigir(vazio, 'r4').ok).toBe(false);
    const venn: Ex = { id: 'w', kind: 'venn', topic: 't', prompt: '', n: 3, target: '(B∩C)−A', hints: ['', '', ''], explain: '' };
    expect(corrigir(venn, [6]).ok).toBe(true);
    expect(corrigir(venn, [6, 7]).ok).toBe(false);
  });
});
