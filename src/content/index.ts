// Registro de todo o conteúdo. Para acrescentar uma região, crie o arquivo dela e ponha na lista.
import type { Card, Phase, Regiao } from '../engine/types';
import { M1 } from './mat/m1';
import { M2 } from './mat/m2';
import { M3 } from './mat/m3';
import { M4 } from './mat/m4';
import { M5 } from './mat/m5';
import { M6 } from './mat/m6';
import { M7 } from './mat/m7';
import { SIMULADOS_MAT } from './mat/simulados';
import { CARDS_EXP } from './exp/cards';
import { C3 } from './exp/c3';
import { C2 } from './exp/c2';
import { C1 } from './exp/c1';

const emObras = (id: string, mundo: 'mat' | 'exp', nome: string, unidades: string, tese: string, cards: Card[] = []): Regiao => ({ id, mundo, nome, unidades, tese, pronto: false, fases: [], cards });

export const REGIOES: Regiao[] = [
  M1,
  M2,
  M3,
  M4,
  M5,
  M6,
  M7,
  SIMULADOS_MAT,
  C1,
  C2,
  C3,
  emObras('c4', 'exp', 'O mundo em volta', 'U1 + U7 + U8', 'Onde a tecnologia encosta em gente.', CARDS_EXP.filter((c) => c.regiao === 'c4')),
];

export const MUNDOS = [
  { id: 'mat' as const, nome: 'Matemática Computacional Aplicada', curto: 'Matemática' },
  { id: 'exp' as const, nome: 'Exploração Digital e Fundamentos Tecnológicos', curto: 'Exploração' },
];

export const regiao = (id: string) => REGIOES.find((r) => r.id === id);
export const todasFases = (): (Phase & { regiao: Regiao })[] => REGIOES.flatMap((r) => r.fases.map((f) => ({ ...f, regiao: r })));
export const fase = (id: string) => todasFases().find((f) => f.id === id);
export const todosCards = (): Card[] => REGIOES.flatMap((r) => r.cards);

/** Nome legível de um tópico (para "tópico mais fraco" e barras de domínio). */
export const TOPICOS: Record<string, string> = {
  'm1.conjuntos': 'Conjuntos: definição e notação', 'm1.operacoes': 'Operações com conjuntos', 'm1.venn': 'Diagrama de Venn', 'm1.inclusao-exclusao': 'Inclusão-exclusão',
  'm1.cartesiano': 'Produto cartesiano e relações', 'm1.partes': 'Conjunto das partes', 'm1.funcoes': 'Funções: injetora, sobrejetora, bijetora', 'm1.composicao': 'Composição de funções',
  'm2.proposicoes': 'Proposições', 'm2.conectivos': 'Conectivos', 'm2.condicional': 'Condicional (se… então)', 'm2.tabela': 'Tabela-verdade', 'm2.tautologia': 'Tautologia, contradição, contingência',
  'm2.equivalencias': 'Equivalências e De Morgan', 'm2.traducao': 'Tradução lógica ↔ booleana', 'm2.precedencia': 'Precedência (· antes de +)', 'm2.simplificacao': 'Leis e simplificação',
  'm2.portas': 'Portas lógicas', 'm2.sop': 'Soma de produtos', 'm2.circuitos': 'Circuitos: mux, decodificador, somador',
  'm3.principios': 'Princípios multiplicativo e aditivo', 'm3.fatorial': 'Fatorial', 'm3.permutacao': 'Permutação e anagramas', 'm3.arranjo': 'Arranjo', 'm3.combinacao': 'Combinação', 'm3.escolha-da-tecnica': 'Qual técnica usar (a ordem importa?)',
  'm4.classica': 'Espaço amostral e probabilidade clássica', 'm4.regras': 'Regras: complemento, adição, independência', 'm4.condicional': 'Probabilidade condicional e total', 'm4.variaveis': 'Variáveis discretas e contínuas; valor esperado', 'm4.binomial': 'Distribuição binomial', 'm4.normal': 'Distribuição normal',
  'm5.vetores': 'Vetores: soma, escalar, produto escalar, norma', 'm5.matrizes': 'Matrizes e produto de matrizes', 'm5.determinante': 'Determinante e inversa', 'm5.sistemas': 'Sistemas lineares: armar, classificar, Cramer', 'm5.gauss': 'Escalonamento (Gauss e Gauss-Jordan)',
  'm6.conceitos': 'Grafos: vértices, arestas, grau, ciclos', 'm6.arvores': 'Árvores', 'm6.representacao': 'Matriz e lista de adjacência; incidência', 'm6.buscas': 'BFS e DFS', 'm6.caminhos': 'Dijkstra, Bellman-Ford e Kruskal', 'm6.escolha': 'Qual algoritmo usar',
  'm7.inducao': 'Indução matemática', 'm7.recorrencia': 'Recorrência', 'm7.integracao': 'Aegis-Grid: integração das ferramentas',
  'c1.conectividade': 'Conectividade: banda e latência', 'c1.redes': 'Redes, dispositivos de rede e protocolos', 'c1.nuvem': 'Computação em nuvem (IaaS, PaaS, SaaS)', 'c1.dispositivos': 'Dispositivos, sistemas operacionais e data centers', 'c1.seguranca': 'Segurança da informação', 'c2.silos': 'Silos e integração de sistemas', 'c2.erpcrm': 'ERP e CRM', 'c2.fluxo': 'Fluxo de dados', 'c2.lowcode': 'Automação e low-code', 'c2.transformacao': 'Digitalização × transformação digital', 'c2.rogers': 'Os cinco domínios de Rogers', 'c2.tecnologias': 'Tecnologias emergentes', 'c2.etica': 'Implicações éticas, sociais e profissionais',
  'c3.fundamentos': 'IA, automação e sistemas inteligentes', 'c3.aprendizado': 'Aprendizado de máquina e dados', 'c3.generativa': 'IA generativa', 'c3.prompt': 'Engenharia de prompt', 'c3.nocode': 'Ferramentas no-code', 'c3.automacao': 'Automação no cotidiano e nas organizações', 'c3.etica': 'Ética e viés na IA',
};
export const nomeTopico = (t: string) => TOPICOS[t] ?? t;
export const regiaoDoTopico = (t: string) => t.split('.')[0];
