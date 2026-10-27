// Foco da prova, mapa aberto e calendário: o que a tela inicial promete tem de bater com o regulamento.
import { describe, expect, it } from 'vitest';
import { REGIOES, todasFases } from '../content';
import { FOCO_AGORA, PROVAS, REGRAS_PROVA, focoDoDia } from '../lib/datas';
import { fasesDoFoco, plano, proximaFase, recomendada, regiaoAberta } from '../lib/progresso';
import { estadoInicial } from '../lib/store';

const ids = (foco: 'A1' | 'A2' | 'A3') => new Set(fasesDoFoco(foco).map((f) => f.id));

describe('mapa aberto', () => {
  it('toda região pronta está aberta desde o primeiro dia', () => {
    for (const r of REGIOES.filter((x) => x.pronto)) expect(regiaoAberta(r), r.id).toBe(true);
  });
});

describe('foco da próxima prova', () => {
  it('até 11/11 é A1; de 12/11 a 18/11 é A2; depois, A3', () => {
    expect(focoDoDia('2026-10-27')).toBe('A1');
    expect(focoDoDia('2026-11-11')).toBe('A1');
    expect(focoDoDia('2026-11-12')).toBe('A2');
    expect(focoDoDia('2026-11-18')).toBe('A2');
    expect(focoDoDia('2026-11-19')).toBe('A3');
  });

  it('A1 = M1 a M3, C1, C2, só a U1 da C4 e os simulados A1; nada de U5 em diante', () => {
    const a1 = ids('A1');
    for (const r of ['m1', 'm2', 'm3', 'c1', 'c2']) for (const f of REGIOES.find((x) => x.id === r)!.fases) expect(a1.has(f.id), f.id).toBe(true);
    for (const r of ['m4', 'm5', 'm6', 'm7', 'c3']) for (const f of REGIOES.find((x) => x.id === r)!.fases) expect(a1.has(f.id), f.id).toBe(false);
    const c4 = REGIOES.find((x) => x.id === 'c4')!;
    const u1 = c4.fases.filter((f) => f.unidade === 'U1').map((f) => f.id);
    expect(u1).toEqual(['c4-redes', 'c4-cidade', 'c4-caso', 'c4-questoes-u1']);
    for (const f of c4.fases) expect(a1.has(f.id), f.id).toBe(u1.includes(f.id));
    for (const id of ['ms-a1', 'cs-a1']) expect(a1.has(id), id).toBe(true);
    for (const id of ['ms-a2a', 'ms-a2b', 'cs-a2a', 'cs-a2b']) expect(a1.has(id), id).toBe(false);
  });

  it('A2 e A3 contam tudo', () => {
    const tudo = todasFases().filter((f) => f.regiao.pronto).length;
    expect(ids('A2').size).toBe(tudo);
    expect(ids('A3').size).toBe(tudo);
    expect(ids('A1').size).toBeLessThan(tudo / 2 + 10);
  });

  it('o plano de hoje conta só a A1 e divide até 09/11', () => {
    const s = estadoInicial('2026-10-27');
    const pl = plano(s, '2026-10-27');
    expect(pl.foco).toBe('A1');
    expect(pl.total).toBe(fasesDoFoco('A1').length);
    expect(pl.faltam).toBe(pl.total);
    expect(pl.dias).toBe(14); // 27/10 a 09/11, contando hoje
    expect(pl.meta).toBe('2026-11-09');
    expect(pl.porDia).toBeCloseTo(pl.minutos / 14, 0);
    expect(pl.minutos).toBeLessThan(todasFases().reduce((a, f) => a + f.min, 0) / 2);
  });

  it('feita a fase, ela sai da conta; depois de 11/11 a conta vira "tudo"', () => {
    const s = estadoInicial('2026-10-27');
    const f0 = fasesDoFoco('A1')[0];
    s.fases[f0.id] = { feita: true, melhor: 1, em: '2026-10-27', vezes: 1 };
    expect(plano(s, '2026-10-27').faltam).toBe(fasesDoFoco('A1').length - 1);
    expect(plano(s, '2026-11-12').foco).toBe('A2');
    expect(plano(s, '2026-11-12').total).toBe(ids('A2').size);
    expect(plano(s, '2026-11-12').dias).toBe(5); // até 16/11
  });

  it('a próxima fase sai do foco; não pula para M4 antes da A1 acabar', () => {
    const s = estadoInicial('2026-10-27');
    for (let k = 0; k < 400; k++) {
      const f = proximaFase(s, '2026-10-27');
      if (!f) break;
      if (!ids('A1').has(f.id)) break;
      s.fases[f.id] = { feita: true, melhor: 1, em: '2026-10-27', vezes: 1 };
    }
    expect(fasesDoFoco('A1').every((f) => s.fases[f.id]?.feita)).toBe(true);
    // só depois de cumprido o foco a sugestão sai dele
    expect(['m4-chance', 'c3-autoia']).toContain(proximaFase(s, '2026-10-27')!.id);
  });

  it('a próxima fase alterna entre as duas matérias (a mais atrasada primeiro)', () => {
    const s = estadoInicial('2026-10-27');
    const vistos = new Set<string>();
    for (let k = 0; k < 10; k++) {
      const f = proximaFase(s, '2026-10-27')!;
      vistos.add(f.regiao.mundo);
      s.fases[f.id] = { feita: true, melhor: 1, em: '2026-10-27', vezes: 1 };
    }
    expect(vistos).toEqual(new Set(['mat', 'exp']));
  });

  it('"recomendado agora" marca uma região por mundo', () => {
    const s = estadoInicial('2026-10-27');
    const marcadas = REGIOES.filter((r) => recomendada(r, s, '2026-10-27')).map((r) => r.id);
    expect(marcadas).toEqual(['m1', 'c1']);
  });
});

describe('calendário e regras da prova', () => {
  it('datas conferem com o regulamento 2026.2', () => {
    const p = Object.fromEntries(PROVAS.map((x) => [x.id, x]));
    expect([p.A1.abre, p.A1.fecha]).toEqual(['2026-11-02', '2026-11-11']);
    expect([p.A2.abre, p.A2.fecha]).toEqual(['2026-11-12', '2026-11-18']);
    expect([p.A3.abre, p.A3.fecha]).toEqual(['2026-11-05', '2026-12-02']);
    expect([p.AI.abre, p.AI.fecha]).toEqual(['2026-12-16', '2026-12-17']);
    expect(FOCO_AGORA.A1.meta < FOCO_AGORA.A1.ate).toBe(true);
  });
  it('o cartão de regras traz segunda oportunidade, recursos e a nota da A2', () => {
    const txt = REGRAS_PROVA.flatMap((r) => [r.prova, ...r.linhas]).join('\n');
    for (const t of ['01/12 a 03/12', '08/12 a 10/12', '18/11 a 20/11', '19/11 a 22/11', '2,5 pontos', 'Sem segunda oportunidade', '40 ou mais', 'U1 a U4']) expect(txt, t).toContain(t);
  });
});
