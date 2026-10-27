// "Como isso cai": toda aula termina com o cartão, e o cartão tem as três provas.
import { describe, expect, it } from 'vitest';
import { REGIOES, todasFases } from '../content';
import { CAI } from '../content/cai';

describe('cartão "Como isso cai"', () => {
  it('toda aula (e a Aula 5 de Matemática, que é laboratório) termina com o cartão', () => {
    const aulas = todasFases().filter((f) => f.tipo === 'licao' || f.id === 'm1-func');
    expect(aulas.length).toBe(52);
    for (const f of aulas) {
      const ultimo = f.steps[f.steps.length - 1];
      expect(ultimo.t, f.id).toBe('cai');
    }
  });
  it('só aula tem cartão, e nenhum cartão fica órfão', () => {
    const ids = new Set(todasFases().map((f) => f.id));
    for (const id of Object.keys(CAI)) expect(ids.has(id), id).toBe(true);
    for (const f of todasFases()) {
      const n = f.steps.filter((s) => s.t === 'cai').length;
      expect(n, f.id).toBe(CAI[f.id] ? 1 : 0);
    }
  });
  it('as linhas são curtas e a A1 avisa quando o assunto não cai nela', () => {
    for (const [id, [a1, a2, a3]] of Object.entries(CAI)) {
      for (const l of [a1, a2, a3]) { expect(l.length, id).toBeGreaterThan(20); expect(l.length, id).toBeLessThanOrEqual(210); }
    }
    const foraDaA1 = ['m4', 'm5', 'm6', 'm7', 'c3'];
    for (const [id, [a1]] of Object.entries(CAI)) {
      const fora = foraDaA1.some((r) => id.startsWith(r + '-')) || ['c4-ecossistema', 'c4-startups', 'c4-etica', 'c4-lgpd'].includes(id);
      expect(a1.startsWith('Não cai na A1'), id).toBe(fora);
    }
  });
  it('as regiões prontas continuam as mesmas', () => {
    expect(REGIOES.map((r) => r.id)).toEqual(['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'ms', 'c1', 'c2', 'c3', 'c4', 'cs']);
  });
});
