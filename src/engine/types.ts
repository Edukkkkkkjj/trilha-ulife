import type { Notation } from '../lib/logic';

export type Mundo = 'mat' | 'exp';
/** Selos com o mesmo visual no jogo inteiro. */
export type Selo = 'alem' | 'erro' | 'confira';
/** Por que eu errei: conta, conceito ou leitura do enunciado. */
export type Causa = 'conta' | 'conceito' | 'leitura';
/** Dica em 3 níveis: empurrão, pista forte, passo resolvido. */
export type Hints = [string, string, string];
export type Armadilha<T> = { valor: T; causa: Causa; msg: string };

type Base = {
  id: string;
  topic: string;
  prompt: string;
  fonte?: string;
  selo?: Selo;
  seloNota?: string;
  hints: Hints;
  explain: string;
};

export type Passo = { texto: string; pede?: { rotulo: string; resposta: number; tol?: number } };

export type Ex =
  | (Base & { kind: 'mcq'; options: string[]; correct: number; porOpcao?: (string | undefined)[]; heuristica?: string; fixo?: boolean })
  | (Base & { kind: 'multi'; options: string[]; correct: number[] })
  | (Base & { kind: 'num'; answer: number; tol?: number; unidade?: string; armadilhas?: Armadilha<number>[] })
  | (Base & { kind: 'set'; answer: string[]; armadilhas?: Armadilha<string[]>[] })
  | (Base & { kind: 'expr'; target: string; maxLits?: number; armadilhas?: Armadilha<string>[] })
  | (Base & { kind: 'tabela'; expr: string; ordem: 'asc' | 'desc'; notacao: Notation })
  | (Base & { kind: 'venn'; n: 2 | 3; target: string })
  | (Base & { kind: 'classificar'; categorias: string[]; itens: { texto: string; cat: number; porque?: string }[] })
  | (Base & { kind: 'passos'; passos: Passo[]; ocultos: number });

export type ToyId = 'venn' | 'interruptores' | 'bancada' | 'funcoes' | 'arvore' | 'simulador';

export type Step =
  | { t: 'texto'; md: string; selo?: Selo; seloNota?: string }
  | { t: 'licao'; titulo: string; pergunta?: { q: string; a: string }; porque: string; ideia: string; regra: string; exemplo: string; armadilha: string; selo?: Selo; seloNota?: string }
  | { t: 'toy'; toy: ToyId; modo: 'livre' | 'desafio'; intro: string; preset?: string; desafios?: string[] }
  | { t: 'ex'; ex: Ex }
  | { t: 'gen'; gen: string; n: number }
  | { t: 'feynman'; prompt: string }
  | { t: 'escrita'; prompt: string; modelo: string; rubrica: string[]; fonte?: string };

export type TipoFase = 'leitura' | 'licao' | 'lab' | 'desafio' | 'questoes' | 'chefe';

export type Phase = { id: string; titulo: string; tipo: TipoFase; min: number; resumo: string; steps: Step[] };

export type Card = { id: string; mundo: Mundo; regiao: string; frente: string; verso: string };

export type Regiao = {
  id: string;
  mundo: Mundo;
  nome: string;
  unidades: string;
  tese: string;
  pronto: boolean;
  fases: Phase[];
  cards: Card[];
};

export type Resultado = { ok: boolean; given: string; expected: string; diag?: { causa: Causa; msg: string } };

export const SELOS: Record<Selo, { rotulo: string; explica: string }> = {
  alem: { rotulo: 'além do material', explica: 'Isto não está no texto do curso. Entra porque ajuda a entender ou porque o curso só cita.' },
  erro: { rotulo: 'erro no material', explica: 'O material do curso está errado aqui. O jogo ensina o certo e mostra onde está o erro.' },
  confira: { rotulo: 'confira na plataforma', explica: 'Não deu para ter certeza pelo texto extraído. Vale olhar na Ulife.' },
};

export const CAUSAS: Record<Causa, string> = {
  conta: 'Erro de conta',
  conceito: 'Erro de conceito',
  leitura: 'Leitura do enunciado',
};
