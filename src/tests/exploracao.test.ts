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
