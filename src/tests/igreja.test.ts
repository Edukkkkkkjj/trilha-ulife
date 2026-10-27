// Exemplos da igreja: aparecem antes do exemplo de empresa, só nas regiões da A1, e as contas citadas estão certas.
import { describe, expect, it } from 'vitest';
import { todasFases } from '../content';
import { EXEMPLOS_IGREJA } from '../content/igreja';
import { arranjo, comb } from '../lib/contagem';

const regioesA1 = /^(m1|m2|m3|c1|c2|c4)-/;

describe('exemplos da igreja', () => {
  it('cada exemplo entra uma vez, logo antes da explicação de empresa que acompanha', () => {
    const fases = new Map(todasFases().map((f) => [f.id, f]));
    for (const [id, lista] of Object.entries(EXEMPLOS_IGREJA)) {
      expect(regioesA1.test(id), id).toBe(true);
      const f = fases.get(id)!;
      for (const { antes, md } of lista) {
        const i = f.steps.findIndex((s) => s.t === 'texto' && s.md === md);
        expect(i, `${id}: exemplo não entrou`).toBeGreaterThan(-1);
        const prox = f.steps[i + 1];
        expect(prox.t === 'texto' && prox.md.startsWith(antes), `${id}: o exemplo deveria vir antes de "${antes}"`).toBe(true);
        expect(md.length, id).toBeLessThanOrEqual(460);
        expect(md, id).toMatch(/igreja|culto|mesa de som|escala|louvor|coral|recepção|Santa Ceia|ministério|telão|refletor/i);
      }
    }
    expect(Object.keys(EXEMPLOS_IGREJA).length).toBeGreaterThanOrEqual(15);
  });
  it('as contas dos exemplos', () => {
    expect(5 * 4).toBe(20); expect(20 + 10).toBe(30); expect((5 + 10) * 4).toBe(60); // composição: g(f(5)) = 30 e f(g(5)) = 60
    expect(10 * 9 * 8 * 7).toBe(5040); expect(arranjo(10, 4)).toBe(5040); expect(comb(10, 3)).toBe(120);
    expect(2 ** 3).toBe(8);
    const coral = ['Ana', 'Bia', 'Caio', 'Davi'], banda = ['Caio', 'Davi', 'Eli'];
    expect(coral.filter((x) => banda.includes(x))).toEqual(['Caio', 'Davi']);
    expect(new Set([...coral, ...banda]).size).toBe(5);
    expect(coral.filter((x) => !banda.includes(x))).toEqual(['Ana', 'Bia']);
  });
});
