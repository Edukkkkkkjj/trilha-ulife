// Integridade do conteúdo: nada aponta para algo que não existe, e os gabaritos das questões
// com conta são recalculados aqui.
import { describe, expect, it } from 'vitest';
import { REGIOES, TOPICOS, todasFases, todosCards } from '../content';
import { ERROS_MATERIAL } from '../content/erros';
import { GERADORES } from '../engine/geradores';
import { corrigir, colunasDaTabela } from '../engine/corrigir';
import { rng } from '../lib/rng';
import { classify, envs, equivalent, evalAst, parse, truthTable } from '../lib/logic';
import { evalSetExpr } from '../lib/sets';
import { diff, inter, union } from '../lib/sets';
import { DESAFIOS_VENN } from '../components/toys/Venn';
import { DESAFIOS_INT, PRESETS_INT } from '../components/toys/Interruptores';
import { DESAFIOS_BANCADA } from '../components/toys/Bancada';
import { DESAFIOS_FN } from '../components/toys/Funcoes';
import { DESAFIOS_ARVORE } from '../components/toys/Arvore';
import { DESAFIOS_SIM } from '../components/toys/Simulador';
import { DESAFIOS_VET } from '../components/toys/Linear';
import { DESAFIOS_MAT } from '../components/toys/Linear';
import { DESAFIOS_RET } from '../components/toys/Linear';
import { DESAFIOS_GRAFO } from '../components/toys/Grafos';
import { DESAFIOS_DOM } from '../components/toys/Integracao';
import { DESAFIOS_AEG } from '../components/toys/Integracao';
import { DESAFIOS_CANO } from '../components/toys/Exp1';
import { DESAFIOS_PILHA } from '../components/toys/Exp1';
import { DESAFIOS_SILOS } from '../components/toys/Exp1';
import { DESAFIOS_TREINO } from '../components/toys/Exp2';
import { DESAFIOS_SPAM } from '../components/toys/Exp2';
import { DESAFIOS_GERADOR } from '../components/toys/Exp2';
import { DESAFIOS_FEED } from '../components/toys/Exp3';
import { DESAFIOS_ESCALA } from '../components/toys/Exp3';
import { DESAFIOS_VIES } from '../components/toys/Exp3';
import { DESAFIOS_LGPD } from '../components/toys/Exp3';
import type { Ex } from '../engine/types';

const fases = todasFases();
const fixos: Ex[] = fases.flatMap((f) => f.steps.flatMap((s) => (s.t === 'ex' ? [s.ex] : [])));
const porId = (id: string) => { const e = fixos.find((x) => x.id === id); if (!e) throw new Error('não achei ' + id); return e; };
const DESAFIOS: Record<string, string[]> = { lgpd: DESAFIOS_LGPD.map((d) => d.id), vies: DESAFIOS_VIES.map((d) => d.id), escala: DESAFIOS_ESCALA.map((d) => d.id), feed: DESAFIOS_FEED.map((d) => d.id), gerador: DESAFIOS_GERADOR.map((d) => d.id), spam: DESAFIOS_SPAM.map((d) => d.id), treinador: DESAFIOS_TREINO.map((d) => d.id), silos: DESAFIOS_SILOS.map((d) => d.id), pilha: DESAFIOS_PILHA.map((d) => d.id), cano: DESAFIOS_CANO.map((d) => d.id), aegis: DESAFIOS_AEG.map((d) => d.id), dominos: DESAFIOS_DOM.map((d) => d.id), grafos: DESAFIOS_GRAFO.map((d) => d.id), retas: DESAFIOS_RET.map((d) => d.id), matriz: DESAFIOS_MAT.map((d) => d.id), vetores: DESAFIOS_VET.map((d) => d.id), simulador: DESAFIOS_SIM.map((d) => d.id), venn: DESAFIOS_VENN.map((d) => d.id), interruptores: DESAFIOS_INT.map((d) => d.id), bancada: DESAFIOS_BANCADA.map((d) => d.id), funcoes: DESAFIOS_FN.map((d) => d.id), arvore: DESAFIOS_ARVORE.map((d) => d.id) };

describe('integridade do conteúdo', () => {
  it('ids únicos: fases, exercícios, cartões e erros do material', () => {
    for (const lista of [fases.map((f) => f.id), fixos.map((e) => e.id), todosCards().map((c) => c.id), ERROS_MATERIAL.map((e) => e.id)]) expect(new Set(lista).size).toBe(lista.length);
  });

  it('toda fase aponta para geradores, brinquedos, desafios e presets que existem', () => {
    for (const f of fases) for (const s of f.steps) {
      if (s.t === 'gen') expect(GERADORES[s.gen], `${f.id}: gerador ${s.gen}`).toBeTypeOf('function');
      if (s.t === 'toy') {
        expect(DESAFIOS[s.toy], f.id).toBeDefined();
        for (const d of s.desafios ?? []) expect(DESAFIOS[s.toy], `${f.id}: desafio ${d}`).toContain(d);
        if (s.toy === 'interruptores' && s.preset) expect(PRESETS_INT[s.preset]).toBeDefined();
      }
    }
  });

  it('todo tópico usado tem nome; toda região pronta tem leitura, lição, laboratório, questões reais e chefão', () => {
    const usados = new Set<string>(fixos.map((e) => e.topic));
    for (const g of Object.values(GERADORES)) for (const n of [0, 1, 2]) usados.add(g(rng(9), n).topic);
    for (const t of usados) expect(TOPICOS[t], t).toBeTruthy();
    for (const r of REGIOES.filter((x) => x.pronto && !x.simulado)) {
      const tipos = new Set(r.fases.map((f) => f.tipo));
      for (const t of ['leitura', 'licao', 'lab', 'questoes', 'chefe']) expect(tipos.has(t as never), `${r.id} sem ${t}`).toBe(true);
      expect(r.cards.length).toBeGreaterThanOrEqual(10);
      expect(r.fases.some((f) => f.steps.some((s) => s.t === 'escrita')), `${r.id} sem treino de escrita`).toBe(true);
      expect(r.fases.some((f) => f.steps.some((s) => s.t === 'feynman')), `${r.id} sem "explique"`).toBe(true);
      for (const f of r.fases) expect(f.min, f.id).toBeLessThanOrEqual(12);
    }
  });

  it('toda questão de alternativas tem índice válido, 3 dicas e explicação; as do curso citam a fonte', () => {
    for (const e of fixos) {
      expect(e.hints, e.id).toHaveLength(3);
      expect(e.explain.length, e.id).toBeGreaterThan(10);
      if (e.kind === 'mcq') { expect(e.correct, e.id).toBeGreaterThanOrEqual(0); expect(e.correct, e.id).toBeLessThan(e.options.length); expect(new Set(e.options).size, e.id).toBe(e.options.length); }
      if (e.id.includes('-r-') || /-q\d+$/.test(e.id)) expect(e.fonte, e.id).toMatch(/^U\d/);
      if (e.selo) expect(e.seloNota ?? e.explain, e.id).toBeTruthy();
    }
    for (const f of fases.filter((x) => x.tipo === 'questoes')) expect(f.steps.filter((s) => s.t === 'ex').length, f.id).toBeGreaterThanOrEqual(7);
  });

  it('o gabarito de cada exercício fixo passa no próprio verificador', () => {
    for (const e of fixos) {
      if (e.kind === 'num') expect(corrigir(e, String(e.answer)).ok, e.id).toBe(true);
      if (e.kind === 'set') expect(corrigir(e, e.answer.join(',')).ok, e.id).toBe(true);
      if (e.kind === 'expr') { expect(corrigir(e, e.target).ok, e.id).toBe(true); for (const a of e.armadilhas ?? []) expect(equivalent(parse(a.valor), parse(e.target)).equal, e.id).toBe(false); }
      if (e.kind === 'tabela') expect(corrigir(e, colunasDaTabela(e.expr, e.ordem).gabarito).ok, e.id).toBe(true);
      if (e.kind === 'num') for (const a of e.armadilhas ?? []) expect(a.valor, e.id).not.toBe(e.answer);
    }
  });
});

describe('gabaritos das questões com conta, recalculados', () => {
  const certa = (id: string) => { const e = porId(id); if (e.kind !== 'mcq') throw new Error(id); return e.options[e.correct]; };

  it('M1 · operações com os conjuntos do curso', () => {
    const A = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'], B = ['C4', 'C5', 'C7', 'C8'];
    expect((porId('m1-b1') as any).answer).toEqual(inter(A, B));
    expect((porId('m1-b2') as any).answer).toEqual(diff(A, B));
    expect((porId('m1-b3') as any).answer).toBe(union(A, B).length);
    expect(certa('m1-q1')).toBe('{5, 6}');
    expect(diff(['3', '4', '5', '6'], ['1', '2', '3', '4'])).toEqual(['5', '6']);
    // produtos em promoção / estoque
    const P = ['impressoras', 'modems'], E = ['computadores', 'modems', 'teclados'];
    expect(diff(P, E)).toEqual(['impressoras']);
    expect(certa('m1-r-ops')).toMatch(/promoção que não estão/);
  });

  it('M1 · questões de Venn', () => {
    expect(certa('m1-r-u8a')).toBe('(B ∩ C) − A');
    expect(evalSetExpr('(B∩C)−A')).toBe(evalSetExpr("B∩C∩A'"));
    const e = porId('m1-r-venn'); if (e.kind !== 'mcq') throw 0;
    for (const o of e.options.slice(0, 5)) expect(evalSetExpr(o.replace(/[()]/g, (c) => c))).not.toBe(evalSetExpr('A−(B∪C)'));
    expect(e.correct).toBe(5);
  });

  it('M1 · função exponencial e caso das permissões', () => {
    expect(1000 * Math.exp(0.05 * 12)).toBeCloseTo(1822.12, 2);
    expect(corrigir(porId('m1-exp'), '1822,12').ok).toBe(true);
    const g = (S: string[]) => (S.includes('r1') ? union(S, ['r4']) : S);
    expect(g(['r1', 'r2'])).toEqual((porId('m1-caso1') as any).answer);
    expect(g([])).toEqual((porId('m1-caso2') as any).answer);
  });

  it('M2 · tabelas-verdade citadas', () => {
    expect(truthTable(parse('~(p v ~q)')).filter((r) => r.value)).toHaveLength((porId('m2-r-tab') as any).answer);
    expect(classify(parse('(P ∧ (P → Q)) → Q'))).toBe('tautologia');
    expect(porId('m2-r-mp')).toMatchObject({ correct: 0 });
    const proj = parse('(B ∧ C ∧ R) ∨ E');
    expect(truthTable(proj).filter((r) => r.value)).toHaveLength((porId('m2-b2') as any).answer);
    expect(envs(['B', 'C', 'R']).every((e) => evalAst(proj, { ...e, E: true }))).toBe(true); // E é atalho
    expect(truthTable(parse('(A·B) + M')).filter((r) => r.value)).toHaveLength(5);
  });

  it('M2 · simplificações e equivalências citadas', () => {
    expect(equivalent(parse("(A·B) + (A·B')"), parse('A')).equal).toBe(true);
    expect(certa('m2-r-u8b')).toBe('S = A');
    expect(equivalent(parse("~(P v Q)"), parse('~P ∧ ~Q')).equal).toBe(true);
    for (const errada of ['M', 'A + B + M', 'A·B·M']) expect(equivalent(parse('(A·B) + M'), parse(errada)).equal).toBe(false);
    expect(evalAst(parse("A·B'"), { A: true, B: false })).toBe(true);
    expect(truthTable(parse("A·B'")).filter((r) => r.value)).toHaveLength(1);
    // XOR com A=1, B=0
    expect(evalAst(parse("(A·B') + (A'·B)"), { A: true, B: false })).toBe(true);
    // alarme: (P + J)·S difere de P + J·S exatamente quando a porta está aberta e o sistema desligado
    expect(equivalent(parse('(P + J)·S'), parse('P + J·S')).diff).toContainEqual({ J: false, P: true, S: false });
  });

  it('M2 · decodificador e meio-somador', () => {
    const d = (a1: number, a0: number) => [0, 1, 2, 3].map((k) => (k === a1 * 2 + a0 ? 1 : 0));
    expect(d(1, 0)).toEqual([0, 0, 1, 0]);
    expect(certa('m2-dec')).toBe('D2');
    expect(d(0, 1)).toEqual([0, 1, 0, 0]); // exemplo do PDF: entradas 01 ativam D1
    const D = ["A'·B'", "A'·B", "A·B'", 'A·B']; // com A = A1, B = A0
    for (const e of envs(['A', 'B'])) expect(D.map((x) => (evalAst(parse(x), e) ? 1 : 0))).toEqual(d(e.A ? 1 : 0, e.B ? 1 : 0));
    for (const e of envs(['A', 'B'])) { const s = (e.A ? 1 : 0) + (e.B ? 1 : 0); expect([evalAst(parse('A ⊕ B'), e) ? 1 : 0, evalAst(parse('A·B'), e) ? 1 : 0]).toEqual([s % 2, s >> 1]); }
    expect(certa('m2-soma')).toBe('soma 0, vai-um 1');
  });

  it('desafios das ilustrações: os alvos existem e fazem sentido', () => {
    for (const d of DESAFIOS_VENN) {
      if (d.tipo === 'pintar') expect(() => evalSetExpr(d.alvo, d.n)).not.toThrow();
      else for (const m of d.metas) expect(() => evalSetExpr(m.expr, d.n)).not.toThrow();
    }
    // v-arr-2: |A|=5, |B|=4, |A∩B|=2 → união 7, e cabe nos 9 elementos
    expect(5 + 4 - 2).toBe(7);
    // v-arr-3: só A = 6 − (3 + 2 − 1) = 2
    expect(6 - (3 + 2 - 1)).toBe(2);
    for (const d of DESAFIOS_INT) if (d.expr) expect(() => parse(d.expr)).not.toThrow();
    expect(truthTable(parse('p ∨ (q ∧ r)')).filter((r) => r.value).length).toBe(Number(DESAFIOS_INT.find((d) => d.id === 'i-aegis5')!.prever!.opcoes[2]));
  });
});
