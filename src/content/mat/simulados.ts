// Simulados de Matemática: A1 (dissertativa) e A2 (objetiva).
// O formato exato das provas não está no material: o curso só diz que a A1 é dissertativa e a A2 é objetiva.
// A2: questões REAIS da plataforma (as mesmas das regiões, com a fonte), misturadas. A1: questões escritas para o jogo,
// uma por bloco de assunto, com resposta-modelo e rubrica; os números foram conferidos por código (src/tests/simulados.test.ts).
import type { Ex, Phase, Regiao, Step } from '../../engine/types';
import { texto } from '../ajuda';
import { M1 } from './m1';
import { M2 } from './m2';
import { M3 } from './m3';
import { M4 } from './m4';
import { M5 } from './m5';
import { M6 } from './m6';
import { M7 } from './m7';

const todas: Ex[] = [M1, M2, M3, M4, M5, M6, M7].flatMap((r) => r.fases.flatMap((f) => f.steps.flatMap((s) => (s.t === 'ex' ? [s.ex] : []))));
/** Copia uma questão real de uma região para o simulado, com outro id (para o progresso das duas não se misturar). */
const copia = (prefixo: string, ids: string[]): Step[] => ids.map((id, i) => {
  const e = todas.find((x) => x.id === id);
  if (!e) throw new Error('simulado: não achei a questão ' + id);
  return { t: 'ex', ex: { ...e, id: `${prefixo}-${i + 1}`, selo: undefined, seloNota: undefined } as Ex };
});

export const IDS_A2: Record<'a' | 'b', string[]> = {
  a: ['m1-q1', 'm1-q2', 'm2-q5', 'm2-r-dm', 'm2-r-u8b', 'm3-q7', 'm3-q9', 'm4-r-ex11', 'm4-q6', 'm5-q4', 'm5-q7', 'm5-q10', 'm6-q1', 'm6-r-bfsdfs', 'm6-r-tres', 'm7-q1'],
  b: ['m1-q4', 'm1-r-ops', 'm2-q4', 'm2-r-xor', 'm2-q11', 'm3-q6', 'm3-q8', 'm4-r-ex10', 'm4-q1', 'm4-q7', 'm5-q2', 'm5-q9', 'm6-q5', 'm6-q6', 'm6-q2', 'm7-q4'],
};

const escrita = (fonte: string, prompt: string, modelo: string, rubrica: string[]): Step => ({ t: 'escrita', fonte, prompt, modelo, rubrica });

const A1: Phase = {
  id: 'ms-a1', titulo: 'Simulado A1 · dissertativa', tipo: 'chefe', min: 45, resumo: 'Seis questões para escrever, uma por bloco da disciplina, com resposta-modelo e lista de conferência. Faça no papel ou digite.',
  steps: [
    texto('**Como usar este simulado.** A A1 (02 a 11/nov) é **dissertativa**: você escreve o raciocínio, não marca alternativa. O material do curso não mostra uma A1 de exemplo, então estas seis questões são **minhas**, no formato que treinamos em cada região ("defino…, monto…, logo…"), cobrindo os assuntos das unidades.\n\nPara cada uma: (1) responda de verdade, no papel ou no campo; (2) só então abra a resposta-modelo; (3) marque na lista o que a sua resposta tem. Ninguém corrige por você: a lista é a correção.\n\nReserve uns 45 minutos, ou faça duas questões por dia.', 'alem', 'As questões deste simulado não são da plataforma. Os números foram conferidos por código.'),
    escrita('Simulado A1 · Questão 1 (conjuntos)',
      'Numa turma de 60 alunos, 35 estudam Python, 28 estudam Java e 20 estudam SQL. Estudam Python e Java: 12. Python e SQL: 10. Java e SQL: 8. As três: 5. (a) Quantos estudam pelo menos uma das três linguagens? (b) Quantos não estudam nenhuma? (c) Quantos estudam SOMENTE Python? Mostre o raciocínio.',
      'Defino P, J e S como os conjuntos dos alunos de Python, Java e SQL, dentro do universo U de 60 alunos. (a) Quero |P ∪ J ∪ S|. Somar 35 + 28 + 20 conta em dobro quem está em dois conjuntos; pelo princípio da inclusão-exclusão: |P ∪ J ∪ S| = 35 + 28 + 20 − 12 − 10 − 8 + 5 = 58. A interseção tripla volta porque foi somada três vezes e subtraída três vezes. (b) Não estudam nenhuma: o complemento da união, 60 − 58 = 2. (c) Preencho o diagrama de dentro para fora: nas três, 5; só Python e Java, 12 − 5 = 7; só Python e SQL, 10 − 5 = 5. Somente Python: 35 − (7 + 5 + 5) = 18. Logo: 58 estudam pelo menos uma, 2 nenhuma e 18 somente Python.',
      ['Dei nome aos conjuntos e ao universo', 'Usei inclusão-exclusão e expliquei por que a tripla volta', 'Cheguei a 58 na união', 'Usei o complemento para "nenhuma" (2)', 'Fiz o Venn de dentro para fora para "somente Python" (18)', 'Fechei com as três respostas em frase']),
    escrita('Simulado A1 · Questão 2 (lógica e álgebra booleana)',
      'Regra de um sistema: "o acesso é liberado se o usuário tem crachá válido E (está no horário de trabalho OU tem autorização especial)". (a) Defina as proposições e escreva a expressão lógica e a booleana. (b) Em quantas das 8 combinações o acesso é liberado? Quais? (c) Escreva, usando De Morgan, a expressão de quando o acesso é NEGADO.',
      'Defino c: "o crachá é válido"; h: "está no horário de trabalho"; a: "tem autorização especial". (a) A regra é c ∧ (h ∨ a); os parênteses são necessários porque o crachá é exigido nos dois casos. Em álgebra booleana: L = C·(H + A). (b) São 3 variáveis, logo 2³ = 8 linhas. L = 1 exige C = 1 e pelo menos um entre H e A: as linhas (C, H, A) = 101, 110 e 111. O acesso é liberado em 3 das 8 combinações. (c) Negado é a negação da expressão: ¬[c ∧ (h ∨ a)]. Por De Morgan, nega-se cada parte e troca-se o conectivo: ¬c ∨ ¬(h ∨ a) = ¬c ∨ (¬h ∧ ¬a). Em booleana: C\' + H\'·A\'. Em palavras: o acesso é negado se o crachá é inválido, ou se o usuário está fora do horário e sem autorização. Conferindo: 8 − 3 = 5 combinações de acesso negado.',
      ['Defini cada proposição com letra e frase', 'Pus os parênteses no lugar certo e justifiquei', 'Escrevi a versão booleana', 'Cheguei a 3 de 8 e listei as linhas', 'Apliquei De Morgan duas vezes (trocando os conectivos)', 'Traduzi a negação de volta para o português']),
    escrita('Simulado A1 · Questão 3 (contagem)',
      'Uma equipe tem 8 pessoas. (a) De quantas formas dá para escolher 3 delas para uma comissão sem cargos? (b) E para os cargos de coordenador, secretário e tesoureiro? (c) Explique por que os dois números são diferentes e qual a relação entre eles. (d) Sorteando a comissão do item (a) ao acaso, qual a probabilidade de Ana (uma das 8) estar nela?',
      'Defino n = 8 pessoas e p = 3 escolhidas. (a) Na comissão sem cargos a ordem não importa: {Ana, Bia, Caio} é a mesma comissão em qualquer ordem. É combinação: C(8, 3) = (8 · 7 · 6)/3! = 336/6 = 56. (b) Com cargos diferentes, trocar duas pessoas de cargo muda o resultado: a ordem importa. É arranjo: A(8, 3) = 8 · 7 · 6 = 336. (c) Cada grupo de 3 pessoas pode ser distribuído nos 3 cargos de 3! = 6 maneiras; por isso o arranjo é 6 vezes a combinação: 336 = 56 · 6. (d) Probabilidade clássica: casos favoráveis sobre casos possíveis. Possíveis: 56 comissões. Favoráveis: comissões com Ana, ou seja, Ana mais 2 das outras 7 pessoas: C(7, 2) = 21. Logo P = 21/56 = 3/8 = 0,375, ou 37,5%.',
      ['Disse, em cada item, se a ordem importa e por quê', 'Combinação: 56', 'Arranjo: 336', 'Expliquei a relação pelo 3! (336 = 56 · 6)', 'Montei a probabilidade como favoráveis/possíveis', 'Contei os favoráveis com C(7, 2) = 21 e cheguei a 3/8']),
    escrita('Simulado A1 · Questão 4 (probabilidade)',
      'Um sistema envia 4 pacotes de forma independente; cada um chega corretamente com probabilidade 0,9. (a) Que distribuição descreve o número de pacotes que chegam? Justifique. (b) Qual a probabilidade de os 4 chegarem? (c) E de pelo menos um falhar? (d) E de exatamente 3 chegarem? Use 0,9² = 0,81, 0,9³ = 0,729 e 0,9⁴ = 0,6561.',
      'Defino X como o número de pacotes que chegam corretamente. (a) X segue uma distribuição binomial com n = 4 e p = 0,9, pois cada envio tem só dois resultados (chega ou não chega), os envios são independentes, o número de tentativas é fixo e a probabilidade é a mesma em todas. (b) P(X = 4) = C(4, 4) · 0,9⁴ · 0,1⁰ = 0,6561. (c) "Pelo menos um falhar" é o complemento de "todos chegarem": 1 − 0,6561 = 0,3439. (d) P(X = 3) = C(4, 3) · 0,9³ · 0,1¹ = 4 · 0,729 · 0,1 = 0,2916. Logo, há cerca de 65,6% de chance de tudo chegar, 34,4% de haver alguma falha e 29,2% de chegarem exatamente três. Mesmo com 90% por pacote, um lote de quatro falha em mais de um terço das vezes; em média chegam n · p = 3,6 pacotes.',
      ['Nomeei a variável aleatória', 'Justifiquei a binomial pelas quatro condições', 'P(X = 4) = 0,6561', 'Usei o complemento para "pelo menos um" (0,3439)', 'Incluí o C(4, 3) = 4 em P(X = 3) = 0,2916', 'Interpretei o resultado']),
    escrita('Simulado A1 · Questão 5 (álgebra linear)',
      'Um evento vendeu 50 ingressos, entre inteiras (20 reais) e meias (10 reais), arrecadando 800 reais. (a) Arme o sistema e escreva-o na forma AX = B. (b) Classifique o sistema pelo determinante. (c) Resolva. (d) Valide e comente se a solução faz sentido.',
      'Defino x como o número de inteiras e y como o número de meias. (a) Pela quantidade: x + y = 50. Pelo valor: 20x + 10y = 800. Na forma matricial, A é a matriz de linhas (1, 1) e (20, 10), X = (x, y) e B = (50, 800). (b) O determinante é D = 1 · 10 − 1 · 20 = −10. Como D ≠ 0, o sistema é possível e determinado (SPD): tem uma única solução; geometricamente, as duas retas se cruzam em um ponto. (c) Pela regra de Cramer: Dx = 50 · 10 − 1 · 800 = −300, logo x = −300/−10 = 30; Dy = 1 · 800 − 50 · 20 = −200, logo y = −200/−10 = 20. (d) Validação: 30 + 20 = 50 e 20 · 30 + 10 · 20 = 600 + 200 = 800. Foram vendidas 30 inteiras e 20 meias. A solução é inteira e positiva, portanto faz sentido no contexto; se desse fração ou número negativo, o modelo teria solução matemática sem ter solução prática.',
      ['Defini as incógnitas', 'Armei as duas equações e a forma AX = B', 'Calculei D = −10 e classifiquei como SPD', 'Resolvi mostrando as contas (30 e 20)', 'Validei nas duas equações', 'Comentei a viabilidade (inteira e positiva)']),
    escrita('Simulado A1 · Questão 6 (grafos)',
      'Uma rede tem os equipamentos A, B, C, D, E e as ligações, com custos: A–B 2, A–C 5, B–C 1, B–D 4, C–D 1, D–E 3. (a) Dê os graus e diga se o grafo é conexo, se tem ciclo e se é árvore. (b) Qual o caminho de menor custo de A até E, e que algoritmo o encontra? (c) Qual o custo da árvore geradora mínima, e que algoritmo a encontra?',
      'Defino o grafo G = (V, E) com V = {A, B, C, D, E} e 6 arestas ponderadas. (a) Graus: A = 2, B = 3, C = 3, D = 3, E = 1; a soma, 12, é o dobro das 6 arestas. O grafo é conexo, pois há caminho entre quaisquer dois vértices. Tem ciclo, por exemplo A-B-C-A. Logo não é árvore: uma árvore com 5 vértices teria 4 arestas e nenhum ciclo. (b) Como os pesos são positivos, uso o algoritmo de Dijkstra a partir de A. Distâncias: B = 2; C = 3 (por B, pois 2 + 1 < 5); D = 4 (por C, pois 3 + 1 < 2 + 4); E = 7. O caminho mínimo é A → B → C → D → E, com custo 2 + 1 + 1 + 3 = 7. Repare que ele usa 4 arestas: o mais barato não é o de menos saltos. (c) Para conectar todos com o menor custo total uso Kruskal: ordeno as arestas (B–C 1, C–D 1, A–B 2, D–E 3, B–D 4, A–C 5) e pego as que não fecham ciclo: B–C, C–D, A–B e D–E. B–D e A–C ficam de fora. Custo total: 1 + 1 + 2 + 3 = 7, com 4 arestas, como toda árvore de 5 vértices.',
      ['Graus certos e conferidos com 2 × |E|', 'Justifiquei conexo, com ciclo, não árvore', 'Escolhi Dijkstra e disse por quê (pesos positivos)', 'Caminho A-B-C-D-E com custo 7', 'Escolhi Kruskal e mostrei a ordem das arestas', 'Árvore geradora mínima com custo 7 e 4 arestas']),
    { t: 'feynman', prompt: 'Qual das seis questões foi a mais difícil para você? Escreva o que travou. (Isso vai para o diário e diz para qual região voltar.)' },
  ],
};

const A2 = (letra: 'a' | 'b'): Phase => ({
  id: `ms-a2${letra}`, titulo: `Simulado A2 · objetiva (versão ${letra.toUpperCase()})`, tipo: 'questoes', min: 25, resumo: '16 questões reais da plataforma, de todas as unidades, misturadas. Sem aula no meio: é só você e a questão.',
  steps: [
    texto(`**Como usar.** A A2 (12 a 18/nov) é **objetiva**. Este simulado junta 16 questões **reais da plataforma**, das oito unidades. Você já viu cada uma dentro das regiões; aqui elas vêm misturadas e com as alternativas embaralhadas de novo.\n\nFaça de uma vez, sem consultar. Reserve uns 25 minutos. As que você errar vão para o **Caderno de erros**, com a causa.${letra === 'b' ? '\n\nEsta é a versão B: questões diferentes da versão A.' : ''}`),
    ...copia(`ms-a2${letra}`, IDS_A2[letra]),
    { t: 'feynman', prompt: 'Em qual unidade você mais errou neste simulado? O que vai rever?' },
  ],
});

export const SIMULADOS_MAT: Regiao = {
  id: 'ms', mundo: 'mat', nome: 'Simulados A1 e A2', unidades: 'U1 a U8', pronto: true, simulado: true,
  tese: 'O ensaio geral: uma prova dissertativa e duas objetivas, com tudo misturado.',
  fases: [A2('a'), A1, A2('b')],
  cards: [],
};
