import type { ToyId } from '../../engine/types';
import type { ToyProps } from './tipos';
import { VennVivo } from './Venn';
import { Interruptores } from './Interruptores';
import { Bancada } from './Bancada';
import { MaquinaFuncoes } from './Funcoes';
import { ArvoreContagem } from './Arvore';
import { SimuladorProb } from './Simulador';
import { PlanoVetores } from './Linear';
import { TransformaMatriz } from './Linear';
import { RetasSistema } from './Linear';
import { EditorGrafos } from './Grafos';
import { DominosInducao } from './Integracao';
import { AegisGrid } from './Integracao';

export const TOYS: Record<ToyId, { nome: string; resumo: string; regiao: string; C: (p: ToyProps) => React.JSX.Element }> = {
  venn: { nome: 'Venn vivo', resumo: 'Arraste elementos entre os círculos; conjuntos, contagens e inclusão-exclusão se recalculam.', regiao: 'M1', C: VennVivo },
  funcoes: { nome: 'Máquina de funções', resumo: 'Crie e apague setas; veja injetora, sobrejetora, bijetora e a composição g∘f.', regiao: 'M1', C: MaquinaFuncoes },
  interruptores: { nome: 'Painel de interruptores', resumo: 'Chaves, expressão, tabela-verdade e lâmpada reagindo juntas. Digite a sua expressão.', regiao: 'M2', C: Interruptores },
  arvore: { nome: 'Árvore de contagem', resumo: 'Etapas, arranjos, combinações e anagramas viram galhos e folhas. Ligue e desligue "a ordem importa" e veja as folhas se juntarem.', regiao: 'M3', C: ArvoreContagem },
  simulador: { nome: 'Simulador de probabilidade', resumo: 'Lance dados aos milhares, mexa na binomial, arraste os limites da curva normal e veja o sino nascer da média de vários dados.', regiao: 'M4', C: SimuladorProb },
  vetores: { nome: 'Plano de vetores', resumo: 'Arraste as pontas de dois vetores: soma, múltiplo, produto escalar, norma e ângulo mudam ao vivo.', regiao: 'M5', C: PlanoVetores },
  matriz: { nome: 'Transformação por matriz', resumo: 'Uma matriz 2×2 deforma o plano. O determinante é o fator de área: quando zera, tudo achata.', regiao: 'M5', C: TransformaMatriz },
  retas: { nome: 'Retas do sistema', resumo: 'Duas equações, duas retas: cruzam (SPD), são paralelas (SI) ou coincidem (SPI). Inclui o caso Telecom.', regiao: 'M5', C: RetasSistema },
  grafos: { nome: 'Editor de grafos', resumo: 'Desenhe vértices e arestas; veja graus, matrizes e listas ao vivo e rode BFS, DFS, Dijkstra, Bellman-Ford e Kruskal passo a passo.', regiao: 'M6', C: EditorGrafos },
  dominos: { nome: 'Dominós da indução', resumo: 'Caso base e passo indutivo como uma fila de dominós. Quebre um elo, esqueça de empurrar o primeiro e veja a prova parar.', regiao: 'M7', C: DominosInducao },
  aegis: { nome: 'Aegis-Grid', resumo: 'O caso da U8 numa tela: derrube servidor e rotas e veja expressão, tabela-verdade, rede, matriz e risco mudarem juntos.', regiao: 'M7', C: AegisGrid },
  bancada: { nome: 'Bancada de circuitos',resumo: 'Arraste portas, ligue fios, veja o sinal passar. O jogo escreve a expressão do que você montou.', regiao: 'M2', C: Bancada },
};

export function Toy({ id, ...p }: { id: ToyId } & ToyProps) {
  const C = TOYS[id].C;
  return <C {...p} />;
}
