// Geradores da M7 · Integração: recorrência, somas e modelos de falha no estilo Aegis-Grid.
import type { Ex } from './types';
import type { Rng } from '../lib/rng';
import { recorrencia } from '../lib/integracao';
import { parse, truthTable } from '../lib/logic';

type Gerador = (r: Rng, nivel: number) => Ex;
let n = 0;
const id = (g: string) => `${g}#${Date.now().toString(36)}m7${(n++).toString(36)}`;
const v2 = (x: number, casas = 3) => (Math.round(x * 10 ** casas) / 10 ** casas).toLocaleString('pt-BR', { maximumFractionDigits: casas });

const recorre: Gerador = (r, nivel) => {
  const a1 = r.int(1, 5), k = r.int(4, 6), tipo = nivel === 0 ? 'soma' : r.pick(['soma', 'dobra', 'misto'] as const);
  const [m, c] = tipo === 'soma' ? [1, r.int(2, 7)] : tipo === 'dobra' ? [2, 0] : [2, r.int(1, 3)];
  const termos = Array.from({ length: k }, (_, i) => recorrencia(a1, m, c, i + 1)), regra = m === 1 ? `a(n − 1) + ${c}` : c === 0 ? '2 · a(n − 1)' : `2 · a(n − 1) + ${c}`;
  return { id: id('m7.rec'), kind: 'num', topic: 'm7.recorrencia', answer: termos[k - 1], prompt: `Uma sequência é definida por recorrência: **a(1) = ${a1}** e **a(n) = ${regra}** para n > 1.\n\nQuanto vale **a(${k})**?`,
    armadilhas: [{ valor: termos[k - 2], causa: 'conta' as const, msg: `Esse é a(${k - 1}). Falta aplicar a regra mais uma vez.` }, { valor: recorrencia(a1, m, c, k + 1), causa: 'conta' as const, msg: `Você passou um: esse é a(${k + 1}).` }],
    hints: ['Recorrência: cada termo é calculado a partir do anterior. Comece em a(1) e vá subindo.', `a(1) = ${termos[0]}, a(2) = ${termos[1]}, a(3) = ${termos[2]}…`, termos.map((t, i) => `a(${i + 1}) = ${t}`).join(', ') + '.'],
    explain: `${termos.map((t, i) => `a(${i + 1}) = ${t}`).join(', ')}. Resposta: **${termos[k - 1]}**.` };
};

const somas: Gerador = (r) => {
  const nn = r.pick([10, 20, 50, 100, 30, 12]), impares = r.bool(0.4);
  if (impares) { const k = r.int(4, 12); return { id: id('m7.soma'), kind: 'num', topic: 'm7.inducao', answer: k * k, prompt: `Quanto dá a soma dos **${k}** primeiros números ímpares (1 + 3 + 5 + …)? Use a fórmula que a indução prova.`,
    hints: ['A soma dos n primeiros ímpares é n².', `${k}².`, `${k * k}.`], explain: `Soma dos n primeiros ímpares = n². Com n = ${k}: **${k * k}**.` }; }
  return { id: id('m7.soma'), kind: 'num', topic: 'm7.inducao', answer: (nn * (nn + 1)) / 2, prompt: `Quanto dá **1 + 2 + 3 + … + ${nn}**? Use a fórmula que a indução prova.`,
    armadilhas: [{ valor: nn * (nn + 1), causa: 'conta' as const, msg: 'Faltou dividir por 2.' }, { valor: (nn * nn) / 2, causa: 'conta' as const, msg: 'É n vezes (n + 1), não n vezes n.' }],
    hints: ['1 + 2 + … + n = n(n + 1)/2.', `${nn} · ${nn + 1} / 2.`, `${nn * (nn + 1)} / 2 = ${(nn * (nn + 1)) / 2}.`], explain: `$\\dfrac{n(n+1)}{2}$ = ${nn}·${nn + 1}/2 = **${(nn * (nn + 1)) / 2}**.` };
};

export const MODELOS: { e: string; frase: string }[] = [
  { e: 'P + Q·R', frase: 'o servidor falha **ou** as duas rotas falham ao mesmo tempo' },
  { e: 'P·Q + R', frase: 'os dois servidores falham ao mesmo tempo **ou** o link único falha' },
  { e: '(P + Q)·R', frase: 'um dos dois sensores falha **e** o sistema de backup também falha' },
  { e: 'P + Q + R', frase: 'qualquer um dos três componentes em série falha' },
  { e: 'P·Q·R', frase: 'os três servidores redundantes falham ao mesmo tempo' },
  { e: 'P·Q + P·R', frase: 'o servidor falha **e** pelo menos uma das duas rotas falha' },
];
const cenariosDeFalha: Gerador = (r) => {
  const m = r.pick(MODELOS), t = truthTable(parse(m.e)), k = t.filter((l) => l.value).length;
  return { id: id('m7.falha'), kind: 'num', topic: 'm7.integracao', answer: k, prompt: `Um sistema tem três componentes, P, Q e R (1 = falhou). Ele entra em colapso quando ${m.frase}: **S = ${m.e}**.\n\nEm quantas das 8 combinações possíveis o sistema falha?`,
    hints: ['São 3 variáveis: 2³ = 8 linhas na tabela-verdade.', 'Lembre a precedência: primeiro o produto (·), depois a soma (+).', `S = 1 em ${k} linhas: ${t.filter((l) => l.value).map((l) => ['P', 'Q', 'R'].map((v) => (l.env[v] ? 1 : 0)).join('')).join(', ')}.`],
    explain: `Montando a tabela de S = ${m.e}: S = 1 em **${k}** das 8 linhas (${t.filter((l) => l.value).map((l) => ['P', 'Q', 'R'].map((v) => (l.env[v] ? 1 : 0)).join('')).join(', ')}).` };
};

const riscoTotal: Gerador = (r, nivel) => {
  const pp = r.pick([0.1, 0.05, 0.2]), pq = r.pick([0.1, 0.2, 0.5]), pr = r.pick([0.1, 0.2, 0.5]), rot = pq * pr, total = 1 - (1 - pp) * (1 - rot);
  return { id: id('m7.risco'), kind: 'passos', topic: 'm7.integracao', ocultos: [1, 2, 3][Math.min(2, nivel)],
    prompt: `No modelo S = P + Q·R, as falhas são independentes, com probabilidades: servidor **${v2(pp)}**, rota 1 **${v2(pq)}**, rota 2 **${v2(pr)}**. Qual é a probabilidade de o sistema falhar?`,
    passos: [
      { texto: 'O sistema falha se o servidor cai OU as duas rotas caem. É mais fácil calcular o contrário: nenhuma das duas coisas acontecer.' },
      { texto: `Chance de as duas rotas caírem juntas (independentes: multiplica): ${v2(pq)} × ${v2(pr)}.`, pede: { rotulo: 'P(Q·R)', resposta: rot, tol: 0.0006 } },
      { texto: `Chance de o sistema aguentar: servidor ok E rotas ok = (1 − ${v2(pp)}) × (1 − ${v2(rot)}).`, pede: { rotulo: 'P(não falha)', resposta: (1 - pp) * (1 - rot), tol: 0.0006 } },
      { texto: 'Chance de falhar: 1 menos isso.', pede: { rotulo: 'P(S = 1)', resposta: total, tol: 0.0006 } },
    ],
    hints: ['Use o complemento: P(falha) = 1 − P(nada falha de forma crítica).', `P(rotas) = ${v2(rot)}. P(aguenta) = ${v2(1 - pp)} × ${v2(1 - rot)}.`, `1 − ${v2((1 - pp) * (1 - rot), 4)} = ${v2(total, 4)}.`],
    explain: `P(Q·R) = ${v2(rot)}. P(aguenta) = ${v2(1 - pp)} × ${v2(1 - rot)} = ${v2((1 - pp) * (1 - rot), 4)}. P(falha) = **${v2(total, 4)}** (${v2(total * 100, 2)}%). Dá o mesmo pela regra da adição: ${v2(pp)} + ${v2(rot)} − ${v2(pp)}·${v2(rot)}.` };
};

export const GERADORES_M7: Record<string, Gerador> = { 'm7.rec': recorre, 'm7.soma': somas, 'm7.falha': cenariosDeFalha, 'm7.risco': riscoTotal };
