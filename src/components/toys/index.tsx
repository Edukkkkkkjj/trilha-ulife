import type { ToyId } from '../../engine/types';
import type { ToyProps } from './tipos';
import { VennVivo } from './Venn';
import { Interruptores } from './Interruptores';
import { Bancada } from './Bancada';
import { MaquinaFuncoes } from './Funcoes';
import { ArvoreContagem } from './Arvore';
import { SimuladorProb } from './Simulador';

export const TOYS: Record<ToyId, { nome: string; resumo: string; regiao: string; C: (p: ToyProps) => React.JSX.Element }> = {
  venn: { nome: 'Venn vivo', resumo: 'Arraste elementos entre os círculos; conjuntos, contagens e inclusão-exclusão se recalculam.', regiao: 'M1', C: VennVivo },
  funcoes: { nome: 'Máquina de funções', resumo: 'Crie e apague setas; veja injetora, sobrejetora, bijetora e a composição g∘f.', regiao: 'M1', C: MaquinaFuncoes },
  interruptores: { nome: 'Painel de interruptores', resumo: 'Chaves, expressão, tabela-verdade e lâmpada reagindo juntas. Digite a sua expressão.', regiao: 'M2', C: Interruptores },
  arvore: { nome: 'Árvore de contagem', resumo: 'Etapas, arranjos, combinações e anagramas viram galhos e folhas. Ligue e desligue "a ordem importa" e veja as folhas se juntarem.', regiao: 'M3', C: ArvoreContagem },
  simulador: { nome: 'Simulador de probabilidade', resumo: 'Lance dados aos milhares, mexa na binomial, arraste os limites da curva normal e veja o sino nascer da média de vários dados.', regiao: 'M4', C: SimuladorProb },
  bancada: { nome: 'Bancada de circuitos',resumo: 'Arraste portas, ligue fios, veja o sinal passar. O jogo escreve a expressão do que você montou.', regiao: 'M2', C: Bancada },
};

export function Toy({ id, ...p }: { id: ToyId } & ToyProps) {
  const C = TOYS[id].C;
  return <C {...p} />;
}
