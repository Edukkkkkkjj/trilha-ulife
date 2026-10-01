// Salvar, carregar, migrar, exportar e importar o progresso. E a revisão espaçada.
import { describe, expect, it } from 'vitest';
import { CHAVE, VERSAO, criarLoja, estadoInicial, memoria, migrar } from '../lib/store';
import { INTERVALO, contarPorCaixa, revisaoDoDia, revisar } from '../lib/leitner';
import { diasEntre, hoje, proximaProva, situacoes, somaDias } from '../lib/datas';

const DIA = '2026-10-01';

describe('salvamento do progresso', () => {
  it('fecha e reabre: tudo continua lá', () => {
    const disco = memoria();
    const a = criarLoja(disco, () => DIA);
    a.concluirFase('m1-conj', 0.9, 50);
    a.registrarExercicio('m1.operacoes', 1);
    a.registrarExercicio('m1.operacoes', 0);
    a.registrarErro({ exId: 'x1', faseId: 'm1-conj', topic: 'm1.operacoes', prompt: 'p', dada: '10', certa: '8', explica: 'e', causa: 'conceito' });
    a.revisarCard('m1-c1', true);
    a.anotar({ tag: 'estalo', texto: 'entendi a interseção', faseId: 'm1-conj' });
    a.escreverA3('mat', '1', 'meu texto');
    a.definirTema('escuro');
    a.guardarAndamento('m1-venn', 2);
    a.guardarBrinquedo('livre-venn', { n: 2, itens: [] });
    a.liberar('m2');

    const b = criarLoja(disco, () => '2026-10-04'); // "três dias depois, reabrindo"
    const s = b.get();
    expect(s.v).toBe(VERSAO);
    expect(s.fases['m1-conj']).toMatchObject({ feita: true, melhor: 0.9 });
    expect(s.xp).toBe(52);
    expect(s.topicos['m1.operacoes']).toEqual({ ok: 1, total: 2 });
    expect(s.erros).toHaveLength(1);
    expect(s.cards['m1-c1']).toEqual({ box: 1, due: somaDias(DIA, 1) });
    expect(s.diario[0].texto).toBe('entendi a interseção');
    expect(s.a3.mat['1']).toBe('meu texto');
    expect(s.tema).toBe('escuro');
    expect(s.andamento['m1-venn']).toBe(2);
    expect(s.brinquedos['livre-venn']).toEqual({ n: 2, itens: [] });
    expect(s.liberadas).toEqual(['m2']);
    expect(s.dias).toEqual([DIA]);
    expect(s.ultimaVisita).toBe(DIA);
  });

  it('refazer uma fase guarda a melhor nota e dá só uma parte do XP', () => {
    const l = criarLoja(memoria(), () => DIA);
    l.concluirFase('f', 0.6, 40);
    l.concluirFase('f', 0.9, 40);
    l.concluirFase('f', 0.5, 40);
    expect(l.get().fases.f).toMatchObject({ melhor: 0.9, vezes: 3 });
    expect(l.get().xp).toBe(40 + 10 + 10);
  });

  it('erro repetido no mesmo exercício não duplica; resolver marca como resolvido', () => {
    const l = criarLoja(memoria(), () => DIA);
    const e = { exId: 'q', faseId: 'f', topic: 't', prompt: '', dada: '1', certa: '2', explica: '' };
    l.registrarErro(e); l.registrarErro({ ...e, dada: '3' });
    expect(l.get().erros).toHaveLength(1);
    expect(l.get().erros[0].dada).toBe('3');
    l.definirCausa(l.get().erros[0].id, 'conta');
    l.resolverPorExercicio('q');
    expect(l.get().erros[0]).toMatchObject({ resolvido: true, causa: 'conta' });
  });

  it('migra o formato antigo (v0, do Caderno de Matemática) sem perder o diário', () => {
    const v0 = { done: { m1a: true }, ex: { 'm1-0': 'ok' }, diario: 'Errei o 3 de contagem porque achei que ordem não importava.', ts: Date.UTC(2026, 8, 20, 15) };
    const s = migrar(v0);
    expect(s.v).toBe(VERSAO);
    expect(s.diario).toHaveLength(1);
    expect(s.diario[0].texto).toMatch(/ordem não importava/);
    expect(s.dias).toEqual([]);
    expect(s.liberadas).toEqual([]);
    expect(s.a3).toEqual({ mat: {}, exp: {} });
  });

  it('migra a v1 (sem "dias" nem "liberadas") preservando o resto', () => {
    const v1: any = { ...estadoInicial(DIA), v: 1, xp: 300, fases: { a: { feita: true, melhor: 1, em: DIA, vezes: 1 } } };
    delete v1.dias; delete v1.liberadas;
    const s = migrar(v1);
    expect(s).toMatchObject({ v: VERSAO, xp: 300, dias: [], liberadas: [] });
    expect(s.fases.a.feita).toBe(true);
  });

  it('ao abrir um save antigo, guarda uma cópia do original antes de converter', () => {
    const antigo = JSON.stringify({ ...estadoInicial(DIA), v: 1, xp: 7 });
    const disco = memoria({ [CHAVE]: antigo });
    const l = criarLoja(disco, () => DIA);
    expect(l.get().xp).toBe(7);
    expect(disco.dados[`${CHAVE}:antes-da-v${VERSAO}`]).toBe(antigo);
  });

  it('recusa save de versão mais nova do que o jogo, com mensagem clara', () => {
    expect(() => migrar({ v: VERSAO + 1 })).toThrow(/versão mais nova/);
    expect(() => migrar(null)).toThrow(/inválido/);
  });

  it('save corrompido: não descarta, guarda cópia e avisa', () => {
    const disco = memoria({ [CHAVE]: '{isto não é json' });
    const l = criarLoja(disco, () => DIA);
    expect(l.get().xp).toBe(0);
    expect(disco.dados[`${CHAVE}:nao-lido`]).toBe('{isto não é json');
    expect(l.aviso()).toMatch(/Não consegui ler/);
  });

  it('exportar e importar: do PC para o celular', () => {
    const pc = criarLoja(memoria(), () => DIA);
    pc.concluirFase('m1-conj', 1, 60);
    pc.anotar({ tag: 'duvida', texto: 'por que 2^n?' });
    const arquivo = pc.exportar();
    expect(pc.get().ultimoBackup).toBe(DIA);
    expect(JSON.parse(arquivo)).toMatchObject({ app: 'trilha-ulife', v: VERSAO });

    const discoCel = memoria();
    const cel = criarLoja(discoCel, () => DIA);
    cel.concluirFase('outra', 0.5, 10);
    cel.importar(arquivo);
    expect(cel.get().fases['m1-conj'].feita).toBe(true);
    expect(cel.get().fases.outra).toBeUndefined();
    expect(cel.get().diario[0].texto).toBe('por que 2^n?');
    expect(JSON.parse(discoCel.dados[`${CHAVE}:antes-de-importar`]).fases.outra.feita).toBe(true); // cópia do que havia antes
    // e o importado sobrevive a reabrir
    expect(criarLoja(discoCel, () => DIA).get().fases['m1-conj'].feita).toBe(true);
  });

  it('importar recusa arquivos que não são backup da Trilha', () => {
    const l = criarLoja(memoria(), () => DIA);
    l.concluirFase('f', 1, 10);
    expect(() => l.importar('não é json')).toThrow(/não é um backup/);
    expect(() => l.importar(JSON.stringify({ app: 'outro', estado: {} }))).toThrow(/não é um backup/);
    expect(l.get().fases.f.feita).toBe(true); // o progresso atual ficou intacto
  });

  it('funciona mesmo se o navegador bloquear o armazenamento', () => {
    const bloqueado = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('cheio'); } };
    const l = criarLoja(bloqueado, () => DIA);
    l.concluirFase('f', 1, 10);
    expect(l.get().fases.f.feita).toBe(true);
    expect(l.aviso()).toMatch(/não deixou salvar/);
  });

  it('avisa quem está assinando quando o estado muda', () => {
    const l = criarLoja(memoria(), () => DIA);
    let n = 0;
    const sair = l.assinar(() => n++);
    l.definirTema('claro'); l.anotar({ tag: 'livre', texto: 'x' });
    sair();
    l.definirTema('escuro');
    expect(n).toBe(2);
  });
});

describe('revisão espaçada (Leitner)', () => {
  it('acertou sobe de caixa, errou volta para a 1', () => {
    let c = revisar(undefined, true, DIA);
    expect(c).toEqual({ box: 1, due: somaDias(DIA, 1) });
    c = revisar(c, true, DIA); c = revisar(c, true, DIA);
    expect(c).toEqual({ box: 3, due: somaDias(DIA, INTERVALO[3]) });
    c = revisar(c, false, DIA);
    expect(c).toEqual({ box: 1, due: DIA });
    for (let i = 0; i < 10; i++) c = revisar(c, true, DIA);
    expect(c.box).toBe(5);
  });

  it('a revisão do dia mistura as duas disciplinas, respeita o máximo e o limite de novos', () => {
    const cartas = [...Array.from({ length: 10 }, (_, i) => ({ id: 'm' + i, mundo: 'mat' })), ...Array.from({ length: 10 }, (_, i) => ({ id: 'e' + i, mundo: 'exp' }))];
    const estados = Object.fromEntries(cartas.slice(0, 4).concat(cartas.slice(10, 14)).map((c) => [c.id, { box: 1, due: DIA }]));
    const hojeLista = revisaoDoDia(cartas, estados, DIA, 12, 5);
    expect(hojeLista.length).toBe(12);
    expect(hojeLista.filter((c) => !estados[c.id]).length).toBe(4); // 8 vencidos + 4 novos = 12
    const mundos = hojeLista.map((c) => c.mundo);
    expect(mundos.filter((m) => m === 'mat').length).toBeGreaterThanOrEqual(4);
    expect(mundos.filter((m) => m === 'exp').length).toBeGreaterThanOrEqual(4);
    expect(mundos.slice(0, 4)).not.toEqual(['mat', 'mat', 'mat', 'mat']);
    // cartão que só vence amanhã não entra
    expect(revisaoDoDia([{ id: 'a', mundo: 'mat' }], { a: { box: 2, due: somaDias(DIA, 1) } }, DIA)).toEqual([]);
    expect(contarPorCaixa(cartas.map((c) => c.id), estados)).toEqual([12, 8, 0, 0, 0, 0]);
  });
});

describe('calendário das provas', () => {
  it('conta os dias certos a partir de 1º de outubro', () => {
    const s = Object.fromEntries(situacoes('2026-10-01').map((x) => [x.prova.id, x]));
    expect(s.A1).toMatchObject({ estado: 'futura', dias: 32 });
    expect(s.A2).toMatchObject({ estado: 'futura', dias: 42 });
    expect(s.A3).toMatchObject({ estado: 'futura', dias: 35 });
    expect(proximaProva('2026-10-01')!.prova.id).toBe('A1');
  });
  it('durante a janela mostra "aberta" e quantos dias faltam para fechar', () => {
    const s = Object.fromEntries(situacoes('2026-11-10').map((x) => [x.prova.id, x]));
    expect(s.A1).toMatchObject({ estado: 'aberta', dias: 1 });
    expect(s.A3).toMatchObject({ estado: 'aberta', dias: 22 });
    expect(situacoes('2026-12-20').every((x) => x.estado === 'encerrada')).toBe(true);
  });
  it('contas com datas', () => {
    expect(diasEntre('2026-10-30', '2026-11-02')).toBe(3);
    expect(somaDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(hoje(new Date(2026, 9, 1, 23, 59))).toBe('2026-10-01');
  });
});
