// Revisão espaçada no estilo Leitner: caixas 1 a 5.
// Acertou, o cartão sobe de caixa e demora mais para voltar. Errou, volta para a caixa 1.
import { diasEntre, somaDias } from './datas';

export type CardState = { box: number; due: string };
export const INTERVALO = [0, 1, 2, 4, 8, 16]; // dias até voltar, por caixa (índice = caixa)

export function revisar(prev: CardState | undefined, acertou: boolean, dia: string): CardState {
  const box = acertou ? Math.min(5, (prev?.box ?? 0) + 1) : 1;
  return { box, due: somaDias(dia, acertou ? INTERVALO[box] : 0) };
}

export type CardRef = { id: string; mundo: string };

/**
 * Escolhe os cartões da "revisão do dia": primeiro os vencidos (mais atrasados antes),
 * depois alguns novos, intercalando as disciplinas. No máximo `max`.
 */
export function revisaoDoDia(disponiveis: CardRef[], estados: Record<string, CardState>, dia: string, max = 12, maxNovos = 5): CardRef[] {
  const vencidos = disponiveis
    .filter((c) => estados[c.id] && diasEntre(estados[c.id].due, dia) >= 0)
    .sort((a, b) => diasEntre(estados[b.id].due, dia) - diasEntre(estados[a.id].due, dia) || estados[a.id].box - estados[b.id].box);
  const novos = disponiveis.filter((c) => !estados[c.id]);
  const intercalar = (xs: CardRef[]) => {
    const grupos = new Map<string, CardRef[]>();
    for (const c of xs) grupos.set(c.mundo, [...(grupos.get(c.mundo) ?? []), c]);
    const filas = [...grupos.values()], out: CardRef[] = [];
    while (filas.some((f) => f.length)) for (const f of filas) { const c = f.shift(); if (c) out.push(c); }
    return out;
  };
  const a = intercalar(vencidos).slice(0, max);
  const b = intercalar(novos).slice(0, Math.min(maxNovos, max - a.length));
  return intercalar([...a, ...b]);
}

export function contarPorCaixa(ids: string[], estados: Record<string, CardState>): number[] {
  const out = [0, 0, 0, 0, 0, 0]; // [novos, cx1..cx5]
  for (const id of ids) out[estados[id]?.box ?? 0]++;
  return out;
}
