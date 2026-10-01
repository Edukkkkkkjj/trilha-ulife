// Contagem: as fórmulas batem com a contagem das folhas da árvore, e os números citados na M3 são recalculados.
import { describe, expect, it } from 'vitest';
import { MAX_FOLHAS, anagramas, arranjo, comb, fat, grupos, montar, numFolhas, totalPelaFormula, type EstadoArvore } from '../lib/contagem';
import { DESAFIOS_ARVORE } from '../components/toys/Arvore';
import { GERADORES } from '../engine/geradores';
import { rng } from '../lib/rng';
import { M3 } from '../content/mat/m3';
import type { Ex } from '../engine/types';

const distintos = (s: EstadoArvore) => grupos(montar(s).folhas).length;
const fixos: Ex[] = M3.fases.flatMap((f) => f.steps.flatMap((s) => (s.t === 'ex' ? [s.ex] : [])));
const porId = (id: string) => { const e = fixos.find((x) => x.id === id); if (!e) throw new Error('não achei ' + id); return e as any; };

describe('fórmulas de contagem', () => {
  it('fatorial, arranjo, combinação e anagramas nos valores do curso', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(fat)).toEqual([1, 1, 2, 6, 24, 120, 720]);
    expect(fat(10)).toBe(3628800);
    expect(arranjo(10, 3)).toBe(720);
    expect(arranjo(5, 3)).toBe(60);
    expect(arranjo(10, 4)).toBe(5040);
    expect(comb(6, 3)).toBe(20);
    expect(comb(5, 2)).toBe(10);
    expect(comb(8, 3)).toBe(56);
    expect(comb(10, 3)).toBe(comb(10, 7));
    expect(anagramas('BANANA')).toBe(60);
    expect(anagramas('LOGICA')).toBe(720);
    expect(anagramas('ARARAS')).toBe(60);
    expect(anagramas('BALANÇA')).toBe(840);
    expect(anagramas('ALFABETO')).toBe(20160);
    expect(anagramas('COMPUTADOR')).toBe(1814400); // dois O: não são "10 letras distintas"
  });

  it('a árvore conta o mesmo que a fórmula, em todos os casos que cabem no desenho', () => {
    for (let n = 1; n <= 6; n++) for (let p = 1; p <= 4; p++) for (const repete of [false, true]) for (const ordem of [false, true]) {
      if (!repete && p > n) continue;
      const s: EstadoArvore = { tipo: 'escolha', n, p, repete, ordem };
      if (numFolhas(s) > MAX_FOLHAS) continue;
      expect(montar(s).folhas.length, JSON.stringify(s)).toBe(numFolhas(s));
      expect(distintos(s), JSON.stringify(s)).toBe(totalPelaFormula(s));
    }
    for (const palavra of ['SOL', 'OVO', 'ANA', 'CASA', 'ARAR', 'AAAA', 'DADO']) expect(distintos({ tipo: 'palavra', palavra }), palavra).toBe(anagramas(palavra));
    const camp: EstadoArvore = { tipo: 'etapas', etapas: [{ nome: 'produto', n: 5 }, { nome: 'canal', n: 4 }, { nome: 'oferta', n: 3 }] };
    expect(distintos(camp)).toBe(60);
  });

  it('todo desafio da árvore começa sem estar resolvido e cabe no desenho', () => {
    for (const d of DESAFIOS_ARVORE) {
      expect(numFolhas(d.ini), d.id).toBeLessThanOrEqual(MAX_FOLHAS);
      expect(d.falta(d.ini, distintos(d.ini)), d.id).not.toBeNull();
    }
    const resolve = (id: string, s: EstadoArvore) => expect(DESAFIOS_ARVORE.find((d) => d.id === id)!.falta(s, distintos(s)), id).toBeNull();
    resolve('a-doze', { tipo: 'etapas', etapas: [{ nome: 'a', n: 2 }, { nome: 'b', n: 2 }, { nome: 'c', n: 3 }] });
    resolve('a-campanha', { tipo: 'etapas', etapas: [{ nome: 'produto', n: 5 }, { nome: 'canal', n: 4 }, { nome: 'oferta', n: 3 }] });
    resolve('a-podio', { tipo: 'escolha', n: 5, p: 3, repete: false, ordem: true });
    resolve('a-comissao', { tipo: 'escolha', n: 5, p: 3, repete: false, ordem: false });
    resolve('a-espelho', { tipo: 'escolha', n: 5, p: 3, repete: false, ordem: false });
    resolve('a-ana', { tipo: 'palavra', palavra: 'OVO' });
  });
});

describe('M3 · gabaritos recalculados', () => {
  const certa = (id: string) => { const e = porId(id); return e.options[e.correct] as string; };

  it('questões do curso', () => {
    expect(porId('m3-r-senhas').answer).toBe(26 * 10 * 4 * 26 * 16);
    expect(certa('m3-q6')).toBe(String(fat(8) / fat(2)));
    expect(certa('m3-q11')).toBe(String(comb(5, 2)));
    expect(certa('m3-r-balanca')).toContain(String(fat(7) / fat(3)));
    expect(certa('m3-r-araras')).toMatch(/^60 /);
    expect(certa('m3-r-computador')).toContain('3.628.800');
    expect(certa('m3-q5')).toBe('Verdadeiro');
  });

  it('chefão Tech-Life', () => {
    expect(porId('m3-b1').answer).toBe(3 * 10 * 6);
    expect(porId('m3-b2').answer).toBe(comb(6, 3));
    expect(porId('m3-b3').answer).toBe(arranjo(10, 3));
    expect(porId('m3-b4').answer).toBe(fat(3));
  });

  it('geradores: resposta recalculada a partir do enunciado', () => {
    for (let i = 0; i < 200; i++) {
      const s = i * 7919 + 13;
      const an = GERADORES['m3.anag'](rng(s), i % 3) as any;
      expect(an.answer).toBe(anagramas(/\*\*(.+?)\*\*/.exec(an.prompt)![1]));
      const ac = GERADORES['m3.ac'](rng(s), i % 3) as any;
      const [p, n] = [...ac.prompt.matchAll(/\*\*(\d+)\*\*/g)].map((m: RegExpMatchArray) => Number(m[1])).sort((a, b) => a - b); // n é sempre o maior
      const ultimo = ac.passos.filter((x: any) => x.pede).at(-1).pede.resposta;
      expect(ultimo).toBe(ac.topic === 'm3.arranjo' ? arranjo(n, p) : comb(n, p));
      const pr = GERADORES['m3.princ'](rng(s), i % 3) as any;
      const ns = [...pr.prompt.matchAll(/\*\*(\d+)\*\*/g)].map((m: RegExpMatchArray) => Number(m[1]));
      expect(pr.answer).toBe(/\*\*ou\*\*/.test(pr.prompt) ? ns.reduce((a, b) => a + b, 0) : ns.reduce((a, b) => a * b, 1));
    }
  });
});
