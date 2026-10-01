// Atalhos para escrever conteúdo com menos repetição.
import type { Armadilha, Card, Ex, Hints, Mundo, Selo, Step } from '../engine/types';

type Extra = { hints?: Hints; selo?: Selo; seloNota?: string; heuristica?: string; porOpcao?: (string | undefined)[]; fixo?: boolean };

const dicasPadrao = (explain: string): Hints => [
  'Antes de olhar as alternativas, diga com suas palavras o que a pergunta quer.',
  'Risque as alternativas que contradizem a definição do conceito central.',
  explain,
];

/** Questão de múltipla escolha. `correct` é o índice (0 = primeira) na ordem em que você escreveu. */
export function mcq(id: string, topic: string, fonte: string | undefined, prompt: string, options: string[], correct: number, explain: string, x: Extra = {}): Ex {
  return { id, kind: 'mcq', topic, fonte, prompt, options, correct, explain, hints: x.hints ?? dicasPadrao(explain), selo: x.selo, seloNota: x.seloNota, heuristica: x.heuristica, porOpcao: x.porOpcao, fixo: x.fixo };
}
export function multi(id: string, topic: string, fonte: string, prompt: string, options: string[], correct: number[], explain: string, x: Extra = {}): Ex {
  return { id, kind: 'multi', topic, fonte, prompt, options, correct, explain, hints: x.hints ?? dicasPadrao(explain), selo: x.selo, seloNota: x.seloNota };
}
export function num(id: string, topic: string, fonte: string | undefined, prompt: string, answer: number, explain: string, hints: Hints, x: { tol?: number; unidade?: string; armadilhas?: Armadilha<number>[]; selo?: Selo; seloNota?: string } = {}): Ex {
  return { id, kind: 'num', topic, fonte, prompt, answer, explain, hints, ...x };
}
export function conj(id: string, topic: string, fonte: string | undefined, prompt: string, answer: string[], explain: string, hints: Hints, armadilhas?: Armadilha<string[]>[]): Ex {
  return { id, kind: 'set', topic, fonte, prompt, answer, explain, hints, armadilhas };
}
export function expr(id: string, topic: string, fonte: string | undefined, prompt: string, target: string, explain: string, hints: Hints, x: { maxLits?: number; armadilhas?: Armadilha<string>[]; selo?: Selo; seloNota?: string } = {}): Ex {
  return { id, kind: 'expr', topic, fonte, prompt, target, explain, hints, ...x };
}

/** Pergunta rápida no meio da aula, para checar a tela que acabou de ser lida. Não é questão do curso. */
export function cheque(id: string, topic: string, prompt: string, options: string[], correct: number, explain: string): Ex {
  return {
    id, kind: 'mcq', topic, prompt, options, correct, explain,
    hints: ['Releia a tela anterior: a resposta sai direto dela.', 'Teste cada alternativa com o exemplo que acabou de aparecer.', explain],
  };
}
/** Ficha-resumo que fecha uma aula (porquê, ideia, regra, exemplo, armadilha). */
export function ficha(f: { titulo: string; porque: string; ideia: string; regra: string; exemplo: string; armadilha: string; selo?: Selo; seloNota?: string }): Step {
  return { t: 'licao', ...f };
}

export const ex = (e: Ex): Step => ({ t: 'ex', ex: e });
export const gen = (g: string, n = 1): Step => ({ t: 'gen', gen: g, n });
export const texto = (md: string, selo?: Selo, seloNota?: string): Step => ({ t: 'texto', md, selo, seloNota });

/** `inicio`: número do primeiro cartão (para continuar uma lista que já existe). */
export function cards(mundo: Mundo, regiao: string, pares: [string, string][], inicio = 1): Card[] {
  return pares.map(([frente, verso], i) => ({ id: `${regiao}-c${i + inicio}`, mundo, regiao, frente, verso }));
}
