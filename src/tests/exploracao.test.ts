// Mundo 2 (Exploração Digital): as contas e as regras dos brinquedos, e a integridade dos desafios.
import { describe, expect, it } from 'vitest';
import { CAMADAS, DESAFIOS_CANO, DESAFIOS_PILHA, DESAFIOS_SILOS, MODELOS_NUVEM, divergencias, limiteJanela, modeloAtual, operar, vazao, type EstadoSilos } from '../components/toys/Exp1';
import { GERADORES } from '../engine/geradores';
import { rng } from '../lib/rng';

describe('C1 · cano de dados e pilha da nuvem', () => {
  it('janela de 64 KiB com 200 ms de ida e volta limita a 2,6 Mbps, seja qual for a banda', () => {
    expect(64 * 1024 * 8).toBe(524288);
    expect(limiteJanela(64, 200)).toBeCloseTo(2.62, 2);
    expect(vazao({ banda: 1000, lat: 200, janela: 64 })).toBeCloseTo(2.62, 2);
    expect(vazao({ banda: 1, lat: 5, janela: 1024 })).toBe(1); // aqui o gargalo é a banda
    expect(800 / 40).toBe(20); // 100 MB a 40 Mbps
  });
  it('modelos de serviço: o provedor assume de baixo para cima, sem buracos', () => {
    expect(CAMADAS).toHaveLength(7);
    for (const m of MODELOS_NUVEM) expect(modeloAtual({ prov: CAMADAS.map((_, i) => i >= m.voce) })?.id).toBe(m.id);
    expect(modeloAtual({ prov: [false, false, false, true, false, true, true] })).toBeUndefined();
    expect(MODELOS_NUVEM.map((m) => m.voce)).toEqual([7, 4, 2, 0]);
  });
  it('desafios do cano e da pilha', () => {
    for (const d of [...DESAFIOS_CANO, ...DESAFIOS_PILHA] as any[]) expect(d.falta(d.ini), d.id).not.toBeNull();
    const ok = (lista: any[], id: string, s: object) => { const d = lista.find((x) => x.id === id); expect(d.falta({ ...d.ini, ...s }), id).toBeNull(); };
    ok(DESAFIOS_CANO, 'cn-video', { lat: 60 }); ok(DESAFIOS_CANO, 'cn-janela', { janela: 4096 }); ok(DESAFIOS_CANO, 'cn-download', { banda: 100, lat: 20, janela: 1024 });
    expect(DESAFIOS_CANO.find((d) => d.id === 'cn-janela')!.falta({ banda: 1000, lat: 200, janela: 1024 })).not.toBeNull(); // 41,9 Mbps ainda não chega
    ok(DESAFIOS_PILHA, 'pn-iaas', { prov: CAMADAS.map((_, i) => i >= 4) }); ok(DESAFIOS_PILHA, 'pn-paas', { prov: CAMADAS.map((_, i) => i >= 2) }); ok(DESAFIOS_PILHA, 'pn-saas', { prov: CAMADAS.map(() => true) });
  });
});

describe('C2 · empresa com silos', () => {
  const ini = DESAFIOS_SILOS[0].ini;
  it('em silo, cada setor só vê as próprias operações; integrado, todos veem a realidade', () => {
    let s: EstadoSilos = operar(ini, 'vender');
    expect(s.real).toEqual({ saldo: 2, vendas: 1 }); expect(s.visoes.vendas).toEqual(s.real); expect(s.visoes.estoque).toEqual({ saldo: 3, vendas: 0 });
    expect(divergencias(s)).toBe(2);
    s = operar(s, 'receber'); expect(s.real.saldo).toBe(7); expect(divergencias(s)).toBe(3);
    s = operar(s, 'planilha'); expect(divergencias(s)).toBe(0); expect(s.retrabalho).toBe(1);
    s = operar(operar(s, 'integrar'), 'vender'); expect(divergencias(s)).toBe(0); expect(s.opsIntegradas).toBe(1);
  });
  it('venda sem estoque acontece quando a visão do vendedor está velha', () => {
    const d = DESAFIOS_SILOS.find((x) => x.id === 'si-atraso')!;
    let s = operar(d.ini, 'vender'); expect(s.atrasos).toBe(0);
    s = operar(s, 'vender'); expect(s.atrasos).toBe(1); expect(d.falta(s)).toBeNull();
  });
  it('desafios dos silos', () => {
    for (const d of DESAFIOS_SILOS) expect(d.falta(d.ini), d.id).not.toBeNull();
    expect(DESAFIOS_SILOS[0].falta(operar(operar(ini, 'vender'), 'receber'))).toBeNull();
    const d3 = DESAFIOS_SILOS.find((x) => x.id === 'si-integra')!;
    let s = operar(d3.ini, 'integrar'); for (let i = 0; i < 4; i++) s = operar(s, i % 2 ? 'receber' : 'vender');
    expect(d3.falta(s)).toBeNull(); expect(divergencias(s)).toBe(0);
  });
});

describe('geradores de Exploração', () => {
  it('c1.vazao: tempo de download e limite da janela recalculados', () => {
    for (let i = 0; i < 150; i++) {
      const e = GERADORES['c1.vazao'](rng(i * 7919 + 13), i % 3) as any;
      const ns = [...e.prompt.matchAll(/\*\*(\d+) (Mbps|MB|KiB|ms)\*\*/g)].map((m: RegExpMatchArray) => [Number(m[1]), m[2]] as [number, string]);
      const v = (u: string) => ns.find((x) => x[1] === u)![0];
      expect(e.answer).toBeCloseTo(e.unidade === 's' ? (v('MB') * 8) / v('Mbps') : limiteJanela(v('KiB'), v('ms')), 6);
    }
  });
});

// ---------------- C3 ----------------
import { DESAFIOS_GERADOR, DESAFIOS_SPAM, DESAFIOS_TREINO, classificador, repete, treinar } from '../components/toys/Exp2';
import { CORPORA, PONTOS, TESTE, TREINO, acertos, bigramas, dados, erro, melhorReta, pesos, porModelo, porRegra, proximas } from '../lib/aprendizado';

describe('C3 · modelos de brinquedo', () => {
  it('a reta: treinar diminui o erro e chega perto da melhor reta; um dado estranho entorta', () => {
    let s = { a: 0, b: 0, passos: 0, estranho: false };
    const e0 = erro(s.a, s.b, PONTOS);
    s = treinar(s, 2); expect(erro(s.a, s.b, PONTOS)).toBeLessThan(0.25); expect(erro(s.a, s.b, PONTOS)).toBeLessThan(e0);
    const [ma, mb] = melhorReta(PONTOS); expect(ma).toBeCloseTo(2, 0); expect(erro(ma, mb, PONTOS)).toBeLessThan(0.2);
    const t = treinar({ a: ma, b: mb, passos: 0, estranho: true }, 300);
    expect(t.a).toBeLessThan(1.8); expect(erro(t.a, t.b, PONTOS)).toBeGreaterThan(1); // piorou para os dados bons
    expect(erro(2, 1, PONTOS)).toBeCloseTo(0.12375, 5);
    expect(dados(true)).toHaveLength(9);
  });
  it('spam: regra boa e modelo aprendido acertam 4 de 4; rótulos errados ensinam o erro', () => {
    expect(acertos(TESTE, (m) => porRegra(m, ['grátis', 'promoção', 'clique']))).toBe(4);
    expect(acertos(TESTE, (m) => porRegra(m, ['urgente']))).toBeLessThan(4);
    const w = pesos(TREINO.map((m) => ({ m, rotulo: m.spam })));
    expect(w).toMatchObject({ grátis: 2, promoção: 2, clique: 2, urgente: 0, reunião: -2, pix: -1 });
    expect(acertos(TESTE, (m) => porModelo(m, w))).toBe(4);
    const torto = { modo: 'ia' as const, regra: [], rotulos: TREINO.map((m) => m.spam || m.palavras.includes('reunião')) };
    expect(classificador(torto)(TESTE[1])).toBe(true); // "Reunião urgente amanhã cedo" barrada
  });
  it('gerador: as chances somam 1 e a escolha gulosa entra em círculo', () => {
    for (const c of CORPORA) { const t = bigramas(c.frases); for (const p of Object.keys(t)) expect(proximas(t, p).reduce((a, o) => a + o.prob, 0)).toBeCloseTo(1, 10); }
    const t = bigramas([...CORPORA[0].frases, ...CORPORA[1].frases]);
    const texto = ['o'];
    for (let i = 0; i < 12 && !repete(texto); i++) { const u = texto[texto.length - 1]; texto.push(u === '.' ? 'a' : proximas(t, u)[0].p); }
    expect(repete(texto)).toBe(true);
    expect(proximas(bigramas(CORPORA[0].frases), 'o').map((o) => o.p)).toEqual(['louvor', 'pastor']);
  });
  it('desafios da C3 começam por resolver e têm solução', () => {
    for (const d of [...DESAFIOS_TREINO, ...DESAFIOS_SPAM, ...DESAFIOS_GERADOR] as any[]) expect(d.falta(d.ini), d.id).not.toBeNull();
    const ok = (lista: any[], id: string, s: object) => { const d = lista.find((x) => x.id === id); expect(d.falta({ ...d.ini, ...s }), id).toBeNull(); };
    ok(DESAFIOS_TREINO, 'tr-mao', { a: 2, b: 1 });
    expect(DESAFIOS_TREINO[1].falta(treinar(DESAFIOS_TREINO[1].ini, 3))).toBeNull();
    expect(DESAFIOS_TREINO[2].falta(treinar({ ...DESAFIOS_TREINO[2].ini, estranho: true }, 300))).toBeNull();
    ok(DESAFIOS_SPAM, 'sp-regra', { regra: ['grátis', 'clique'] }); ok(DESAFIOS_SPAM, 'sp-modelo', { modo: 'ia' });
    ok(DESAFIOS_SPAM, 'sp-vies', { rotulos: TREINO.map((m) => m.spam || m.palavras.includes('reunião')) });
    ok(DESAFIOS_GERADOR, 'ge-frase', { texto: ['o', 'pastor', 'ora', 'pela', 'igreja'] });
    ok(DESAFIOS_GERADOR, 'ge-prompt', { corpus: 1, texto: ['a', 'rede', 'liga', 'o', 'servidor'] });
  });
});
