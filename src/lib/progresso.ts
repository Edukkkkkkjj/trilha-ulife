// Contas sobre o progresso: o que falta, o que está fraco, o que fazer hoje.
import { REGIOES, todosCards, todasFases, regiaoDoTopico } from '../content';
import type { Card, Phase, Regiao } from '../engine/types';
import type { Estado } from './store';
import { diasEntre, FOCO_AGORA, focoDoDia, hoje, type Foco } from './datas';
import { revisaoDoDia } from './leitner';

export function progressoRegiao(r: Regiao, s: Estado) {
  const feitas = r.fases.filter((f) => s.fases[f.id]?.feita);
  const media = feitas.length ? feitas.reduce((a, f) => a + s.fases[f.id].melhor, 0) / feitas.length : 0;
  return { feitas: feitas.length, total: r.fases.length, media, completa: r.fases.length > 0 && feitas.length === r.fases.length };
}

/** Toda região pronta está aberta: a ordem é uma sugestão (ver `recomendada`), nunca um bloqueio. */
export const regiaoAberta = (r: Regiao): boolean => r.pronto;

/** Regiões inteiras que caem na A1 (U1 a U4 de cada disciplina). Na C4, só as fases marcadas com a unidade U1. */
const REGIOES_A1 = ['m1', 'm2', 'm3', 'c1', 'c2'];
export function fasesDoFoco(foco: Foco): (Phase & { regiao: Regiao })[] {
  const prontas = todasFases().filter((f) => f.regiao.pronto);
  if (foco !== 'A1') return prontas;
  return prontas.filter((f) => REGIOES_A1.includes(f.regiao.id) || f.unidade === 'U1' || f.prova?.id === 'A1');
}
export const noFoco = (f: Phase & { regiao: Regiao }, foco: Foco) => fasesDoFoco(foco).some((x) => x.id === f.id);

/** Próxima fase a fazer: a que está em andamento ou, no foco de hoje, a primeira que falta do mundo mais atrasado. */
export function proximaFase(s: Estado, dia = hoje()): (Phase & { regiao: Regiao }) | undefined {
  const emAndamento = Object.keys(s.andamento)[0];
  const todas = todasFases();
  const andando = todas.find((f) => f.id === emAndamento);
  if (andando) return andando;
  const foco = fasesDoFoco(focoDoDia(dia));
  const faltam = (lista: typeof foco) => lista.filter((f) => !s.fases[f.id]?.feita);
  const porMundo = (['mat', 'exp'] as const).map((m) => foco.filter((f) => f.regiao.mundo === m)).filter((l) => faltam(l).length);
  if (porMundo.length) {
    const atrasado = porMundo.sort((a, b) => faltam(b).length / b.length - faltam(a).length / a.length)[0];
    return faltam(atrasado)[0];
  }
  return todas.find((f) => f.regiao.pronto && !s.fases[f.id]?.feita);
}

/** Região sugerida agora: a primeira de cada mundo que ainda tem fase do foco por fazer. */
export function recomendada(r: Regiao, s: Estado, dia = hoje()): boolean {
  const foco = fasesDoFoco(focoDoDia(dia));
  const falta = (x: Regiao) => foco.some((f) => f.regiao.id === x.id && !s.fases[f.id]?.feita);
  const primeira = REGIOES.filter((x) => x.mundo === r.mundo && x.pronto).find(falta);
  return primeira?.id === r.id;
}

export const estrelas = (nota: number) => (nota >= 0.9 ? 3 : nota >= 0.7 ? 2 : 1);
export const nivel = (xp: number) => Math.floor(Math.sqrt(xp / 60)) + 1;
export const xpDoNivel = (n: number) => 60 * (n - 1) ** 2;

export function dominio(s: Estado, topico: string): number | null {
  const t = s.topicos[topico];
  return t && t.total > 0 ? t.ok / t.total : null;
}

/** O tópico em que você mais erra (com pelo menos 3 exercícios feitos). */
export function topicoMaisFraco(s: Estado): { topico: string; dom: number; total: number } | undefined {
  return Object.entries(s.topicos)
    .filter(([, t]) => t.total >= 3)
    .map(([topico, t]) => ({ topico, dom: t.ok / t.total, total: t.total }))
    .filter((x) => x.dom < 0.8)
    .sort((a, b) => a.dom - b.dom)[0];
}

/** Cartões que já podem entrar na revisão: Exploração inteira + regiões de Matemática que você começou. */
export function cardsDisponiveis(s: Estado): Card[] {
  return todosCards().filter((c) => c.mundo === 'exp' || REGIOES.find((r) => r.id === c.regiao)!.fases.some((f) => s.fases[f.id]?.feita));
}
export function revisaoDeHoje(s: Estado, max = 12): Card[] {
  const disp = cardsDisponiveis(s);
  const ids = revisaoDoDia(disp, s.cards, hoje(), max);
  return ids.map((x) => disp.find((c) => c.id === x.id)!);
}

/** Medalhas por domínio (nunca por tempo gasto). */
export function medalhasMerecidas(s: Estado): string[] {
  const out: string[] = [];
  for (const r of REGIOES) {
    const p = progressoRegiao(r, s);
    const chefe = r.fases.find((f) => f.tipo === 'chefe');
    if (chefe && s.fases[chefe.id]?.feita) out.push(`chefe-${r.id}`);
    if (p.completa && p.media >= 0.8) out.push(`dominio-${r.id}`);
  }
  if (s.erros.length >= 5 && s.erros.filter((e) => e.resolvido).length >= 5) out.push('consertador');
  if (s.diario.length >= 5) out.push('pesquisador');
  return out;
}
export const MEDALHAS: Record<string, { nome: string; como: string }> = {
  consertador: { nome: 'Consertador', como: 'Refez e acertou 5 exercícios do caderno de erros.' },
  pesquisador: { nome: 'Pesquisador', como: 'Fez 5 anotações no diário de pesquisa.' },
  ...Object.fromEntries(REGIOES.flatMap((r) => [
    [`chefe-${r.id}`, { nome: `Chefão: ${r.nome}`, como: `Venceu o chefão de ${r.nome}.` }],
    [`dominio-${r.id}`, { nome: `Domínio: ${r.nome}`, como: `Todas as fases de ${r.nome} com média de 80% ou mais.` }],
  ])),
};

/** Ritmo sugerido para o foco de hoje: quantas fases e minutos faltam e a média por dia até a meta (folga antes do fim da prova). */
export function plano(s: Estado, dia = hoje()) {
  const foco = focoDoDia(dia);
  const lista = fasesDoFoco(foco);
  const faltam = lista.filter((f) => !s.fases[f.id]?.feita);
  const dias = Math.max(1, diasEntre(dia, FOCO_AGORA[foco].meta) + 1);
  const minutos = faltam.reduce((a, f) => a + f.min, 0);
  return { foco, faltam: faltam.length, total: lista.length, dias, minutos, porDia: Math.ceil((minutos / dias) * 10) / 10, meta: FOCO_AGORA[foco].meta, ate: FOCO_AGORA[foco].ate };
}

export const topicosDaRegiao = (s: Estado, regiaoId: string) => Object.keys(s.topicos).filter((t) => regiaoDoTopico(t) === regiaoId);
