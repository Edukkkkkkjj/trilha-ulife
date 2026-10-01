// M7 · Integração: indução, recorrência e o caso Aegis-Grid (U8). É a base da A3.
// Fontes: fontes/matematica/U8.txt, o enunciado e as respostas da atividade avaliativa (PDF) e o quadro-síntese (PDF).
import type { Regiao } from '../../engine/types';
import { cards, cheque, ex, ficha, gen, mcq, num, texto } from '../ajuda';

export const M7: Regiao = {
  id: 'm7', mundo: 'mat', nome: 'Integração: Aegis-Grid', unidades: 'U8', pronto: true,
  tese: 'Um problema só, todas as ferramentas. É a base da A3.',
  fases: [
    // ------------------------------------------------------------------ AULA 1
    {
      id: 'm7-inducao', titulo: 'Aula 1 · Indução: provar para infinitos casos', tipo: 'licao', min: 11, resumo: 'Do zero: por que testar exemplos não prova, e como a indução prova para todos os números de uma vez.',
      steps: [
        texto('**Um aviso antes.** A unidade 8 se chama "Indução Matemática e Recorrência", mas o texto do curso **não desenvolve** nenhum dos dois: ele só cita os nomes e manda ler o livro do Gersting. O conteúdo de verdade da U8 é o caso Aegis-Grid, que vem nas aulas 3 e 4.\n\nComo o título pode virar pergunta de prova, esta aula e a próxima ensinam o essencial.', 'alem', 'O texto da U8 traz só uma frase sobre o tema: "a indução matemática e a recorrência garantem a prova de propriedades e a estabilidade de algoritmos recursivos". O que segue vem da matemática discreta padrão (é o que está no Gersting, o livro indicado).'),
        texto('**O problema.** Alguém afirma: "para **qualquer** número n, a soma $1 + 2 + 3 + \\dots + n$ é igual a $\\dfrac{n(n+1)}{2}$".\n\nVocê testa:\n\n- $n = 1$: soma 1; fórmula $1 \\cdot 2 / 2 = 1$. Confere.\n- $n = 4$: soma $1 + 2 + 3 + 4 = 10$; fórmula $4 \\cdot 5 / 2 = 10$. Confere.\n- $n = 100$: fórmula $100 \\cdot 101 / 2 = 5050$. Confere (pode somar).\n\nDeu certo três vezes. Isso **prova** que vale para todo n? São infinitos números; ninguém testa todos.'),
        { t: 'toy', toy: 'dominos', modo: 'desafio', intro: 'Antes de responder, veja este caso. Embaixo dos dominós há um conferidor de afirmações. A afirmação "n² + n + 41 é sempre primo" passa em um teste atrás do outro. (Primo: número que só divide por 1 e por ele mesmo.)', desafios: ['d-primos'] },
        texto('Trinta e nove acertos seguidos, e a afirmação era **falsa**. Essa é a lição: **exemplo não é prova**. Para afirmar algo sobre infinitos casos, é preciso um argumento que cubra todos.\n\n**A ideia da indução: dominós.** Imagine uma fila infinita de dominós, numerados 1, 2, 3… Como garantir que **todos** caem, sem olhar um por um? Bastam duas coisas:\n\n1. **O primeiro cai.** (Alguém empurra.)\n2. **Cada dominó que cai derruba o seguinte.**\n\nSe as duas valem, o 1 cai; então o 2 cai; então o 3; e assim para sempre. Nenhum escapa.'),
        { t: 'toy', toy: 'dominos', modo: 'desafio', intro: 'Três desafios com a fila. Cada um mostra o que acontece quando falta um dos dois ingredientes.', desafios: ['d-todos', 'd-base', 'd-elo'] },
        texto('**A prova por indução** é exatamente isso, com a afirmação $P(n)$ no lugar do dominó $n$:\n\n1. **Caso base**: mostrar que $P(1)$ é verdadeira (ou o primeiro valor que interessa).\n2. **Passo indutivo**: mostrar que, **se** $P(k)$ é verdadeira para um $k$ qualquer, **então** $P(k+1)$ também é. A suposição "P(k) é verdadeira" chama-se **hipótese de indução**.\n\nFeitas as duas, $P(n)$ vale para todo $n$.\n\nRepare que o passo é uma **condicional** da região de lógica: $P(k) \\to P(k+1)$. Você não prova que P(k) é verdade; prova que ela **puxa** a seguinte.'),
        texto('**Um exemplo completo.** Provar que $1 + 2 + \\dots + n = \\dfrac{n(n+1)}{2}$.\n\n**Base** ($n = 1$): o lado esquerdo é 1; o direito é $\\dfrac{1 \\cdot 2}{2} = 1$. Vale.\n\n**Passo**: suponho que vale para $k$ (hipótese): $1 + 2 + \\dots + k = \\dfrac{k(k+1)}{2}$.\n\nQuero mostrar para $k + 1$. Somo $(k+1)$ dos dois lados:\n\n$$1 + 2 + \\dots + k + (k+1) = \\frac{k(k+1)}{2} + (k+1)$$\n\nPondo $(k+1)$ em evidência no lado direito:\n\n$$= (k+1)\\left(\\frac{k}{2} + 1\\right) = \\frac{(k+1)(k+2)}{2}$$\n\nQue é a fórmula com $k+1$ no lugar de $n$. O dominó $k$ derrubou o $k+1$. **Provado.**\n\nVocê não precisa reproduzir a álgebra de cor; precisa reconhecer a **estrutura**: base, hipótese, passo.'),
        ex(cheque('m7-k01', 'm7.inducao', 'Numa prova por indução, alguém mostrou só o passo indutivo ("se vale para k, vale para k + 1") e esqueceu o caso base. A prova está completa?', ['Não: sem a base, nada garante que algum caso seja verdadeiro para começar a corrente', 'Sim: o passo indutivo cobre todos os casos', 'Sim, desde que k seja grande'], 0, 'Elos perfeitos e ninguém empurrando o primeiro dominó: nada cai. É o erro mais comum.')),
        gen('m7.soma', 2),
        texto('**Para que serve em computação?** Para provar que um algoritmo funciona para **qualquer** tamanho de entrada, não só para os testes que você rodou. Em especial, algoritmos **recursivos** (que resolvem um problema chamando a si mesmos num problema menor) são provados por indução: o caso base da recursão é a base da prova; a chamada recursiva é a hipótese.\n\nNo mapa do curso: a indução "garante a prova de propriedades e a estabilidade de algoritmos recursivos", ou seja, que continuam corretos quando o volume de dados cresce.'),
        ficha({
          titulo: 'Indução: a ficha',
          porque: 'Testes cobrem alguns casos; a indução cobre todos. É como se prova que um algoritmo recursivo está certo para qualquer entrada.',
          ideia: 'Dominós: o primeiro cai (base) e cada um derruba o próximo (passo). Então todos caem.',
          regra: '$$P(1) \\text{ vale} \\quad\\text{e}\\quad \\big(P(k) \\Rightarrow P(k+1)\\big) \\quad\\Longrightarrow\\quad P(n) \\text{ vale para todo } n$$',
          exemplo: '1 + 2 + … + n = n(n + 1)/2. Base: 1 = 1·2/2. Passo: somar (k + 1) dos dois lados e chegar em (k + 1)(k + 2)/2.',
          armadilha: 'Esquecer o caso base. E confundir "testei muitos casos" com "provei" (n² + n + 41 falha no 40).',
        }),
      ],
    },
    // ------------------------------------------------------------------ AULA 2
    {
      id: 'm7-recorrencia', titulo: 'Aula 2 · Recorrência: definir pelo anterior', tipo: 'licao', min: 9, resumo: 'Sequências em que cada termo sai do anterior: a matemática por trás dos algoritmos recursivos.',
      steps: [
        texto('**O problema.** Um vídeo da igreja tem 3 visualizações no primeiro dia, e o número **dobra** a cada dia. Quantas no dia 6?\n\nVocê não tem (ainda) uma fórmula direta. Mas sabe ir **de um dia para o seguinte**:\n\n- dia 1: 3\n- dia 2: $2 \\cdot 3 = 6$\n- dia 3: $2 \\cdot 6 = 12$\n- dia 4: 24, dia 5: 48, dia 6: **96**\n\nUma regra que define cada termo **a partir do anterior** se chama **relação de recorrência**. Ela sempre tem duas partes, que você já conhece com outros nomes:\n\n- o **valor inicial**: $a(1) = 3$ (é o caso base);\n- a **regra de passagem**: $a(n) = 2 \\cdot a(n-1)$ (é o passo).', 'alem', 'Como a indução, a recorrência só aparece no título e numa frase da U8. O conteúdo aqui é o essencial de matemática discreta.'),
        gen('m7.rec', 3),
        texto('**Recorrência e recursão são a mesma ideia.** Um programa recursivo é uma recorrência escrita em código. Em Python, a função das visualizações ficaria assim, em três linhas:\n\n- `def a(n):`\n- `if n == 1: return 3` (o caso base)\n- `return 2 * a(n - 1)` (a função chama a si mesma num problema menor)\n\nSem o caso base, a função chamaria a si mesma para sempre (como os dominós sem ninguém para empurrar: nada começa; aqui, nada termina).\n\n**Dois exemplos clássicos.**\n\n**Fibonacci**: $F(1) = 1$, $F(2) = 1$, $F(n) = F(n-1) + F(n-2)$. Cada termo é a soma dos dois anteriores: 1, 1, 2, 3, 5, 8, 13…\n\n**Torre de Hanói**: para mover $n$ discos de um pino a outro são necessários $T(n) = 2 \\cdot T(n-1) + 1$ movimentos, com $T(1) = 1$. Dá 1, 3, 7, 15, 31…'),
        ex(cheque('m7-k02', 'm7.recorrencia', 'Na Torre de Hanói, T(1) = 1 e T(n) = 2·T(n − 1) + 1. Quanto é T(4)?', ['15', '8', '9'], 0, 'T(2) = 2·1 + 1 = 3; T(3) = 2·3 + 1 = 7; T(4) = 2·7 + 1 = 15.')),
        texto('**Forma fechada.** Calcular $T(64)$ subindo de um em um é possível, mas chato. Melhor ter uma fórmula que dê o termo $n$ **direto**: a **forma fechada**.\n\nOlhe os valores da Hanói: 1, 3, 7, 15, 31. Cada um é uma potência de 2 menos 1:\n\n$$T(n) = 2^n - 1$$\n\nComo ter certeza de que isso vale para **todo** $n$, e não só para os cinco que eu olhei? **Indução.** Base: $T(1) = 2^1 - 1 = 1$. Passo: se $T(k) = 2^k - 1$, então $T(k+1) = 2 \\cdot (2^k - 1) + 1 = 2^{k+1} - 1$. Provado.\n\nAs duas ideias andam juntas: a **recorrência** descreve o processo; a **indução** prova a fórmula.'),
        ex(num('m7-r1', 'm7.recorrencia', undefined, 'Pela forma fechada T(n) = 2ⁿ − 1, quantos movimentos são necessários para uma Torre de Hanói com 10 discos?', 1023, '2¹⁰ − 1 = 1024 − 1 = 1023. Com 64 discos seriam mais de 18 quintilhões: o custo dobra a cada disco.', ['2¹⁰ é 2 multiplicado por ele mesmo 10 vezes.', '2¹⁰ = 1024.', '1024 − 1 = 1023.'], { armadilhas: [{ valor: 1024, causa: 'conta', msg: 'Faltou subtrair 1.' }, { valor: 19, causa: 'conceito', msg: '2ⁿ não é 2 × n. É 2 elevado a n.' }] })),
        texto('**Por que isso importa: o custo dos algoritmos.** O tempo de um algoritmo recursivo é descrito por uma recorrência. Dois comportamentos bem diferentes:\n\n- $T(n) = T(n-1) + 1$: um passo a mais a cada item. Cresce devagar (como $n$).\n- $T(n) = 2 \\cdot T(n-1) + 1$: **dobra** a cada item. Cresce como $2^n$: inviável já para $n = 60$.\n\nÉ a mesma lição da contagem (o fatorial explode) e do conjunto das partes ($2^n$ subconjuntos).\n\nO curso cita uma vez o **Teorema Mestre**: uma receita pronta para resolver recorrências do tipo "divide o problema em pedaços menores" (algoritmos de **divisão e conquista**, como a busca binária). Basta saber que existe e para que serve.'),
        ficha({
          titulo: 'Recorrência: a ficha',
          porque: 'Todo algoritmo recursivo tem uma recorrência por trás, e ela diz quanto tempo ele vai levar quando os dados crescerem.',
          ideia: 'Definir cada termo pelo anterior: um valor inicial e uma regra de passagem. A forma fechada dá o termo direto; a indução prova que ela está certa.',
          regra: '$$a(1) = \\text{valor inicial} \\qquad a(n) = \\text{regra com } a(n-1)$$',
          exemplo: 'Hanói: T(1) = 1, T(n) = 2T(n − 1) + 1. Forma fechada: 2ⁿ − 1.',
          armadilha: 'Esquecer o valor inicial: sem ele, a recorrência (e a recursão) não tem onde parar.',
        }),
      ],
    },
    // ------------------------------------------------------------------ AULA 3
    {
      id: 'm7-aegis', titulo: 'Aula 3 · Aegis-Grid: da frase à tabela', tipo: 'licao', min: 11, resumo: 'As etapas 1 e 2 da atividade avaliativa da U8: lógica proposicional, álgebra booleana e tabela-verdade.',
      steps: [
        texto('**O caso (atividade avaliativa da U8).** Você integra a equipe de análise de uma empresa de tecnologia, a **Aegis-Grid**, com instabilidades no sistema de distribuição. Para parar de decidir no "achismo", a empresa quer **modelar** o problema com as ferramentas da disciplina.\n\nA atividade tem 6 etapas e 18 perguntas. É ela que alimenta a **A3** (40 pontos, sem recuperação), então vale passar por todas com calma.\n\nO ponto de partida é uma frase:\n\n> "A falha do sistema ocorre quando o servidor central falha **ou** quando duas rotas críticas falham **simultaneamente**."'),
        texto('**Etapa 1: lógica proposicional.**\n\n**Pergunta 1: defina as proposições.** Cada afirmação que pode ser verdadeira ou falsa ganha uma letra:\n\n- $p$: o servidor central falha.\n- $q$: a rota crítica 1 falha.\n- $r$: a rota crítica 2 falha.\n\n**Pergunta 2: a expressão.** Traduza a frase, conectivo por conectivo: "ou" vira $\\lor$; "simultaneamente" vira $\\land$ entre as duas rotas.'),
        ex(mcq('m7-q1', 'm7.integracao', 'U8 · Atividade avaliativa · Etapa 1 (item 2)', 'Qual expressão representa "o servidor central falha OU as duas rotas críticas falham simultaneamente"?', ['p ∨ (q ∧ r)', '(p ∨ q) ∧ r', 'p ∧ q ∧ r', 'p ∨ q ∨ r', 'p → (q ∧ r)'], 0, '"Simultaneamente" junta as duas rotas com E; o "ou" liga esse grupo ao servidor. É a resposta do gabarito: p ∨ (q ∧ r).', { porOpcao: [undefined, 'Com os parênteses aí, o sistema só falharia se a rota 2 falhasse. Uma queda só do servidor não contaria.', 'Assim precisariam falhar os três ao mesmo tempo.', 'Assim uma rota sozinha já derrubaria o sistema.'] })),
        texto('**Pergunta 3: o significado.** Com suas palavras (é o que a pergunta pede): o sistema entra em colapso se o servidor central cair, **ou**, alternativamente, se as duas rotas caírem ao mesmo tempo.\n\nO que a expressão revela, e que vale ouro na A3:\n\n- O **servidor** é um **ponto único de falha**: sozinho, derruba tudo.\n- As **rotas** são **redundantes**: uma cobre a outra; só as duas juntas derrubam.\n\n**Etapa 2, pergunta 4: linguagem booleana.** Troque V/F por 1/0, $\\lor$ por $+$ e $\\land$ por $\\cdot$:\n\n$$S = P + (Q \\cdot R)$$\n\n$S = 1$ quer dizer "sistema em falha". Os parênteses nem seriam necessários (o produto já vem antes da soma), mas deixam a leitura clara.'),
        ex({ id: 'm7-tab', kind: 'tabela', topic: 'm7.integracao', fonte: 'U8 · Atividade avaliativa · Etapa 2 (item 5)', expr: 'P + Q·R', ordem: 'asc', notacao: 'bool', prompt: '**Pergunta 5.** Construa a tabela-verdade completa de **S = P + (Q · R)**. Toque nas células para alternar entre 0 e 1.', hints: ['Três variáveis: 2³ = 8 linhas. Faça primeiro a coluna Q·R.', 'Q·R só vale 1 quando Q = 1 e R = 1 (duas linhas: 011 e 111).', 'S = 1 quando P = 1 (quatro linhas) ou Q·R = 1: linhas 011, 100, 101, 110, 111.'], explain: 'S = 1 em **5** linhas: 011 (só as rotas), 100, 101, 110 (servidor) e 111 (tudo).' }),
        ex(num('m7-q2', 'm7.integracao', 'U8 · Atividade avaliativa · Etapa 2 (item 6)', '**Pergunta 6.** Analisando a tabela: em quantas das 8 situações o sistema entra em falha?', 5, 'Cinco: as quatro com P = 1 (o servidor caiu, não importa o resto) e a linha P = 0, Q = 1, R = 1 (servidor bom, as duas rotas caídas).', ['Conte as linhas com S = 1.', 'Com P = 1 são 4 linhas. Falta alguma com P = 0?', '4 + 1 = 5.'], { selo: 'erro', seloNota: 'O gabarito do curso escreve que "o sistema falha em quatro cenários". A tabela do próprio gabarito mostra cinco linhas com S = 1. Conferido por código. Na A3, escreva cinco e diga quais são.', armadilhas: [{ valor: 4, causa: 'leitura', msg: 'É o número que o gabarito do curso escreve, mas a tabela dele mesmo tem 5 linhas com S = 1. Faltou a linha 011: servidor funcionando e as duas rotas caídas.' }] })),
        { t: 'toy', toy: 'aegis', modo: 'desafio', intro: 'O caso inteiro numa tela. Derrube e conserte os componentes tocando neles, e veja a expressão e a tabela acompanharem.', desafios: ['ag-rotas', 'ag-conta'] },
        texto('**Dá para simplificar S = P + QR?** Não. Não há fator comum, nem par $x + x\'$, nem absorção. Ela já está na forma mínima (é a mesma estrutura do alarme $S = AB + M$ que você viu na região de lógica).\n\nMas dá para **reescrever** com a distributiva "estranha": $P + QR = (P + Q)(P + R)$. As duas dizem o mesmo; a primeira é mais barata de construir.'),
        gen('m7.falha', 2),
        ficha({
          titulo: 'Aegis-Grid, etapas 1 e 2: a ficha',
          porque: 'É o modelo que a A3 pede que você explique. A frase em português é ambígua; a expressão e a tabela não são.',
          ideia: 'Frase → proposições → expressão lógica → expressão booleana → tabela-verdade → leitura do que a tabela diz sobre o sistema.',
          regra: '$$p \\lor (q \\land r) \\quad\\longrightarrow\\quad S = P + Q \\cdot R$$',
          exemplo: 'Falha em 5 de 8 situações: 011, 100, 101, 110, 111.',
          armadilha: 'Escrever "quatro cenários", como o gabarito. São cinco. E pôr os parênteses no lugar errado: (p ∨ q) ∧ r é outro sistema.',
        }),
      ],
    },
    // ------------------------------------------------------------------ LAB
    {
      id: 'm7-aegis2', titulo: 'Laboratório · Aegis-Grid: matriz, risco e grafo', tipo: 'lab', min: 12, resumo: 'As etapas 3, 4 e 5 da atividade: a rede como matriz e como grafo, e o risco em números.',
      steps: [
        texto('**Etapa 5 primeiro (ela ajuda as outras): o grafo.** Pergunta 13: modele o sistema como um grafo.\n\n- **Vértices**: a origem dos dados, o servidor central, as duas rotas e o destino.\n- **Arestas**: as conexões por onde o dado passa: origem–servidor, servidor–rota 1, servidor–rota 2, rota 1–destino, rota 2–destino.\n\nO gabarito diz só "vértices (servidores/rotas) e arestas (conexões de dados)". O desenho acima é uma forma concreta de fazer isso; outras são possíveis, e o próprio curso avisa que as respostas podem variar conforme a modelagem.'),
        texto('**Etapa 3: a matriz de adjacência (perguntas 7 a 9).** É a tabela vértice × vértice da região de grafos. Com a ordem O (origem), P (servidor), Q (rota 1), R (rota 2), D (destino):\n\n$$\\begin{array}{c|ccccc|c} & O & P & Q & R & D & \\text{grau} \\\\ \\hline O & 0 & 1 & 0 & 0 & 0 & 1 \\\\ P & 1 & 0 & 1 & 1 & 0 & 3 \\\\ Q & 0 & 1 & 0 & 0 & 1 & 2 \\\\ R & 0 & 1 & 0 & 0 & 1 & 2 \\\\ D & 0 & 0 & 1 & 1 & 0 & 2 \\end{array}$$\n\n**Pergunta 8: como ela mostra as conexões críticas?** A **soma de cada linha** é o grau do vértice. O servidor tem a maior soma (3): é o elemento mais central. Nas palavras do gabarito: "quanto maior a soma de uma linha, mais central é aquele elemento para a estabilidade da rede".\n\n**Pergunta 9: como ajuda a decidir?** Permite simular o "efeito cascata" de uma falha (zere a linha e a coluna de um vértice e veja quem fica sem ligação) e, com isso, decidir onde investir em redundância.', 'alem', 'O gabarito descreve a matriz em palavras, sem mostrar os números. A matriz acima é a do modelo de grafo proposto nesta aula; conferi os graus por código.'),
        ex(cheque('m7-k03', 'm7.integracao', 'Na matriz acima, o que acontece com a rede se o vértice P (servidor) for removido?', ['A origem fica isolada do destino: P é um ponto de articulação', 'Nada: as rotas mantêm a ligação', 'Só a rota 1 para de funcionar'], 0, 'Todo caminho da origem ao destino passa por P. Um vértice cuja retirada desconecta o grafo é um ponto de articulação: é a resposta da pergunta 14 ("gargalos e vulnerabilidades").')),
        texto('**Etapa 4: probabilidade e risco (perguntas 10 a 12).** A tabela diz **em quais** situações o sistema falha. A probabilidade diz **com que chance**.\n\nSuponha (os números são meus, o curso não dá): o servidor falha com probabilidade 0,10; cada rota, com 0,20; e as falhas são **independentes**.\n\n- As duas rotas caírem juntas: $0{,}2 \\times 0{,}2 = 0{,}04$.\n- O sistema **aguentar** precisa das duas coisas: servidor bom **e** rotas não caídas juntas: $0{,}90 \\times 0{,}96 = 0{,}864$.\n- Risco total: $1 - 0{,}864 = 0{,}136$, ou **13,6%**.\n\n(É a regra da adição da região de probabilidade: $0{,}10 + 0{,}04 - 0{,}10 \\cdot 0{,}04$. O gabarito chama de "união de eventos".)\n\n**Pergunta 11: por que combinar eventos complica?** Porque as falhas podem **não** ser independentes: uma tempestade derruba as duas rotas de uma vez; a queda do servidor sobrecarrega uma rota. Aí é preciso **probabilidade condicional**, e multiplicar direto dá risco menor do que o real.', 'alem', 'O gabarito responde às perguntas 10 a 12 só em palavras. Os números (0,10 e 0,20) são um exemplo meu para tornar a conta concreta; conferi por código.'),
        gen('m7.risco', 2),
        { t: 'toy', toy: 'aegis', modo: 'desafio', intro: 'Agora a decisão estratégica: onde vale mais investir? Teste as duas melhorias e leia o risco.', desafios: ['ag-risco', 'ag-reserva'] },
        texto('**O que as três etapas dizem juntas.** A lógica mostrou que o servidor derruba o sistema sozinho. A matriz mostrou que ele é o vértice mais central. O grafo mostrou que ele é um ponto de articulação. A probabilidade mostrou que quase todo o risco (10 dos 13,6 pontos) vem dele.\n\nQuatro ferramentas, a mesma conclusão: **o gargalo é o servidor**. Por isso o servidor reserva rende mais que uma terceira rota.\n\n**Pergunta 12 (prevenção)**: com probabilidades medidas no histórico, a empresa faz **manutenção preditiva**: age antes da falha.\n\n**Pergunta 15 (melhorias)**: o grafo permite projetar **rotas alternativas** e calcular **caminhos mínimos** (Dijkstra), para que a informação chegue mesmo com falhas parciais.'),
        ex(mcq('m7-q3', 'm7.integracao', 'U8 · Atividade avaliativa · Etapa 5 (item 14)', 'Segundo o gabarito, como a teoria de grafos ajuda a identificar gargalos e pontos vulneráveis?', [
          'Através de algoritmos de busca, identificam-se "pontos de articulação", ou seja, nós que, se removidos, isolam partes do sistema.',
          'Somando todos os pesos das arestas para obter o custo total da rede.',
          'Transformando o grafo numa tabela-verdade.',
          'Eliminando todos os ciclos, pois ciclos sempre são vulnerabilidades.',
        ], 0, 'Ponto de articulação: vértice cuja retirada desconecta o grafo. Numa rede, ciclo é redundância, não vulnerabilidade.')),
      ],
    },
    // ------------------------------------------------------------------ ESPIRAL
    {
      id: 'm7-espiral', titulo: 'Desafio · Tudo misturado', tipo: 'desafio', min: 12, resumo: 'Uma volta por todas as regiões, na ordem em que a disciplina as liga. É o treino mais parecido com a prova.',
      steps: [
        texto('A U8 começa com um quiz diagnóstico que mistura as unidades, e termina pedindo um mapa de como um assunto "alimenta" o outro. Esta fase faz as duas coisas: um exercício novo de cada região, com números sorteados.\n\nSe travar em algum, anote qual: é para lá que vale voltar antes da prova.'),
        gen('m1.ie2', 1),
        gen('m2.tabela', 1),
        gen('m2.simpl', 1),
        gen('m3.ac', 1),
        gen('m4.regras', 1),
        gen('m4.binom', 1),
        gen('m5.det', 1),
        gen('m5.sis', 1),
        gen('m6.busca', 1),
        gen('m6.dij', 1),
        texto('**Como os assuntos se ligam** (é a "trama conceitual" da U8):\n\n- **Conjuntos e funções** definem as entradas e saídas de qualquer sistema.\n- **Lógica** dá as regras; **álgebra booleana** transforma as regras em circuito.\n- **Contagem** mede quantas possibilidades existem; **probabilidade** põe chance em cada uma (o $C(n,k)$ dentro da binomial).\n- **Matrizes** guardam dados e também **grafos** (a matriz de adjacência); **sistemas lineares** resolvem várias restrições de uma vez.\n- **Grafos** modelam as redes sobre as quais tudo isso roda.\n- **Indução e recorrência** provam que os algoritmos continuam certos quando os dados crescem.'),
        { t: 'feynman', prompt: 'Escolha duas regiões e explique, com um exemplo, como uma "alimenta" a outra. (É exatamente o que o mapa mental da U8 pede.)' },
      ],
    },
    // ------------------------------------------------------------------ RESUMO
    {
      id: 'm7-leitura', titulo: 'Resumo da disciplina (para revisar)', tipo: 'leitura', min: 5, resumo: 'O quadro-síntese do curso, unidade por unidade, com as correções. Para reler na véspera.',
      steps: [
        texto('Este é o **quadro-síntese** que o curso entrega na U8, com uma linha a mais por unidade.\n\n**U1 · Conjuntos e funções.** Conjuntos: coleções bem definidas. Operações: união, interseção, diferença, complemento. Relações: associações entre elementos (base dos bancos de dados). Funções: cada entrada com uma única saída.\n\n**U2 · Lógica.** Proposições: V ou F. Operadores: E, OU, NÃO, SE…ENTÃO. Tabelas-verdade. Equivalências: transformações que preservam o valor lógico.\n\n**U3 · Álgebra booleana.** Variáveis 0 ou 1. AND, OR, NOT. Simplificação para eficiência. Circuitos digitais: a lógica em hardware.\n\n**U4 · Combinatória.** Princípio da contagem. Arranjos: seleções ordenadas. Combinações: a ordem não importa.'),
        texto('**Um erro no quadro-síntese.** Ele define "**Permutações: arranjos onde a ordem importa**". Todo arranjo já é "onde a ordem importa"; isso não distingue nada. O certo: **permutação** é ordenar **todos** os elementos ($n!$); **arranjo** é escolher e ordenar **alguns** ($n!/(n-p)!$). A permutação é o arranjo com $p = n$.', 'erro', 'Quadro-síntese da U8 (PDF). O mesmo deslize aparece no exercício 9 da lista de probabilidade, que chama de "permutação P(8,3)" um arranjo.'),
        texto('**U5 · Probabilidade.** Espaço amostral: todos os resultados. Evento: subconjunto. Clássica: favoráveis sobre possíveis. Regras da soma e do produto.\n\n**U6 · Álgebra linear.** Vetores: dados com várias dimensões. Matrizes: estruturas para sistemas e dados. Sistemas lineares: resolvidos por métodos matriciais. Transformações lineares: base da computação gráfica.\n\n**U7 · Grafos.** Vértices e arestas. Árvores: grafos conexos sem ciclos. Percursos: BFS e DFS. Algoritmos: Dijkstra, Kruskal.\n\n**U8 · Integração.** Aegis-Grid: $p \\lor (q \\land r)$, $S = P + QR$, falha em 5 de 8 situações; o servidor é ponto único de falha e ponto de articulação. Indução (base + passo) e recorrência (valor inicial + regra).', 'alem', 'O quadro do curso diz "Árvores: grafos sem ciclos". Faltou "conexos": grafo sem ciclos e desconexo é uma floresta. E a introdução da U8 fala em "ângulos e relações trigonométricas", que não fazem parte da disciplina: o trecho veio de outra matéria.'),
        ex(mcq('m7-q4', 'm7.integracao', 'U8 · Quiz diagnóstico', 'Num grupo de 5 amigos: situação A, escolher 2 para ganhar um bombom idêntico cada; situação B, escolher 2 para ganhar ingressos diferentes (um para o cinema e outro para o teatro). Qual a classificação correta?', [
          'Ambas as situações são Arranjos, pois envolvem escolha de pessoas.',
          'Ambas as situações são Combinações, pois o número de pessoas escolhidas é o mesmo.',
          'A situação A é um Arranjo e a situação B é uma Combinação.',
          'A situação A é uma Combinação e a situação B é um Arranjo.',
        ], 3, 'Bombons idênticos: trocar quem ganhou qual não muda nada (combinação, C(5,2) = 10). Ingressos diferentes: quem vai ao cinema e quem vai ao teatro importa (arranjo, A(5,2) = 20).')),
        { t: 'feynman', prompt: 'Sem olhar: escreva uma frase para cada uma das 8 unidades dizendo para que ela serve em computação.' },
      ],
    },
    // ------------------------------------------------------------------ QUESTÕES
    {
      id: 'm7-questoes', titulo: 'Questões reais da U8', tipo: 'questoes', min: 9, resumo: 'O quiz diagnóstico da unidade e as perguntas da atividade avaliativa, com a fonte.',
      steps: [
        ex(mcq('m7-q5', 'm7.integracao', 'U8 · Quiz diagnóstico', 'A = ficção científica, B = premiados, C = publicados nos últimos 5 anos. O cupom vai para livros premiados E recentes, mas que NÃO sejam de ficção científica. Qual expressão?', ['(B ∪ C) − A', '(B ∩ C) − A', 'B ∩ (C ∪ A)', '(B ∩ C) ∩ A', '(B − A) ∪ (C − A)'], 1, '"Premiados E recentes" = B ∩ C; "mas não ficção" = − A.')),
        ex(mcq('m7-q6', 'm7.integracao', 'U8 · Quiz diagnóstico', 'A lógica de um alarme é S = (A · B) + (A · ~B). Qual é a forma simplificada?', ['S = B', 'S = A + B', 'S = A', 'S = A · B', 'S = 1 (sempre verdadeiro)'], 2, "Evidência: A·(B + B') = A·1 = A.")),
        ex(mcq('m7-q7', 'm7.integracao', 'U8 · Quiz diagnóstico', 'Verdadeiro ou falso? "Se uma moeda honesta der cara cinco vezes seguidas, a probabilidade de o sexto lançamento dar coroa é maior do que 50%, para compensar."', ['Falso', 'Verdadeiro'], 0, 'Os lançamentos são independentes: a moeda não tem memória. A chance continua 50%. Esse engano tem nome: falácia do apostador.', { fixo: true })),
        ex(mcq('m7-q8', 'm7.integracao', 'U8 · Quiz diagnóstico', 'Sejam A e B matrizes quadradas de ordem n. Qual afirmação é sempre verdadeira?', ['A · B = B · A', 'Se A · C = B · C e C não é a matriz nula, então A = B', 'A matriz resultante A · B terá ordem n × n', 'A matriz resultante A · B terá ordem 2n × 2n', 'B sempre será invertível'], 2, '(n × n)·(n × n) = n × n. As outras falham: o produto não é comutativo; não se "cancela" matriz (só se C tiver inversa); e nem toda matriz é invertível (determinante zero).', { selo: 'confira', seloNota: 'No texto extraído, as alternativas vêm corrompidas ("B=B.A", "Independentemente de A e A"). Reescrevi no sentido evidente. Vale conferir na plataforma.' })),
        ex(mcq('m7-q9', 'm7.integracao', 'U8 · Atividade avaliativa · Etapa 6 (item 16)', 'Segundo o gabarito, por que a integração entre lógica, matrizes, probabilidade e grafos é essencial para problemas complexos?', [
          'A lógica define as regras de negócio, matrizes e grafos organizam a estrutura, e a probabilidade mede a incerteza; juntos, formam uma solução robusta.',
          'Porque cada ferramenta resolve o problema inteiro sozinha, e as outras servem só para conferir.',
          'Porque a probabilidade substitui a lógica quando há incerteza.',
          'Porque grafos e matrizes são a mesma coisa e a lógica é dispensável.',
        ], 0, 'Regras (lógica), estrutura (matrizes e grafos), incerteza (probabilidade). É a frase-chave para a conclusão da A3.')),
        ex(mcq('m7-q10', 'm7.integracao', 'U8 · Atividade avaliativa · Etapa 6 (item 17)', 'Como o gabarito compara a decisão baseada em modelos matemáticos com a decisão baseada só na intuição?', [
          'Modelos matemáticos oferecem previsibilidade e segurança técnica, enquanto a intuição é subjetiva e propensa a erros em sistemas de grande escala.',
          'A intuição é sempre superior, porque modelos não consideram a experiência.',
          'São equivalentes; a escolha é questão de gosto.',
          'Modelos eliminam completamente o risco, tornando a análise desnecessária.',
        ], 0, 'Previsibilidade e segurança técnica contra subjetividade. Cuidado com a última: modelo não elimina risco (lembre do Telecom e da fábrica: a conta certa pode dar resposta inviável).', { heuristica: '"Sempre", "completamente": absolutos nas erradas.' })),
        ex(mcq('m7-q11', 'm7.integracao', 'U8 · Atividade avaliativa · Etapa 4 (item 11)', 'Por que a combinação de eventos aumenta a complexidade da análise de risco?', [
          'Porque as falhas podem ser dependentes (um evento causa outro), exigindo cálculos de probabilidade condicional.',
          'Porque probabilidades maiores que 1 precisam ser normalizadas.',
          'Porque eventos combinados sempre têm probabilidade zero.',
          'Porque a tabela-verdade deixa de valer quando há mais de um evento.',
        ], 0, 'Dependência entre falhas: é preciso P(A | B), não só multiplicar.')),
        ex(mcq('m7-q12', 'm7.integracao', 'U8 · Atividade avaliativa · Etapa 6 (item 18)', 'Em quais outros contextos o gabarito diz que esses conceitos se aplicam?', ['Redes de Computadores, Engenharia de Software, Logística Urbana e Criptografia', 'Apenas em problemas de geometria e trigonometria', 'Somente em circuitos digitais', 'Só em estatística descritiva'], 0, 'É a lista do gabarito. Na A3, escolha um e dê um exemplo concreto seu.')),
      ],
    },
    // ------------------------------------------------------------------ CHEFÃO
    {
      id: 'm7-chefe', titulo: 'Chefão: o ensaio da A3', tipo: 'chefe', min: 12, resumo: 'O caso Aegis-Grid de ponta a ponta e a estrutura do texto dissertativo-reflexivo.',
      steps: [
        texto('**A A3** (de 05/nov a 02/dez, 40 pontos, **sem recuperação**) é um **texto dissertativo-reflexivo de 2 a 3 páginas**, individual. O curso pede cinco coisas:\n\n1. **Sintetizar** os principais conceitos das unidades.\n2. Mostrar como foram **aplicados** na situação-problema (a Aegis-Grid).\n3. **Refletir** sobre o processo de pesquisa.\n4. Ligar **teoria e prática**.\n5. Contar a sua **trajetória** de aprendizagem.\n\nCom introdução, desenvolvimento e conclusão.\n\nEste chefão repassa o caso do começo ao fim. O texto, quem escreve é você: o jogo guarda os seus rascunhos em **Mais → Rascunho da A3**.'),
        ex(mcq('m7-b1', 'm7.integracao', 'U8 · Atividade avaliativa · Etapa 1', 'Primeiro passo da modelagem: qual conjunto de proposições e expressão descreve o caso?', ['p: servidor falha; q: rota 1 falha; r: rota 2 falha. Expressão: p ∨ (q ∧ r)', 'p: sistema falha; q: servidor falha. Expressão: p → q', 'p, q, r: os três componentes funcionam. Expressão: p ∧ q ∧ r', 'p: servidor falha; q: rota 1 falha; r: rota 2 falha. Expressão: (p ∨ q) ∧ r'], 0, 'As proposições descrevem as FALHAS (é o que o enunciado dá), e a expressão segue a frase: servidor OU (rota 1 E rota 2).', { fixo: true })),
        ex(num('m7-b2', 'm7.integracao', 'U8 · Atividade avaliativa · Etapa 2', 'Em S = P + Q·R, em quantas das 8 situações o sistema está OPERACIONAL (S = 0)?', 3, 'Falha em 5; opera em 8 − 5 = 3: as linhas 000, 001 e 010 (servidor bom e no máximo uma rota caída).', ['Operacional é o complemento de falha.', 'Falha em 5 de 8.', '8 − 5 = 3.'], { armadilhas: [{ valor: 4, causa: 'leitura', msg: 'Seria 4 se o sistema falhasse em 4, como o gabarito escreve. A tabela mostra 5 falhas: sobram 3.' }, { valor: 5, causa: 'leitura', msg: 'Esse é o número de situações de FALHA. A pergunta é em quantas ele funciona.' }] })),
        gen('m7.risco', 1),
        { t: 'toy', toy: 'aegis', modo: 'livre', intro: 'Bancada livre do caso. Mexa nas probabilidades e nas duas melhorias. Anote um número que você queira usar na A3 (por exemplo, o risco antes e depois do servidor reserva).' },
        ex(mcq('m7-b3', 'm7.integracao', undefined, 'Qual frase resume melhor o que as quatro ferramentas mostraram sobre a Aegis-Grid?', [
          'O servidor central é o gargalo: derruba o sistema sozinho (lógica), é o vértice mais central (matriz), é ponto de articulação (grafo) e concentra a maior parte do risco (probabilidade).',
          'As rotas são o gargalo: qualquer uma delas derruba o sistema.',
          'O sistema não tem pontos fracos, pois falha em menos da metade das situações.',
          'Cada ferramenta aponta um problema diferente, e os resultados não se relacionam.',
        ], 0, 'Quatro olhares, uma conclusão. Essa convergência é o melhor argumento para o "por que integrar" da etapa 6. (E o sistema falha em 5 de 8, mais da metade.)', { fixo: true })),
        ex(mcq('m7-b4', 'm7.integracao', undefined, 'Um colega propõe na A3: "o modelo mostra risco de 13,6%, então a empresa terá falha em 13,6% dos dias". O que falta nessa frase?', [
          'Dizer que o número depende das premissas: probabilidades estimadas e falhas supostas independentes. Se as falhas forem dependentes, o risco real é outro.',
          'Nada: o modelo matemático é exato.',
          'Trocar 13,6% por 100%, porque todo sistema falha.',
          'Dizer que probabilidade não se aplica a sistemas reais.',
        ], 0, 'Modelo × realidade, de novo. O curso alerta para "assumir independência entre variáveis quando esta condição não se verifica". Mostrar o limite do modelo é o que torna um texto reflexivo.', { fixo: true })),
        {
          t: 'escrita', fonte: 'A3 · dissertação reflexiva (este é só um parágrafo de treino)',
          prompt: 'Escreva UM parágrafo de desenvolvimento para a A3: explique como a lógica e a álgebra booleana foram aplicadas ao caso Aegis-Grid e o que a tabela-verdade revelou sobre o sistema.',
          modelo: 'Para analisar a instabilidade da Aegis-Grid, o primeiro passo foi trocar a descrição em linguagem comum por um modelo lógico. Defini três proposições, p (o servidor central falha), q (a rota crítica 1 falha) e r (a rota crítica 2 falha), e traduzi a condição de colapso como p ∨ (q ∧ r). Em álgebra booleana, a expressão é S = P + Q·R, em que S = 1 indica falha. A tabela-verdade, com 2³ = 8 linhas, mostrou que o sistema falha em cinco situações: nas quatro em que o servidor cai, qualquer que seja o estado das rotas, e naquela em que o servidor funciona mas as duas rotas caem juntas. Essa leitura revelou algo que a frase original escondia: o servidor é um ponto único de falha, enquanto as rotas são redundantes entre si. O modelo, portanto, não apenas descreveu o problema; indicou onde a empresa deve investir primeiro.',
          rubrica: ['Disse qual era o problema e por que modelar', 'Defini as proposições com letra e frase', 'Escrevi a expressão lógica e a booleana', 'Citei a tabela-verdade com o número certo de falhas (5 de 8) e quais são', 'Interpretei: ponto único de falha × redundância', 'Fechei ligando o resultado a uma decisão prática'],
        },
        texto('**Um esqueleto para as 2 a 3 páginas** (sugestão; o texto e as palavras são seus):\n\n- **Introdução** (1 parágrafo): o que a disciplina tratou e qual era o problema da Aegis-Grid.\n- **Desenvolvimento** (4 a 5 parágrafos): um por ferramenta, sempre no formato "conceito → como apliquei no caso → o que revelou": lógica e booleana; matrizes; probabilidade; grafos. Depois, um parágrafo sobre a **integração** (as quatro apontam para o servidor).\n- **Reflexão** (1 a 2 parágrafos): como você pesquisou, onde errou e corrigiu (o seu **Diário** do jogo tem isso anotado), e os limites dos modelos.\n- **Conclusão** (1 parágrafo): o que mudou no seu jeito de resolver problemas e onde mais isso se aplica.'),
        { t: 'feynman', prompt: 'Escreva aqui a primeira frase da sua A3. Só a primeira. (Ela vai para o seu diário; depois você a leva para o Rascunho da A3.)' },
      ],
    },
  ],
  cards: cards('mat', 'm7', [
    ['As duas partes de uma prova por indução', 'Caso base: P(1) vale. Passo indutivo: se P(k) vale, então P(k + 1) vale. Juntas: vale para todo n.'],
    ['Por que testar muitos casos não prova uma afirmação?', 'Porque ela pode falhar depois. n² + n + 41 dá primo de n = 1 a 39 e falha no 40.'],
    ['Hipótese de indução', 'A suposição "P(k) é verdadeira" usada no passo indutivo para chegar em P(k + 1).'],
    ['1 + 2 + … + n = ?', 'n(n + 1)/2. Com n = 100: 5050.'],
    ['O que é uma relação de recorrência?', 'Uma regra que define cada termo a partir do anterior, mais um valor inicial. É a matemática da recursão.'],
    ['Torre de Hanói: recorrência e forma fechada', 'T(1) = 1, T(n) = 2T(n − 1) + 1. Forma fechada: 2ⁿ − 1.'],
    ['Aegis-Grid: proposições e expressão', 'p: servidor falha; q: rota 1 falha; r: rota 2 falha. p ∨ (q ∧ r), ou S = P + Q·R.'],
    ['Aegis-Grid: em quantas situações falha?', '5 de 8: 011, 100, 101, 110, 111. O gabarito do curso diz "quatro"; a tabela dele mostra cinco.'],
    ['Aegis-Grid: o que a expressão revela?', 'O servidor é ponto único de falha; as rotas são redundantes (só as duas juntas derrubam).'],
    ['Como a matriz de adjacência mostra o elemento mais crítico?', 'Pela soma da linha (o grau): quanto maior, mais central é o vértice.'],
    ['Ponto de articulação', 'Vértice cuja retirada desconecta o grafo. Na Aegis-Grid, o servidor central.'],
    ['Risco total em S = P + QR com falhas independentes', '1 − (1 − P(P))·(1 − P(Q)·P(R)). Com 0,10 e 0,20: 13,6%.'],
    ['Por que combinar eventos complica a análise de risco?', 'As falhas podem ser dependentes; aí é preciso probabilidade condicional.'],
    ['O que a A3 pede?', 'Texto dissertativo-reflexivo de 2 a 3 páginas: sintetizar conceitos, aplicar ao caso, refletir sobre a pesquisa, ligar teoria e prática, contar a trajetória.'],
    ['Lógica, matrizes/grafos, probabilidade: o papel de cada um', 'Lógica define as regras; matrizes e grafos organizam a estrutura; probabilidade mede a incerteza.'],
    ['Permutação × arranjo (o quadro-síntese erra)', 'Permutação ordena TODOS os elementos (n!). Arranjo escolhe e ordena ALGUNS (n!/(n − p)!).'],
  ]),
};
