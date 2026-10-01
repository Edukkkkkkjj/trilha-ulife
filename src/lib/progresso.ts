// Contas sobre o progresso: o que falta, o que está fraco, o que fazer hoje.
import { REGIOES, todosCards, todasFases, regiaoDoTopico } from '../content';
import type { Card, Phase, Regiao } from '../engine/types';
import type { Estado } from './store';
import { diasEntre, hoje, PROVAS } from './datas';
import { revisaoDoDia } from './leitner';

export function progressoRegiao(r: Regiao, s: Estado) {
  const feitas = r.fases.filter((f) => s.fases[f.id]?.feita);
  const media = feitas.length ? feitas.reduce((a, f) => a + s.fases[f.id].melhor, 0) / feitas.length : 0;
  return { feitas: feitas.length, total: r.fases.length, media, completa: r.fases.length > 0 && feitas.length === r.fases.length };
}

/** Região aberta: a primeira do mundo, as que você liberou, ou quando a anterior tem o chefão vencido. */
export function regiaoAberta(r: Regiao, s: Estado): boolean {
  if (!r.pronto) return false;
  const doMundo = REGIOES.filter((x) => x.mundo === r.mundo);
  const i = doMundo.indexOf(r);
  if (i === 0 || s.liberadas.includes(r.id)) return true;
  const ant = doMundo[i - 1];
  const chefe = ant.fases.find((f) => f.tipo === 'chefe');
  return chefe ? !!s.fases[chefe.id]?.feita : progressoRegiao(ant, s).completa;
}

export function proximaFase(s: Estado): (Phase & { regiao: Regiao }) | undefined {
  const emAndamento = Object.keys(s.andamento)[0];
  const todas = todasFases();
  return todas.find((f) => f.id === emAndamento) ?? todas.find((f) => f.regiao.pronto && regiaoAberta(f.regiao, s) && !s.fases[f.id]?.feita);
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

/** Sugestão de ritmo até a A1: quantas fases por dia de estudo. */
export function plano(s: Estado, dia = hoje()) {
  const prontas = todasFases().filter((f) => f.regiao.pronto);
  const faltam = prontas.filter((f) => !s.fases[f.id]?.feita);
  const a1 = PROVAS.find((p) => p.id === 'A1')!;
  const dias = Math.max(1, diasEntre(dia, a1.abre));
  const minutos = faltam.reduce((a, f) => a + f.min, 0);
  return { faltam: faltam.length, total: prontas.length, dias, minutos, porDia: Math.ceil((minutos / dias) * 10) / 10 };
}

export const topicosDaRegiao = (s: Estado, regiaoId: string) => Object.keys(s.topicos).filter((t) => regiaoDoTopico(t) === regiaoId);
