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
  a: ['m1-q1', 'm1-q2', 'm2-q5', 'm2-r-dm', 'm3-q7', 'm3-q9', 'm4-r-ex11', 'm5-q4', 'm5-q7', 'm6-q1', 'm6-r-bfsdfs', 'm7-q1'],
  b: ['m1-q4', 'm1-r-ops', 'm2-q4', 'm2-r-xor', 'm3-q6', 'm3-q8', 'm4-r-ex10', 'm5-q2', 'm5-q9', 'm6-q5', 'm6-q6', 'm7-q4'],
};

const escrita = (fonte: string, prompt: string, modelo: string, rubrica: string[]): Step => ({ t: 'escrita', fonte, prompt, modelo, rubrica });

const A1: Phase = {
  id: 'ms-a1', titulo: 'Simulado A1 · dissertativa', tipo: 'chefe', min: 45, prova: { id: 'A1', horas: 4 }, resumo: 'Seis questões para escrever, só de U1 a U4 (conjuntos, funções, lógica, booleana e contagem), com resposta-modelo e lista de conferência.',
  steps: [
    texto('**Como usar este simulado.** A A1 (02 a 11/nov) é **dissertativa** e cobra só **U1 a U4**: você escreve o raciocínio, não marca alternativa. O material não mostra uma A1 de exemplo, então estas seis questões são **minhas**, no formato que treinamos ("defino…, monto…, logo…"), todas dentro desse recorte.\n\nPara cada uma: (1) responda de verdade, no papel ou no campo; (2) só então abra a resposta-modelo; (3) marque na lista o que a sua resposta tem. Ninguém corrige por você: a lista é a correção.\n\nReserve uns 45 minutos, ou faça duas questões por dia.', 'alem', 'As questões deste simulado não são da plataforma. Os números foram conferidos por código.'),
    escrita('Simulado A1 · Questão 1 (conjuntos)',
      'Numa turma de 60 alunos, 35 estudam Python, 28 estudam Java e 20 estudam SQL. Estudam Python e Java: 12. Python e SQL: 10. Java e SQL: 8. As três: 5. (a) Quantos estudam pelo menos uma das três linguagens? (b) Quantos não estudam nenhuma? (c) Quantos estudam SOMENTE Python? Mostre o raciocínio.',
      'Defino P, J e S como os conjuntos dos alunos de Python, Java e SQL, dentro do universo U de 60 alunos. (a) Quero |P ∪ J ∪ S|. Somar 35 + 28 + 20 conta em dobro quem está em dois conjuntos; pelo princípio da inclusão-exclusão: |P ∪ J ∪ S| = 35 + 28 + 20 − 12 − 10 − 8 + 5 = 58. A interseção tripla volta porque foi somada três vezes e subtraída três vezes. (b) Não estudam nenhuma: o complemento da união, 60 − 58 = 2. (c) Preencho o diagrama de dentro para fora: nas três, 5; só Python e Java, 12 − 5 = 7; só Python e SQL, 10 − 5 = 5. Somente Python: 35 − (7 + 5 + 5) = 18. Logo: 58 estudam pelo menos uma, 2 nenhuma e 18 somente Python.',
      ['Dei nome aos conjuntos e ao universo', 'Usei inclusão-exclusão e expliquei por que a tripla volta', 'Cheguei a 58 na união', 'Usei o complemento para "nenhuma" (2)', 'Fiz o Venn de dentro para fora para "somente Python" (18)', 'Fechei com as três respostas em frase']),
    escrita('Simulado A1 · Questão 2 (funções)',
      'Sejam f(x) = 3x − 2 e g(x) = x², ambas de ℝ em ℝ. (a) Calcule (g∘f)(2) e (f∘g)(2). (b) Os dois resultados são iguais? O que isso diz sobre a composição? (c) f é injetora, sobrejetora ou bijetora? Justifique. (d) g é injetora? Justifique com um exemplo.',
      'Defino f(x) = 3x − 2 e g(x) = x². (a) A composição (g∘f)(x) = g(f(x)) aplica f primeiro. Então f(2) = 3 · 2 − 2 = 4 e g(4) = 16, logo (g∘f)(2) = 16. Já (f∘g)(2) = f(g(2)): g(2) = 4 e f(4) = 3 · 4 − 2 = 10, logo (f∘g)(2) = 10. (b) 16 ≠ 10: a composição não é comutativa, a ordem em que as funções são aplicadas muda o resultado. (c) f é injetora: se f(a) = f(b), então 3a − 2 = 3b − 2 e, portanto, a = b; elementos diferentes têm imagens diferentes. Também é sobrejetora: dado qualquer y real, x = (y + 2)/3 é real e f(x) = y, então o contradomínio inteiro é atingido. Sendo injetora e sobrejetora, f é bijetora e tem inversa f⁻¹(y) = (y + 2)/3. (d) g não é injetora: g(2) = 4 e g(−2) = 4, ou seja, dois elementos diferentes do domínio têm a mesma imagem. (De quebra, g também não é sobrejetora em ℝ, porque nenhum x real dá um quadrado negativo.)',
      ['Apliquei a composição na ordem certa (de dentro para fora)', '(g∘f)(2) = 16', '(f∘g)(2) = 10', 'Concluí que a composição não é comutativa', 'Justifiquei injetora e sobrejetora de f (bijetora)', 'Usei g(2) = g(−2) como contraexemplo de injetividade']),
    escrita('Simulado A1 · Questão 3 (lógica)',
      'Regra de um sistema: "o acesso é liberado se o usuário tem crachá válido E (está no horário de trabalho OU tem autorização especial)". (a) Defina as proposições e escreva a expressão lógica e a booleana. (b) Em quantas das 8 combinações o acesso é liberado? Quais? (c) Escreva, usando De Morgan, a expressão de quando o acesso é NEGADO.',
      'Defino c: "o crachá é válido"; h: "está no horário de trabalho"; a: "tem autorização especial". (a) A regra é c ∧ (h ∨ a); os parênteses são necessários porque o crachá é exigido nos dois casos. Em álgebra booleana: L = C·(H + A). (b) São 3 variáveis, logo 2³ = 8 linhas. L = 1 exige C = 1 e pelo menos um entre H e A: as linhas (C, H, A) = 101, 110 e 111. O acesso é liberado em 3 das 8 combinações. (c) Negado é a negação da expressão: ¬[c ∧ (h ∨ a)]. Por De Morgan, nega-se cada parte e troca-se o conectivo: ¬c ∨ ¬(h ∨ a) = ¬c ∨ (¬h ∧ ¬a). Em booleana: C\' + H\'·A\'. Em palavras: o acesso é negado se o crachá é inválido, ou se o usuário está fora do horário e sem autorização. Conferindo: 8 − 3 = 5 combinações de acesso negado.',
      ['Defini cada proposição com letra e frase', 'Pus os parênteses no lugar certo e justifiquei', 'Escrevi a versão booleana', 'Cheguei a 3 de 8 e listei as linhas', 'Apliquei De Morgan duas vezes (trocando os conectivos)', 'Traduzi a negação de volta para o português']),
    escrita('Simulado A1 · Questão 4 (álgebra booleana)',
      'Um alarme dispara (S = 1) quando o sensor da porta está ativo (P) E o sistema está armado (A), OU quando o botão de pânico (B) está apertado. (a) Escreva a expressão booleana de S. (b) Monte a tabela-verdade: em quantas das 8 linhas o alarme dispara? (c) Mostre, pela distributiva, que S = (P + B) · (A + B). (d) Quantas portas lógicas e de que tipo tem o circuito da expressão do item (a)?',
      'Defino P: sensor da porta ativo; A: sistema armado; B: botão de pânico apertado. (a) "P E A" é o produto P·A, e "OU B" é a soma com B: S = P·A + B. Na precedência booleana o produto vem antes da soma, então não precisa de parênteses. (b) Com 3 variáveis, são 2³ = 8 linhas. P·A vale 1 nas linhas (P, A, B) = 110 e 111; B vale 1 nas quatro linhas com B = 1 (001, 011, 101, 111). A linha 111 aparece nas duas listas, então S = 1 em 2 + 4 − 1 = 5 linhas, e S = 0 nas outras 3 (000, 010, 100). (c) Pela distributiva da soma sobre o produto, (P + B) · (A + B) = P·A + P·B + B·A + B·B. Como B·B = B, sobra P·A + B·(P + A + 1). E P + A + 1 = 1, então o resultado é P·A + B = S. (d) O circuito de S = P·A + B usa duas portas: uma AND (para P·A) e uma OR (para somar B). A forma do item (c) usaria três portas, duas OR e uma AND, o que mostra por que a forma mais enxuta é a melhor.',
      ['Montei S = P·A + B com a precedência certa', 'Listei as linhas da tabela com S = 1', 'Contei 5 linhas de 8 (sem contar a 111 duas vezes)', 'Usei B·B = B e P + A + 1 = 1 na distributiva', 'Cheguei a P·A + B no item (c)', 'Contei as portas: 1 AND e 1 OR']),
    escrita('Simulado A1 · Questão 5 (contagem)',
      'O ministério de louvor tem 8 pessoas. (a) De quantas formas dá para escolher 3 delas para uma comissão sem cargos? (b) E para os cargos de coordenador, secretário e tesoureiro? (c) Explique por que os dois números são diferentes e qual a relação entre eles. (d) Quantas das comissões do item (a) incluem a Ana (uma das 8)? Confira o resultado.',
      'Defino n = 8 pessoas e p = 3 escolhidas. (a) Na comissão sem cargos a ordem não importa: {Ana, Bia, Caio} é a mesma comissão em qualquer ordem. É combinação: C(8, 3) = (8 · 7 · 6)/3! = 336/6 = 56. (b) Com cargos diferentes, trocar duas pessoas de cargo muda o resultado: a ordem importa. É arranjo: A(8, 3) = 8 · 7 · 6 = 336. (c) Cada grupo de 3 pessoas pode ser distribuído nos 3 cargos de 3! = 6 maneiras; por isso o arranjo é 6 vezes a combinação: 336 = 56 · 6. (d) Fixo a Ana na comissão e escolho as outras 2 entre as 7 que sobram, sem ordem: C(7, 2) = 21 comissões. Conferência: as 56 comissões se dividem em 21 com a Ana e C(7, 3) = 35 sem ela, e 21 + 35 = 56.',
      ['Disse, em cada item, se a ordem importa e por quê', 'Combinação: 56', 'Arranjo: 336', 'Expliquei a relação pelo 3! (336 = 56 · 6)', 'Fixei a Ana e escolhi as outras 2 entre as 7', 'Cheguei a C(7, 2) = 21 e conferi com 21 + 35 = 56']),
    escrita('Simulado A1 · Questão 6 (permutação e anagramas)',
      'Considere anagramas como todas as ordenações das letras, com ou sem sentido. (a) Quantos anagramas tem AMÓS? (b) Quantos tem ARARAS? (c) Dos anagramas de ARARAS, quantos começam com A? Explique por que (b) não é 6!.',
      'Defino anagrama como uma permutação das letras da palavra. (a) AMÓS tem 4 letras todas diferentes, então são 4! = 4 · 3 · 2 · 1 = 24 anagramas. (b) ARARAS tem 6 letras, mas com repetição: A aparece 3 vezes, R aparece 2 vezes e S aparece 1 vez. Se todas fossem diferentes, seriam 6! = 720. Só que trocar de lugar dois A entre si não gera anagrama novo, e o mesmo vale para os R. Divide-se, então, pelas trocas que não mudam nada: 6! / (3! · 2! · 1!) = 720/12 = 60 anagramas. Por isso (b) não é 6!: contar 720 contaria cada anagrama 12 vezes. (c) Fixo um A na primeira posição e permuto o que sobra: A, A, R, R, S, ou seja, 5 letras com A repetido 2 vezes e R repetido 2 vezes. São 5! / (2! · 2!) = 120/4 = 30 anagramas. Conferência: 30 dos 60 anagramas começam com A, o que faz sentido, já que A é metade das letras.',
      ['Disse que anagrama é permutação das letras', 'AMÓS = 4! = 24', 'Identifiquei as repetições (3 A, 2 R, 1 S)', 'Dividi por 3! · 2! e cheguei a 60', 'Expliquei por que não é 6! (cada anagrama seria contado 12 vezes)', 'Fixei o A e cheguei a 30']),
    { t: 'feynman', prompt: 'Qual das seis questões foi a mais difícil para você? Escreva o que travou. (Isso vai para o diário e diz para qual região voltar.)' },
  ],
};

const A2 = (letra: 'a' | 'b'): Phase => ({
  id: `ms-a2${letra}`, titulo: `Simulado A2 · objetiva (versão ${letra.toUpperCase()})`, tipo: 'questoes', min: 20, prova: { id: 'A2', horas: 3 }, resumo: '12 questões reais da plataforma, como na prova (2,5 pontos cada), de todas as unidades, misturadas. Sem aula no meio.',
  steps: [
    texto(`**Como usar.** A A2 (12 a 18/nov) é **objetiva** e cobra tudo. Este simulado tem 12 questões **reais da plataforma**, como a prova: cada acerto vale **2,5 pontos** (nota de 0 a 30). Você já viu cada uma dentro das regiões; aqui elas vêm misturadas e com as alternativas embaralhadas de novo.\n\nFaça de uma vez, sem consultar. Reserve uns 20 minutos. As que você errar vão para o **Caderno de erros**, com a causa.${letra === 'b' ? '\n\nEsta é a versão B: questões diferentes da versão A.' : ''}`),
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
