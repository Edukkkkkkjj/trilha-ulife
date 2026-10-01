// M6 · Grafos (U7), ensinado do zero.
// Fontes: fontes/matematica/U7.txt, os exemplos em Python da unidade e os padrões de resposta das atividades.
import type { Regiao } from '../../engine/types';
import { cards, cheque, conj, ex, ficha, gen, mcq, num, texto } from '../ajuda';

export const M6: Regiao = {
  id: 'm6', mundo: 'mat', nome: 'Grafos', unidades: 'U7', pronto: true,
  tese: 'O desenho de "quem liga com quem": redes, dependências, rotas.',
  fases: [
    // ------------------------------------------------------------------ AULA 1
    {
      id: 'm6-grafo', titulo: 'Aula 1 · Pontos e ligações', tipo: 'licao', min: 11, resumo: 'Do zero: o que é grafo, vértice, aresta, grau; grafos dirigidos e com pesos.',
      steps: [
        texto('**O problema.** A igreja tem cinco equipamentos em rede: a mesa de som (A), o computador da projeção (B), o roteador (C), a câmera (D) e o notebook da transmissão (E). Os cabos ligam:\n\nA com B, A com C, B com C, C com D, D com E.\n\nPerguntas que um técnico faria: todo mundo consegue falar com todo mundo? Se um cabo quebrar, alguém fica isolado? Qual aparelho é o mais "central"?\n\nPara responder, o que importa não é o tamanho dos cabos nem onde ficam os aparelhos. Importa só **quem está ligado com quem**. O desenho que guarda exatamente isso se chama **grafo**.'),
        texto('**As peças.** Um grafo tem só dois ingredientes:\n\n- **Vértices** (ou **nós**): os pontos. Aqui, os aparelhos.\n- **Arestas**: as ligações entre dois vértices. Aqui, os cabos.\n\nNa escrita formal, $G = (V, E)$: $V$ é o **conjunto** dos vértices e $E$ o conjunto das arestas (do inglês *edges*). Para a rede da igreja:\n\n$$V = \\{A, B, C, D, E\\} \\qquad E = \\{AB, AC, BC, CD, DE\\}$$\n\nO mesmo desenho serve para outra coisa qualquer: pessoas e amizades, cidades e estradas, páginas e links, tarefas e dependências. Por isso o curso diz que "o mundo é um problema de grafo".'),
        { t: 'toy', toy: 'grafos', modo: 'livre', intro: 'Esta é a rede da igreja (e é também o grafo do exercício do curso). Com "Mover", arraste os vértices: o desenho muda, o grafo não. Com "+ Aresta", toque em dois vértices para ligar. Embaixo, na aba "Propriedades", veja o que muda. Depois aperte Resetar.' },
        texto('**Grau.** O **grau** de um vértice é o número de arestas que encostam nele. Na rede da igreja:\n\n- A: liga com B e C → grau 2\n- B: liga com A e C → grau 2\n- C: liga com A, B e D → grau **3**\n- D: liga com C e E → grau 2\n- E: liga só com D → grau 1\n\nO roteador (C) é o mais conectado. O notebook (E) depende de um cabo só.\n\n**Um fato curioso.** Some os graus: $2 + 2 + 3 + 2 + 1 = 10$. São 5 arestas. Deu o **dobro**, e sempre dá: cada aresta tem duas pontas, então conta no grau de dois vértices.\n\n$$\\text{soma dos graus} = 2 \\times |E|$$'),
        gen('m6.grau', 3),
        texto('**Três variações do grafo.**\n\n**Dirigido (dígrafo).** Às vezes a ligação tem **sentido**: "a tarefa A precisa vir antes da B", "a página A tem link para B". A aresta vira uma **seta**, escrita como par ordenado $(u, v)$. Cada vértice passa a ter **grau de entrada** (setas que chegam) e **grau de saída** (setas que partem). Sem sentido, o grafo é **não dirigido** e a ligação vale nos dois lados.\n\n**Ponderado.** Cada aresta carrega um número, o **peso**: distância, custo, tempo, latência. É o que permite perguntar "qual o caminho mais barato?".\n\n**Simples.** Um grafo **simples** não tem **laço** (aresta de um vértice para ele mesmo) nem **arestas múltiplas** entre o mesmo par. Quando tem, chama-se **multigrafo** (ou pseudografo). Quase tudo que você vai ver é grafo simples.'),
        ex(cheque('m6-k01', 'm6.conceitos', '"A tarefa T2 depende da T1" é melhor representado por:', ['uma aresta dirigida de T1 para T2', 'uma aresta sem direção entre T1 e T2', 'um peso no vértice T1'], 0, 'Dependência tem sentido: T1 vem antes. É uma seta T1 → T2 (exemplo do curso).')),
        ex(mcq('m6-r-estrutura', 'm6.conceitos', 'U7 · Flashcards de abertura', 'Questão do curso. No uso de grafos para analisar dependências em software, o que são os vértices e as arestas?', ['Vértices: módulos, bibliotecas ou funções. Arestas: relações de dependência ("o módulo A precisa do módulo B").', 'Vértices: as linhas de código. Arestas: os erros de compilação.', 'Vértices: os programadores. Arestas: os salários.', 'Vértices: as dependências. Arestas: os módulos.'], 0, 'Os pontos são as coisas; as ligações são as relações entre elas. O uso é garantir a ordem correta de compilação ou instalação.')),
        ficha({
          titulo: 'Grafo: a ficha',
          porque: 'Redes de computadores, redes sociais, mapas, dependências de software: tudo que é "coisas e ligações entre coisas" vira grafo, e aí valem os mesmos algoritmos.',
          ideia: 'Pontos (vértices) e ligações (arestas). O desenho pode mudar; o que conta é quem liga com quem.',
          regra: '$$G = (V, E) \\qquad \\text{grau}(v) = \\text{arestas em } v \\qquad \\sum \\text{graus} = 2|E|$$',
          exemplo: 'Rede A-B, A-C, B-C, C-D, D-E: graus 2, 2, 3, 2, 1; soma 10 = 2 × 5.',
          armadilha: 'Em grafo dirigido não existe "o grau": existem grau de entrada e grau de saída.',
        }),
      ],
    },
    // ------------------------------------------------------------------ AULA 2
    {
      id: 'm6-estrutura', titulo: 'Aula 2 · Caminhos, ciclos e árvores', tipo: 'licao', min: 12, resumo: 'Andar pelo grafo: caminho, ciclo, conexo. A árvore e a sua conta. Euler e Hamilton.',
      steps: [
        texto('**Andar pelo grafo.** Um **caminho** é uma sequência de vértices em que cada um está ligado ao seguinte por uma aresta. Na rede da igreja, de A até E: A → C → D → E.\n\nO material do curso distingue três nomes, do mais solto para o mais exigente:\n\n- **Passeio**: qualquer sequência seguindo arestas; pode repetir tudo.\n- **Trilha**: não repete **aresta**.\n- **Caminho** (simples): não repete **vértice**.\n\nUm **ciclo** é um caminho **fechado**: volta ao ponto de partida. Na rede: A → B → C → A.\n\nUm grafo é **conexo** quando existe caminho entre **quaisquer** dois vértices: ninguém está isolado. Se não é conexo, ele se quebra em pedaços chamados **componentes conexas**.'),
        ex(mcq('m6-r-ativ1', 'm6.conceitos', 'U7 · Atividade de aprendizagem 01', 'Exercício do curso. O grafo com V = {A, B, C, D, E} e arestas (A,B), (A,C), (B,C), (C,D), (D,E) é conexo? Tem ciclo?', ['É conexo e contém o ciclo A-B-C', 'É conexo e não tem ciclos', 'Não é conexo, mas tem ciclo', 'Não é conexo e não tem ciclos'], 0, 'De qualquer vértice se chega a qualquer outro (conexo), e A-B-C-A é um caminho fechado (ciclo). Os graus, que o exercício também pede, são 2, 2, 3, 2 e 1.')),
        texto('**Ciclo é bom ou ruim?** Depende.\n\nNuma **rede**, ciclo é **redundância**: se o cabo A-B quebrar, A ainda fala com B passando por C. Uma aresta que **não** está em ciclo nenhum é uma **ponte**: se ela cair, a rede se parte. Na igreja, C-D e D-E são pontes.\n\nNum grafo de **dependências** (dirigido), ciclo é **desastre**: "A espera B, que espera C, que espera A". Ninguém começa. Em sistemas, isso se chama *deadlock*. Por isso o curso fala em **DAG**, grafo dirigido **acíclico**: só num DAG as tarefas podem ser postas em ordem.\n\nExemplo do curso: coleta de dados → pré-processamento → treinamento → validação → implantação. Cinco tarefas em fila, sem ciclo.'),
        { t: 'toy', toy: 'grafos', modo: 'desafio', intro: 'Dois desafios com a rede. Use a ferramenta "Apagar".', desafios: ['g-arvore', 'g-ponte'] },
        texto('**Árvore.** No primeiro desafio você tirou uma aresta do ciclo e sobrou um grafo **conexo e sem ciclo nenhum**. Esse tipo de grafo é uma **árvore**.\n\nA árvore é o jeito **mais econômico** de manter tudo conectado: nenhuma aresta sobrando. Daí saem três fatos equivalentes:\n\n- Entre dois vértices quaisquer existe **exatamente um** caminho.\n- Tirar qualquer aresta **desconecta**; acrescentar qualquer aresta **cria ciclo**.\n- O número de arestas é sempre o de vértices menos um:\n\n$$|E| = |V| - 1$$\n\nExemplo do curso: V = {A, B, C, D} e E = {AB, BC, CD} é árvore (4 vértices, 3 arestas). Acrescentando AD, surge o ciclo A-B-C-D-A, e deixa de ser.\n\nNuma **árvore enraizada**, um vértice é escolhido como **raiz** e os outros descem dele em níveis; os da ponta são as **folhas**. É a estrutura das pastas do computador, de um organograma, do HTML de uma página.'),
        gen('m6.arv', 3),
        ex(mcq('m6-q1', 'm6.arvores', 'U7 · Avaliando · Questão 01', 'Qual afirmativa descreve corretamente uma propriedade que diferencia uma árvore de um grafo conexo e possivelmente cíclico?', [
          'Uma árvore é um grafo conexo e acíclico, contendo exatamente |E| = |V| - 1 arestas, garantindo um único caminho simples entre qualquer par de vértices.',
          'Uma árvore é um grafo que necessariamente possui ciclos para garantir a conectividade entre seus vértices.',
          'Uma árvore é um grafo direcionado, onde todos os vértices têm grau de entrada e saída iguais.',
          'Uma árvore é um grafo não conexo que apresenta múltiplos caminhos entre o mesmo par de vértices, caracterizando multigrafos acíclicos.',
          'Uma árvore deve ser um grafo ponderado para assegurar a otimização na escolha dos caminhos entre seus vértices.',
        ], 0, 'Conexo, acíclico, |E| = |V| − 1, caminho único.')),
        texto('**Dois passeios famosos.** A teoria dos grafos nasceu em 1736, quando Leonhard Euler resolveu o problema das **sete pontes de Königsberg**: dá para cruzar todas as pontes da cidade uma única vez e voltar ao início?\n\n**Circuito euleriano**: um ciclo que passa por **todas as arestas** exatamente uma vez. Existe um teste simples, o **Teorema de Euler**:\n\n> existe circuito euleriano se o grafo é **conexo** e **todos os vértices têm grau par**.\n\n(Faz sentido: toda vez que você entra num vértice precisa sair por outra aresta. As arestas de cada vértice se gastam aos pares.)\n\n**Circuito hamiltoniano**: um ciclo que passa por **todos os vértices** exatamente uma vez. É o problema do caixeiro-viajante. Aqui **não há teste simples**: decidir se existe é um problema **NP-completo**, isto é, não se conhece método rápido. Há só garantias parciais, como o **Teorema de Dirac**: se cada vértice tem grau $\\ge n/2$ (com $n$ vértices), o ciclo hamiltoniano existe.\n\nResumo para não trocar: **E**uler = ar**E**stas; Hamilton = vértices.'),
        gen('m6.euler', 2),
        { t: 'toy', toy: 'grafos', modo: 'desafio', intro: 'Agora conserte os graus da rede para que exista um circuito euleriano.', desafios: ['g-euler'] },
        ex(mcq('m6-q4', 'm6.conceitos', 'U7 · Avaliando · Questão 04', 'Num grafo simples com n vértices, qual afirmativa relaciona corretamente o grau mínimo dos vértices e a existência de um ciclo hamiltoniano?', [
          'Se cada vértice tem grau maior ou igual a n/2, então o grafo possui um ciclo hamiltoniano (Teorema de Dirac).',
          'Um grafo possui ciclo hamiltoniano sempre que o grau de entrada de cada vértice for par.',
          'Um grafo simples possui ciclo hamiltoniano se todos os seus vértices tiverem grau exatamente igual a dois.',
          'Se o grafo é conexo e todos os vértices têm grau ímpar, então ele tem um ciclo hamiltoniano.',
          'A existência de um ciclo hamiltoniano independe do grau dos vértices no grafo.',
        ], 0, 'Dirac: grau ≥ n/2 em todos os vértices garante. "Grau par" é a condição de Euler, que fala de arestas, não de vértices.')),
        texto('O curso cita ainda duas propriedades, sem desenvolver: a **densidade** (quantas arestas o grafo tem em relação ao máximo possível: **denso** tem muitas, **esparso** tem poucas) e a **planaridade** (um grafo é **planar** quando dá para desenhá-lo sem que as arestas se cruzem; importa no desenho de circuitos e placas).'),
        ficha({
          titulo: 'Caminhos, ciclos e árvores: a ficha',
          porque: 'Saber se a rede é conexa, onde estão as pontes, se as dependências têm ciclo: são as primeiras perguntas de qualquer análise de rede ou de projeto.',
          ideia: 'Caminho: sequência de vértices ligados. Ciclo: caminho fechado. Conexo: todo mundo alcança todo mundo. Árvore: conexo e sem ciclo.',
          regra: '$$\\text{árvore: } |E| = |V| - 1 \\qquad \\text{Euler: conexo e todos os graus pares} \\qquad \\text{Dirac: grau} \\ge n/2$$',
          exemplo: 'A-B, B-C, C-D é árvore (4 vértices, 3 arestas). Com A-D vira ciclo.',
          armadilha: 'Euler passa por todas as ARESTAS; Hamilton por todos os VÉRTICES. Só Euler tem teste simples.',
        }),
      ],
    },
    // ------------------------------------------------------------------ AULA 3
    {
      id: 'm6-repr', titulo: 'Aula 3 · O grafo dentro do computador', tipo: 'licao', min: 10, resumo: 'Computador não guarda desenho: guarda tabelas. Matriz de adjacência, lista de adjacência e matriz de incidência.',
      steps: [
        texto('**O problema.** O desenho é ótimo para gente. Para um programa, o grafo precisa virar **dados**. Há três jeitos clássicos, e a prova adora perguntar quando usar cada um.\n\nVamos com o exemplo do curso: três vértices, 1, 2 e 3, com as arestas 1–2 e 2–3 (uma fila).\n\n**1. Matriz de adjacência.** Uma tabela quadrada, vértice × vértice. Na linha $i$, coluna $j$, vai **1** se existe aresta de $i$ para $j$, e **0** se não.\n\n$$A = \\begin{pmatrix} 0 & 1 & 0 \\\\ 1 & 0 & 1 \\\\ 0 & 1 & 0 \\end{pmatrix}$$\n\nLinha 2: (1, 0, 1), porque o 2 liga com o 1 e com o 3.\n\n"Adjacente" quer dizer vizinho. Em grafo **não dirigido** a matriz é **simétrica** (espelhada pela diagonal): se 1 liga com 2, 2 liga com 1. Em grafo **ponderado**, no lugar do 1 vai o **peso**.'),
        ex(cheque('m6-k02', 'm6.representacao', 'Num grafo não dirigido com 5 arestas (sem laços), quantos números 1 aparecem na matriz de adjacência?', ['10', '5', '25'], 0, 'Cada aresta aparece duas vezes: na posição (i, j) e na (j, i). 2 × 5 = 10. É o mesmo "dobro" da soma dos graus; aliás, somar uma linha dá o grau daquele vértice.')),
        texto('**2. Lista de adjacência.** Para cada vértice, a lista dos seus vizinhos:\n\n- 1: 2\n- 2: 1, 3\n- 3: 2\n\nEm Python, é um dicionário: `{1: [2], 2: [1, 3], 3: [2]}`. É a forma que os códigos do curso usam.\n\n**3. Matriz de incidência.** Uma tabela **vértice × aresta**: linhas são vértices, colunas são arestas. Vai 1 quando o vértice é uma das pontas daquela aresta. Com $e_1$ = 1–2 e $e_2$ = 2–3:\n\n$$\\begin{array}{c|cc} & e_1 & e_2 \\\\ \\hline 1 & 1 & 0 \\\\ 2 & 1 & 1 \\\\ 3 & 0 & 1 \\end{array}$$\n\nCada coluna tem exatamente dois 1 (as duas pontas). Em grafo dirigido usa-se −1 onde a seta sai e +1 onde chega. Ela **não é quadrada**, a não ser por coincidência.'),
        { t: 'toy', toy: 'grafos', modo: 'livre', intro: 'Abra a aba "Matrizes e lista". Acrescente e apague arestas e veja as três representações mudarem. Ligue "dirigido" e repare que a matriz de adjacência deixa de ser simétrica.' },
        texto('**Qual usar?** A escolha depende de quantas arestas o grafo tem e do que você mais vai perguntar a ele.\n\n**Matriz de adjacência**\n- Responde "existe aresta entre i e j?" **na hora** (é só olhar uma posição).\n- Gasta $|V| \\times |V|$ posições, **haja ou não aresta**. Com 10 mil vértices, 100 milhões de posições.\n- Boa para grafos **densos** (muitas arestas).\n\n**Lista de adjacência**\n- Guarda só as ligações que existem: **econômica em memória**.\n- Percorrer os vizinhos de um vértice é direto.\n- Boa para grafos **esparsos** (poucas arestas), que são a maioria das redes reais.\n\n**Matriz de incidência**\n- Explicita a relação **vértice-aresta**. Usada em análises de topologia, redes elétricas e problemas de fluxo.'),
        ex(mcq('m6-q5', 'm6.representacao', 'U7 · Avaliando · Questão 05', 'Qual afirmativa melhor explica a escolha entre a matriz de adjacência e a lista de adjacência?', [
          'A matriz de adjacência é mais eficiente para grafos densos pois permite acesso em tempo constante para verificar a existência de uma aresta, enquanto a lista de adjacência é preferida para grafos esparsos devido à economia de memória e facilidade para percorrer vizinhos.',
          'A lista de adjacência é indicada exclusivamente para grafos não ponderados, enquanto a matriz de adjacência serve apenas para grafos ponderados.',
          'A matriz de adjacência nunca é simétrica, independentemente do grafo ser direcionado ou não.',
          'A lista de adjacência utiliza uma matriz quadrada para representar as conexões entre vértices, o que a torna ideal para grafos densos.',
          'A matriz de incidência é a representação mais utilizada para todos os tipos de grafos, e economiza memória independentemente da densidade do grafo.',
        ], 0, 'Denso + consulta rápida: matriz. Esparso + percorrer vizinhos: lista.', { heuristica: '"Exclusivamente", "nunca", "todos os tipos": absolutos nas erradas.' })),
        ex(mcq('m6-r-esparso', 'm6.representacao', 'U7 · Representação dos grafos', 'Qual é a escolha mais adequada para um grafo muito esparso (muitos vértices, poucas arestas), quando a operação principal é percorrer todos os vizinhos de um vértice?', [
          'Lista de adjacência, por ser eficiente no uso de memória e facilitar a travessia dos vizinhos.',
          'Matriz de adjacência, pois permite verificar em tempo constante se existe uma aresta entre quaisquer dois vértices.',
          'Matriz de incidência, que relaciona diretamente vértices e arestas e é otimizada para grafos densos.',
          'Representações orientadas a objetos, que são sempre mais eficientes para qualquer tipo de grafo.',
          'Representação visual, porque assegura uma melhor organização das conexões e arestas do grafo.',
        ], 0, 'Esparso e percorrer vizinhos: lista. A frase sobre a matriz é verdadeira, mas responde a outra necessidade (consultar uma aresta específica).')),
        ex(mcq('m6-q3', 'm6.representacao', 'U7 · Avaliando · Questão 03', 'Qual afirmativa melhor justifica a escolha da matriz de incidência em vez da matriz de adjacência?', [
          'A matriz de incidência é preferível quando o foco está na manipulação detalhada das relações vértice-aresta, especialmente em grafos com muitas arestas, facilitando análises topológicas e problemas de fluxo.',
          'A matriz de adjacência é melhor para grafos esparsos pois economiza memória e facilita percorrer os vizinhos de um vértice.',
          'A matriz de adjacência utiliza valores +1 e -1 para representar direção das arestas, sendo indicada para grafos dirigidos.',
          'A matriz de incidência é sempre quadrada, tornando-a mais eficiente para grafos densos.',
        ], 0, 'Incidência = relação vértice-aresta. A segunda descreve a LISTA, não a matriz de adjacência; +1/−1 é da incidência; e a incidência não é quadrada.')),
        ficha({
          titulo: 'Representações: a ficha',
          porque: 'A forma de guardar o grafo decide quanta memória o programa gasta e quão rápido cada algoritmo roda.',
          ideia: 'Matriz de adjacência: tabela vértice × vértice. Lista: os vizinhos de cada vértice. Matriz de incidência: tabela vértice × aresta.',
          regra: '$$\\text{denso} \\to \\text{matriz de adjacência} \\qquad \\text{esparso} \\to \\text{lista de adjacência}$$',
          exemplo: 'Arestas 1–2 e 2–3: matriz com linhas (0,1,0), (1,0,1), (0,1,0); lista 1: 2 · 2: 1, 3 · 3: 2.',
          armadilha: 'Matriz de adjacência só é simétrica em grafo NÃO dirigido. E a de incidência não é quadrada.',
        }),
      ],
    },
    // ------------------------------------------------------------------ AULA 4
    {
      id: 'm6-buscas', titulo: 'Aula 4 · Percorrer: BFS e DFS', tipo: 'licao', min: 11, resumo: 'Duas maneiras de visitar todos os vértices: por camadas (fila) ou indo fundo (pilha).',
      steps: [
        texto('**O problema.** Uma notícia sai de uma pessoa e se espalha pelos contatos. Um vírus entra por um computador e alcança a rede. Um programa precisa visitar todas as páginas de um site seguindo os links.\n\nEm todos os casos é preciso **percorrer o grafo**: sair de um vértice e visitar, de forma organizada, tudo o que dá para alcançar, sem visitar ninguém duas vezes.\n\nHá duas estratégias clássicas. Elas diferem numa única decisão: **quem é o próximo a ser visitado?**'),
        texto('**BFS: busca em largura.** (Do inglês *Breadth-First Search*.) Explora **por camadas**: primeiro todos os vizinhos da origem, depois os vizinhos dos vizinhos, e assim por diante. Como uma onda se espalhando.\n\nA ferramenta é uma **fila**: quem chega primeiro é atendido primeiro (como fila de banco). Receita:\n\n1. Ponha a origem na fila e marque como vista.\n2. Tire o primeiro da fila e visite.\n3. Ponha no **fim** da fila os vizinhos dele que ainda não foram vistos.\n4. Repita até a fila esvaziar.\n\nExemplo do curso: arestas A–B, A–C, B–D, C–D, D–E, começando em A.\n\n- Camada 0: **A**\n- Camada 1 (vizinhos de A): **B, C**\n- Camada 2: **D**\n- Camada 3: **E**\n\nOrdem: A, B, C, D, E.'),
        { t: 'toy', toy: 'grafos', modo: 'livre', preset: 'busca', intro: 'O grafo do exemplo já está carregado e a aba "Algoritmo" aberta, com BFS a partir de A. Aperte "próximo passo" e acompanhe a FILA. O número em cima de cada vértice é a camada. Depois troque para DFS e compare.' },
        texto('**O superpoder da BFS.** Como ela avança camada por camada, a primeira vez que alcança um vértice é pelo **caminho com menos arestas**. Ou seja: em grafo **sem pesos**, a BFS acha o **caminho mínimo**.\n\nÉ assim que uma rede social calcula o "grau de separação" entre duas pessoas, e que um roteador acha a rota com menos saltos.'),
        texto('**DFS: busca em profundidade.** (*Depth-First Search*.) A estratégia oposta: escolhe um vizinho e **vai fundo** nele, depois no vizinho dele, até não haver mais para onde ir. Só então **volta** (retrocede) e tenta outro ramo. Como explorar um labirinto encostando a mão numa parede.\n\nA ferramenta é uma **pilha**: o último que entrou é o primeiro a sair (como pilha de pratos). Na prática, costuma ser feita com **recursão** (a função chama a si mesma).\n\nNo mesmo grafo, começando em A, o curso mostra: A, B, D, E, e depois C.'),
        texto('**A ordem da DFS depende da ordem dos vizinhos.** O curso apresenta "A, B, D, E, C" como a ordem da DFS. Ela é válida, mas não é a única: ao chegar em D, os vizinhos novos são C e E. Se o algoritmo olhar o **E** primeiro, sai A, B, D, E, C (a do curso). Se olhar em **ordem alfabética**, sai A, B, D, C, E.\n\nAs duas são DFS corretas. Numa prova, se o enunciado não disser a ordem dos vizinhos, use a alfabética e **diga isso** na resposta. O brinquedo usa a alfabética.', 'alem', 'Não é erro do material: o texto só não avisa que a ordem depende de como os vizinhos são listados. Gerei as duas ordens por código.'),
        gen('m6.busca', 3),
        texto('**Quando usar cada uma.**\n\n**BFS (fila, por camadas)**\n- Caminho com menos arestas em grafo sem pesos.\n- Propagação "em ondas": grau de separação, alcance de uma mensagem.\n\n**DFS (pilha ou recursão, indo fundo)**\n- **Detectar ciclos**.\n- Analisar **dependências** e achar uma ordem válida de execução (**ordenação topológica**): é o que um compilador faz com os módulos.\n- Achar componentes conexas, pontes, e resolver problemas de **backtracking** (tentativa e volta).\n\nAs duas visitam os mesmos vértices; muda a ordem, e com ela o que cada uma descobre de graça.'),
        ex(mcq('m6-r-bfsdfs', 'm6.buscas', 'U7 · Algoritmos fundamentais', 'Qual afirmação melhor explica a relação entre a estrutura de dados utilizada e a ordem de visitação dos vértices em BFS e DFS?', [
          'BFS utiliza uma fila para visitar os vértices em ordem de proximidade a partir do vértice inicial, garantindo o caminho mínimo em grafos não ponderados, enquanto DFS emprega uma pilha ou recursão para explorar profundamente cada ramificação antes de retroceder.',
          'BFS utiliza uma pilha para garantir que todos os vértices sejam visitados no menor número de passos possíveis, enquanto DFS usa uma fila para explorar o grafo em camadas.',
          'Ambos BFS e DFS usam filas para organizar a ordem de visitação, mas BFS expande em profundidade enquanto DFS expande em largura.',
          'DFS sempre encontra o caminho mais curto entre vértices em grafos ponderados porque utiliza recursão para percorrer todos os caminhos possíveis.',
          'BFS e DFS utilizam estruturas de dados semelhantes que não impactam a ordem da visitação.',
        ], 0, 'BFS = fila = camadas = caminho mínimo sem pesos. DFS = pilha ou recursão = profundidade.')),
        ficha({
          titulo: 'BFS e DFS: a ficha',
          porque: 'Quase todo algoritmo de grafo começa percorrendo o grafo. Saber as duas buscas é saber a base de todos os outros.',
          ideia: 'BFS: fila, camada por camada. DFS: pilha, vai fundo e volta.',
          regra: '$$\\text{BFS} \\to \\text{fila} \\to \\text{menos arestas (sem pesos)} \\qquad \\text{DFS} \\to \\text{pilha/recursão} \\to \\text{ciclos, dependências}$$',
          exemplo: 'A–B, A–C, B–D, C–D, D–E a partir de A. BFS: A, B, C, D, E. DFS: A, B, D, …',
          armadilha: 'Trocar fila com pilha. E achar que a DFS acha o caminho mais curto: não acha.',
        }),
      ],
    },
    // ------------------------------------------------------------------ AULA 5
    {
      id: 'm6-caminhos', titulo: 'Aula 5 · O mais barato: Dijkstra, Bellman-Ford, Kruskal', tipo: 'licao', min: 12, resumo: 'Com pesos nas arestas: o caminho de menor custo e a rede mais barata que conecta todos.',
      steps: [
        texto('**O problema.** Quando as arestas têm **peso** (tempo, custo, latência), "menos arestas" deixa de ser "melhor". Uma rota com três trechos rápidos pode ganhar de uma rota direta e lenta.\n\nSurgem duas perguntas diferentes, com algoritmos diferentes:\n\n1. **Qual o caminho mais barato de um ponto a outro?** (Dijkstra, Bellman-Ford)\n2. **Qual a rede mais barata que mantém todos conectados?** (Kruskal)'),
        texto('**Dijkstra.** (Edsger Dijkstra, 1959; pronuncia-se mais ou menos "déikstra".) Calcula o menor custo da origem até **todos** os outros vértices.\n\nA ideia: manter, para cada vértice, a **melhor distância conhecida até agora**, e ir "fechando" os vértices do mais perto para o mais longe.\n\n1. Origem com distância 0; todos os outros com **infinito** ($\\infty$: "ainda não sei chegar").\n2. Escolha, entre os vértices **em aberto**, o de **menor distância**. Feche-o: a distância dele está decidida.\n3. Para cada vizinho dele: se chegar passando por ele sai mais barato do que o que estava anotado, **atualize**. (Essa atualização se chama **relaxar** a aresta.)\n4. Repita até fechar todos.\n\nPor que funciona? Se os pesos são todos positivos, o vértice em aberto mais próximo **não tem como melhorar**: qualquer outro caminho passaria por alguém mais distante.'),
        { t: 'toy', toy: 'grafos', modo: 'livre', preset: 'pesos', intro: 'Rede com custos, Dijkstra a partir de A. Avance passo a passo: o número em cima de cada vértice é a melhor distância conhecida (∞ = ainda sem caminho). As arestas destacadas formam os caminhos mínimos. Com a ferramenta "Peso", mude um custo e rode de novo.' },
        gen('m6.dij', 2),
        texto('**O limite do Dijkstra: peso negativo.** O raciocínio "o mais próximo não tem como melhorar" quebra se existir aresta de peso **negativo** (um trecho que dá desconto, por exemplo): um caminho que parecia mais longo pode ficar mais barato depois.\n\n**Bellman-Ford** resolve isso com força bruta organizada:\n\n1. Origem 0, resto $\\infty$.\n2. **Relaxe todas as arestas** do grafo. Repita isso $|V| - 1$ vezes.\n3. Faça uma rodada extra de verificação: se alguma aresta **ainda** melhora, existe um **ciclo de peso negativo**.\n\nPor que $|V| - 1$ rodadas? Um caminho sem repetir vértice tem no máximo $|V| - 1$ arestas, e cada rodada garante mais uma aresta do caminho certo.\n\n**Ciclo negativo** é um ciclo cuja soma dos pesos é menor que zero. Dando voltas nele, o custo cai para sempre: "caminho mínimo" deixa de fazer sentido. Só o Bellman-Ford avisa.\n\nO preço: ele é **mais lento** que o Dijkstra. Sem pesos negativos, use Dijkstra.'),
        { t: 'toy', toy: 'grafos', modo: 'livre', preset: 'bellman', intro: 'A rede do exemplo em Python do curso, com a aresta C→B valendo −1 (A = Router A, B = Router B, C = Server C, D = Router D, E = Router E, F = Client F). Rode Bellman-Ford a partir de A. Depois use o cenário "E se… o ciclo for negativo?" e veja a verificação final acusar.' },
        ex(num('m6-r-bf', 'm6.caminhos', 'U7 · Exemplo 03: Bellman-Ford em Python', 'Na rede do curso (A→B 1, A→C 5, B→C 2, B→D 3, C→E 1, C→B −1, D→E 4, E→F 2, E→A 8), qual é a menor distância de A (Router A) até F (Client F)?', 6, 'A → B (1) → C (2) → E (1) → F (2): 1 + 2 + 1 + 2 = 6. Distâncias a partir de A: B = 1, C = 3, D = 4, E = 4, F = 6. Não há ciclo negativo: B→C→B soma 2 + (−1) = 1.', ['Para chegar em F só há um jeito: passando por E.', 'Para E: por C (C→E 1) ou por D (D→E 4). E para C: direto (5) ou por B (1 + 2 = 3).', 'A→B→C→E→F = 1 + 2 + 1 + 2 = 6.'], { armadilhas: [{ valor: 8, causa: 'conceito', msg: 'Você foi direto de A para C (5). Passando por B sai 1 + 2 = 3: mais arestas, menor custo.' }, { valor: 10, causa: 'conta', msg: 'Você foi por D (A→B→D→E→F = 1 + 3 + 4 + 2). Por C é mais barato.' }] })),
        texto('**Kruskal: a rede mais barata.** Outra pergunta: a prefeitura quer ligar todos os bairros com fibra, gastando o mínimo. Não interessa o caminho entre dois pontos; interessa **conectar todos**.\n\nA resposta é uma **árvore** (conecta tudo sem aresta sobrando) com a menor soma de pesos: a **árvore geradora mínima** (a sigla em inglês é MST).\n\nO algoritmo de **Kruskal** é quase óbvio:\n\n1. **Ordene** as arestas da mais barata para a mais cara.\n2. Pegue uma por uma. Se ela liga dois grupos ainda **separados**, entra. Se liga dois vértices **já conectados**, pularia: fecharia um ciclo.\n3. Pare quando tiver $|V| - 1$ arestas.\n\nO curso cita também o algoritmo de **Prim**, que resolve o mesmo problema crescendo a árvore a partir de um vértice.'),
        gen('m6.kru', 2),
        ex(mcq('m6-r-tres', 'm6.caminhos', 'U7 · Algoritmos fundamentais', 'Qual afirmativa descreve corretamente a aplicação e a limitação de Dijkstra, Bellman-Ford e Kruskal?', [
          'Dijkstra é indicado para grafos com pesos não negativos para encontrar o caminho mínimo; Bellman-Ford trata pesos negativos e detecta ciclos negativos; Kruskal constrói a árvore geradora mínima sem formar ciclos.',
          'Dijkstra pode lidar com ciclos negativos, Bellman-Ford não suporta pesos negativos; Kruskal busca o caminho mais curto entre dois vértices em grafos com pesos positivos.',
          'Bellman-Ford é mais eficiente que Dijkstra para todos os grafos; Kruskal é usado para encontrar ciclos negativos em grafos pesados; Dijkstra constrói árvores geradoras mínimas.',
          'Kruskal é aplicado para encontrar o caminho mínimo entre dois vértices com pesos negativos; Bellman-Ford é utilizado apenas em grafos sem ciclos; Dijkstra é usado para construir árvores.',
          'Bellman-Ford e Kruskal são algoritmos para grafos não direcionados; Dijkstra é exclusivo para grafos direcionados e não funciona com pesos positivos.',
        ], 0, 'Dijkstra: pesos não negativos. Bellman-Ford: aceita negativos, detecta ciclo negativo. Kruskal: árvore geradora mínima.')),
        ex(mcq('m6-q6', 'm6.caminhos', 'U7 · Avaliando · Questão 06', 'Qual é a vantagem do algoritmo Bellman-Ford em relação ao Dijkstra?', [
          'Bellman-Ford é capaz de lidar com grafos que possuem arestas com pesos negativos, enquanto Dijkstra não suporta essas arestas.',
          'Dijkstra é indicado para qualquer tipo de grafo, inclusive os com ciclos negativos, enquanto Bellman-Ford não funciona nestes casos.',
          'Ambos os algoritmos só funcionam com grafos representados exclusivamente por matrizes de adjacência em Python.',
          'Bellman-Ford é mais eficiente que Dijkstra para grafos muito grandes e sem arestas negativas.',
          'Dijkstra sempre detecta ciclos negativos, mas Bellman-Ford não consegue identificar essas situações no grafo.',
        ], 0, 'Pesos negativos: só o Bellman-Ford. Sem negativos, o Dijkstra é o mais rápido.')),
        ficha({
          titulo: 'Dijkstra, Bellman-Ford, Kruskal: a ficha',
          porque: 'GPS, roteamento de internet e projeto de infraestrutura são esses três algoritmos.',
          ideia: 'Dijkstra: fecha sempre o vértice aberto mais próximo. Bellman-Ford: relaxa todas as arestas |V| − 1 vezes. Kruskal: pega as arestas mais baratas que não fecham ciclo.',
          regra: '$$\\text{relaxar: se } d[u] + w < d[v] \\text{ então } d[v] = d[u] + w$$',
          exemplo: 'Rede do curso: A→B→C→E→F custa 1 + 2 + 1 + 2 = 6.',
          armadilha: 'Dijkstra com peso negativo dá resposta errada sem avisar. E Kruskal não acha caminho entre dois pontos: ele conecta todos.',
        }),
      ],
    },
    // ------------------------------------------------------------------ LAB
    {
      id: 'm6-lab', titulo: 'Laboratório · O editor de grafos', tipo: 'lab', min: 9, resumo: 'Monte grafos, veja as propriedades e escolha o algoritmo certo para cada problema.',
      steps: [
        texto('Bancada livre. O editor tem cinco ferramentas (mover, + vértice, + aresta, peso, apagar), dois interruptores (dirigido, com pesos) e três painéis (propriedades, matrizes e lista, algoritmo).\n\nO curso indica ferramentas parecidas para estudar: VisuAlgo, Graph Online, Graphviz e o editor da CS Academy. Esta aqui funciona sem internet.'),
        { t: 'toy', toy: 'grafos', modo: 'livre', intro: 'Sugestões: (1) no cenário "Tarefas de um projeto", crie uma seta de G para A e veja "tem ciclo" acender: virou deadlock. (2) No cenário com pesos, rode Kruskal e depois Dijkstra e compare as arestas destacadas: a árvore mais barata NÃO é feita dos caminhos mais curtos.' },
        { t: 'toy', toy: 'grafos', modo: 'desafio', intro: 'Dois desafios que faltavam.', desafios: ['g-graus', 'g-atalho'] },
        gen('m6.qual', 2),
        ex(mcq('m6-q2', 'm6.escolha', 'U7 · Avaliando · Questão 02', 'Qual afirmativa relaciona corretamente as características e aplicações de BFS, DFS, Dijkstra, Bellman-Ford e Kruskal?', [
          'BFS é adequado para encontrar o caminho mínimo em grafos não ponderados usando fila; DFS é usado para detectar ciclos e realizar ordenação topológica; Dijkstra calcula caminhos mínimos em grafos com pesos não negativos; Bellman-Ford trata pesos negativos detectando ciclos negativos; Kruskal constrói uma árvore geradora mínima evitando ciclos.',
          'DFS utiliza fila para explorar o grafo em camadas e encontra o caminho mínimo em grafos ponderados; BFS usa pilha e é indicado para detecção de ciclos; Dijkstra suporta pesos negativos; Bellman-Ford trabalha apenas com grafos não ponderados; Kruskal sempre gera ciclos para maximizar a ligação.',
          'O algoritmo de Kruskal é usado para encontrar caminhos mínimos em grafos com pesos negativos; Dijkstra é eficiente em grafos com ciclos negativos; BFS e DFS servem apenas para grafos ponderados.',
          'Bellman-Ford é mais rápido que Dijkstra para grafos grandes sem pesos negativos; BFS é usado para construir árvores geradoras mínimas; DFS usa uma fila para garantir ordem FIFO.',
          'DFS é indicado para encontrar o caminho mínimo em grafos ponderados com pesos negativos; BFS utiliza recursão para detecção de ciclos; Kruskal necessita que todas as arestas tenham o mesmo peso.',
        ], 0, 'É a tabela inteira da região numa alternativa só.')),
      ],
    },
    // ------------------------------------------------------------------ RESUMO
    {
      id: 'm6-leitura', titulo: 'Resumo da região (para revisar)', tipo: 'leitura', min: 4, resumo: 'A U7 em uma página, para reler antes da prova. Só faz sentido depois das aulas.',
      steps: [
        texto('Esta página é para **revisão**. Se algo parecer novo, volte à aula daquele assunto.\n\n**Grafo** $G = (V, E)$: vértices e arestas. **Dirigido** (setas, grau de entrada e de saída) ou não; **ponderado** (pesos) ou não; **simples** (sem laço nem aresta múltipla). **Grau**: arestas no vértice; soma dos graus = $2|E|$.\n\n**Caminho**, **ciclo** (caminho fechado), **conexo** (todos se alcançam), componentes conexas, ponte. **DAG**: dirigido acíclico (dependências).\n\n**Árvore**: conexo e acíclico; $|E| = |V| - 1$; caminho único entre dois vértices; raiz e folhas.\n\n**Euler**: circuito por todas as **arestas**; existe se conexo e todos os graus pares. **Hamilton**: ciclo por todos os **vértices**; NP-completo; Dirac (grau $\\ge n/2$) garante.'),
        texto('**Representações**: matriz de adjacência (vértice × vértice; consulta rápida; boa para **denso**; simétrica se não dirigido); lista de adjacência (vizinhos de cada um; econômica; boa para **esparso**); matriz de incidência (vértice × aresta; topologia e fluxo).\n\n**BFS**: fila, por camadas; menor número de arestas em grafo sem pesos. **DFS**: pilha ou recursão, vai fundo; ciclos, dependências, ordenação topológica.\n\n**Dijkstra**: caminho mínimo, pesos **não negativos**. **Bellman-Ford**: aceita negativos, relaxa tudo $|V| - 1$ vezes, detecta **ciclo negativo**; mais lento. **Kruskal**: **árvore geradora mínima**; ordena arestas e pula as que fecham ciclo (Prim faz o mesmo de outro jeito).'),
        ex(mcq('m6-r-arv', 'm6.arvores', 'U7 · Estudo guiado (Maida, cap. 6)', 'Por que as árvores são consideradas um tipo especial de grafo, e qual é uma de suas principais aplicações em computação?', [
          'Por serem grafos acíclicos e conexos, as árvores possuem raízes e folhas, facilitando estruturas hierárquicas e algoritmos como buscas em profundidade e largura.',
          'Porque possuem ciclos e múltiplas conexões entre vértices, o que permite otimizar redes de comunicação complexas.',
          'Devido à sua representação por matriz de adjacência, as árvores são mais eficientes para modelar redes direcionadas de comunicação.',
          'Por apresentarem graus iguais em todos os vértices, as árvores são essenciais para identificar rotas mais curtas em grafos direcionados.',
        ], 0, 'Acíclica e conexa; raiz e folhas; hierarquias.')),
        { t: 'feynman', prompt: 'Sem olhar: explique a diferença entre BFS e DFS para alguém que nunca programou. Use uma comparação do dia a dia para a fila e outra para a pilha.' },
      ],
    },
    // ------------------------------------------------------------------ QUESTÕES
    {
      id: 'm6-questoes', titulo: 'Questões reais da U7', tipo: 'questoes', min: 9, resumo: 'As questões da plataforma que ainda não apareceram nas aulas, com a fonte.',
      steps: [
        ex(mcq('m6-r-rodrigues', 'm6.representacao', 'U7 · Estudo guiado (Rodrigues et al.)', 'Qual opção explica corretamente a escolha entre matriz de adjacência e lista de adjacência em termos de eficiência e tipo de grafo?', [
          'A matriz de adjacência é mais eficiente em grafos densos para verificar rapidamente a existência de uma aresta entre dois vértices, enquanto a lista de adjacência é mais econômica em memória para grafos esparsos, facilitando a iteração sobre os vizinhos de um vértice.',
          'A matriz de adjacência é sempre mais econômica em termos de armazenamento do que a lista de adjacência, independente da densidade do grafo.',
          'A lista de adjacência é preferida para grafos densos porque armazena explicitamente todas as conexões, acelerando a busca pela existência de uma aresta.',
          'A matriz de adjacência é indicada apenas para grafos direcionados, enquanto a lista de adjacência é usada exclusivamente para grafos não direcionados.',
          'A escolha entre matriz e lista de adjacência depende exclusivamente do tipo de grafo (ponderado ou não), sem influência do número de vértices ou arestas.',
        ], 0, 'Denso: matriz. Esparso: lista.')),
        ex(mcq('m6-r-python', 'm6.buscas', 'U7 · Modelagem de grafos (códigos em Python)', 'Considerando os códigos de BFS e Bellman-Ford do curso, qual é a principal diferença entre eles?', [
          'O BFS explora o grafo por camadas usando uma fila e é adequado para encontrar o caminho mais curto em grafos não ponderados, enquanto o Bellman-Ford calcula distâncias mínimas em grafos ponderados, podendo lidar com pesos negativos.',
          'O BFS utiliza pesos para escolher o caminho mais barato, enquanto o Bellman-Ford ignora os pesos e visita os nós em ordem sequencial.',
          'Bellman-Ford não pode detectar ciclos negativos, já o BFS é especializado em detectar esses ciclos para evitar loops infinitos.',
          'Os dois algoritmos são equivalentes, ambos utilizam uma fila para explorar o grafo camada por camada sem levar em conta pesos das arestas.',
          'O algoritmo BFS é mais indicado para grafos com arestas de peso negativo, pois não atualiza distâncias como o Bellman-Ford.',
        ], 0, 'BFS: fila, sem pesos. Bellman-Ford: pesos, inclusive negativos. No código do curso, a fila é o `deque` com `popleft()`.')),
        ex(conj('m6-r-graus', 'm6.conceitos', 'U7 · Atividade de aprendizagem 01', 'No grafo do exercício (A,B), (A,C), (B,C), (C,D), (D,E): quais vértices têm grau 2? (Separe por vírgula.)', ['A', 'B', 'D'], 'Graus: A = 2, B = 2, C = 3, D = 2, E = 1. Com grau 2: A, B e D.', ['Conte as arestas em que cada letra aparece.', 'C aparece em três (AC, BC, CD). E aparece em uma (DE).', 'A, B, D.'], [{ valor: ['A', 'B', 'C', 'D'], causa: 'conta', msg: 'C aparece em AC, BC e CD: grau 3.' }])),
        ex(mcq('m6-r-bfsproj', 'm6.buscas', 'U7 · Atividade de aprendizagem 02', 'Projeto de TI do curso: A (requisitos) → B (banco) e C (interface); B → D (backend); C → E (frontend); D e E → F (testes); F → G (implantação). Qual é a ordem da BFS a partir de A?', ['A, B, C, D, E, F, G', 'A, B, D, F, G, C, E', 'G, F, E, D, C, B, A', 'A, C, E, B, D, F, G'], 0, 'Por camadas: A; depois B e C; depois D e E; depois F; depois G. A segunda alternativa é a DFS (vai fundo por B antes de olhar C).', { porOpcao: [undefined, 'Essa é a ordem da DFS: foi fundo por B → D → F → G antes de voltar para C.'] })),
        ex(mcq('m6-r-rede', 'm6.conceitos', 'U7 · Exemplo: grafos em redes de comunicação', 'Segundo o curso, qual é um erro comum ao modelar uma rede de computadores como grafo ponderado?', ['Atribuir pesos padronizados às arestas sem a devida medição, gerando caminhos subótimos ou congestionamentos', 'Usar vértices para representar roteadores e switches', 'Usar algoritmos como Dijkstra e Bellman-Ford para achar rotas', 'Representar conexões bidirecionais como arestas não direcionadas'], 0, 'O texto: "Erros comuns incluem atribuir pesos padronizados sem a devida medição". Também alerta para o viés de olhar só a menor latência e ignorar a redundância de rotas.')),
        ex(mcq('m6-r-maida', 'm6.conceitos', 'U7 · Estudo guiado (Maida)', 'Segundo as leituras recomendadas, qual é a melhor estratégia para uma compreensão sólida da Teoria de Grafos?', [
          'Iniciar pela leitura do Capítulo 2 sobre Grafos para entender os conceitos básicos, seguido pelo Capítulo 1 com a introdução histórica, e complementar com o Capítulo 6 sobre Árvores para aprofundamento.',
          'Ler apenas o Capítulo 6 sobre Árvores, pois ele cobre todos os conceitos fundamentais e avançados da Teoria de Grafos.',
          'Primeiro ler o Capítulo 1 de introdução, e depois pular diretamente para o Capítulo 6 sobre Árvores, ignorando o Capítulo 2.',
          'Ler somente o Capítulo 2 sobre Grafos, pois não é necessário entender o histórico ou as árvores.',
          'Ler os capítulos na ordem inversa: primeiro o Capítulo 6, depois o Capítulo 2, e por último o Capítulo 1.',
        ], 0, 'É uma pergunta sobre a ordem das leituras que a própria unidade indica: capítulo 2, depois 1, depois 6.', { heuristica: 'As erradas usam "apenas", "somente", "ignorando". A certa é a única que inclui os três capítulos na ordem em que o curso os indica.' })),
        ex(mcq('m6-r-euler', 'm6.conceitos', 'U7 · Atividade de aprendizagem 03', 'Qual a diferença entre um circuito euleriano e um circuito hamiltoniano?', ['Euleriano passa por cada aresta exatamente uma vez; hamiltoniano passa por cada vértice exatamente uma vez', 'Euleriano passa por cada vértice uma vez; hamiltoniano por cada aresta uma vez', 'Os dois passam por todas as arestas; só o euleriano volta ao início', 'Euleriano só existe em grafos dirigidos; hamiltoniano, em não dirigidos'], 0, 'Euler: arestas (teste: conexo e graus pares). Hamilton: vértices (sem teste simples; NP-completo).')),
      ],
    },
    // ------------------------------------------------------------------ CHEFÃO
    {
      id: 'm6-chefe', titulo: 'Chefão: a rede da empresa', tipo: 'chefe', min: 12, resumo: 'O exemplo de rede do curso em Python, do desenho aos algoritmos.',
      steps: [
        texto('**A missão (exemplo 01 da U7, em Python).** Você recebeu a rede de uma empresa para analisar. O código do curso cria seis equipamentos e cinco ligações:\n\n- Servidor Web — Banco de Dados\n- Servidor Web — Firewall\n- Firewall — Roteador Principal\n- Roteador Principal — Switch\n- Switch — Estação de Trabalho'),
        ex(mcq('m6-b1', 'm6.arvores', 'U7 · Exemplo 01: modelagem de grafo em Python', 'Seis vértices, cinco arestas, conexo. O que esse grafo é?', ['Uma árvore: conexo, sem ciclo e com |E| = |V| − 1', 'Um grafo com ciclo', 'Um grafo desconexo', 'Um grafo euleriano'], 0, '6 vértices e 5 arestas, todos alcançáveis: é árvore. Não é euleriano: as pontas (Banco de Dados e Estação) têm grau 1, ímpar.', { fixo: true })),
        ex(mcq('m6-b2', 'm6.conceitos', undefined, 'O que isso significa para a confiabilidade da rede?', ['Qualquer cabo que falhe isola alguém: toda aresta é uma ponte, não há redundância', 'A rede aguenta a falha de qualquer cabo', 'A rede tem caminhos alternativos entre todos os pontos', 'Nada: árvore e rede com ciclos se comportam igual'], 0, 'Em árvore existe exatamente um caminho entre dois vértices. Sem ciclo, não há rota alternativa. O curso avisa: ignorar a redundância leva a "redes frágeis, suscetíveis a interrupções".', { fixo: true })),
        ex(num('m6-b3', 'm6.buscas', undefined, 'Quantos saltos (arestas) há entre a Estação de Trabalho e o Banco de Dados? (É o que a BFS calcularia.)', 5, 'Estação → Switch → Roteador → Firewall → Servidor Web → Banco de Dados: 5 arestas. Como é árvore, esse é o único caminho.', ['Siga as ligações da lista, da Estação até o Banco.', 'Estação, Switch, Roteador, Firewall, Servidor Web, Banco.', '6 vértices no caminho: 5 arestas.'], { armadilhas: [{ valor: 6, causa: 'conta', msg: 'São 6 equipamentos no caminho, mas a pergunta é quantas ligações: uma a menos.' }] })),
        texto('**Parte 2: a rede cresceu.** A empresa contratou links extras para ter redundância, e agora cada ligação tem um **custo de latência**. Use o editor abaixo (cenário "Rede com pesos") para responder às duas perguntas seguintes. Os vértices são A, B, C, D, E, F; as ligações são:\n\nA–B 4, A–C 2, B–C 1, B–D 5, C–E 8, D–E 2, D–F 6, E–F 3.'),
        { t: 'toy', toy: 'grafos', modo: 'livre', preset: 'pesos', intro: 'Rode Dijkstra a partir de A até o fim, e depois Kruskal. Anote a distância até F e o custo total da árvore.' },
        ex(num('m6-b4', 'm6.caminhos', undefined, 'Qual é a menor latência de A até F?', 13, 'A → C (2) → B (1) → D (5) → E (2) → F (3) = 13. Repare que o caminho passa por C para chegar em B (2 + 1 = 3, melhor que o cabo direto A–B, que custa 4).', ['Comece: A = 0. Vizinhos: B = 4, C = 2. Feche C.', 'Por C, B melhora para 3. Depois D = 8, E = 10 (por D).', 'F: por E dá 10 + 3 = 13; por D daria 8 + 6 = 14.'], { armadilhas: [{ valor: 14, causa: 'conta', msg: 'Quase. Ou você chegou em F direto de D (8 + 6), ou usou o cabo direto A–B (4) em vez de ir por C (2 + 1 = 3). O mínimo é 13.' }] })),
        ex(num('m6-b5', 'm6.caminhos', undefined, 'Qual é o custo total da árvore geradora mínima dessa rede (Kruskal)?', 13, 'Em ordem: BC (1), AC (2), DE (2), EF (3) entram; AB (4) fecharia o ciclo A-B-C, fica de fora; BD (5) entra e completa as 5 arestas. Total: 1 + 2 + 2 + 3 + 5 = 13.', ['Ordene: BC 1, AC 2, DE 2, EF 3, AB 4, BD 5, DF 6, CE 8.', 'AB liga dois vértices já conectados (por C): pule.', '1 + 2 + 2 + 3 + 5 = 13.'], { armadilhas: [{ valor: 12, causa: 'conceito', msg: 'Você pegou as 5 mais baratas (1, 2, 2, 3, 4). A de custo 4 (A–B) fecha ciclo: no lugar dela entra a de custo 5.' }, { valor: 31, causa: 'conceito', msg: 'Você somou todos os cabos. A árvore usa só 5 das 8 ligações.' }] })),
        ex(mcq('m6-b6', 'm6.escolha', undefined, 'Num upgrade, uma das ligações passa a ter custo NEGATIVO (um desconto por tráfego). Que algoritmo de caminho mínimo usar agora?', ['Bellman-Ford: aceita pesos negativos e avisa se houver ciclo negativo', 'Dijkstra: é sempre o mais rápido', 'BFS: basta contar os saltos', 'Kruskal: é o que lida com pesos'], 0, 'É exatamente a situação do exemplo 03 do curso (a aresta com −1 "após upgrade"). Dijkstra não é confiável com peso negativo.', { fixo: true })),
        {
          t: 'escrita', fonte: 'treino para a A1 dissertativa',
          prompt: 'Como numa prova dissertativa: uma rede tem 4 servidores (A, B, C, D) ligados em anel: A–B, B–C, C–D, D–A. Descreva o grafo (V, E, graus), diga se é conexo, se tem ciclo, se é árvore e se tem circuito euleriano, justificando cada resposta. Formato "defino…, monto…, logo…".',
          modelo: 'Defino o grafo G = (V, E) com V = {A, B, C, D}, em que cada vértice é um servidor, e E = {AB, BC, CD, DA}, em que cada aresta é um cabo. O grafo é não dirigido, pois o cabo serve nos dois sentidos. Monto os graus: cada servidor está em duas arestas, logo todos têm grau 2; a soma dos graus é 8, o dobro das 4 arestas. O grafo é conexo, porque de qualquer servidor chego a qualquer outro seguindo o anel. Tem ciclo: A-B-C-D-A é um caminho fechado. Logo, não é árvore: uma árvore é conexa e acíclica, e teria |V| − 1 = 3 arestas, e aqui há 4. Pelo Teorema de Euler, como o grafo é conexo e todos os vértices têm grau par, existe circuito euleriano (o próprio anel). Na prática, o ciclo dá redundância: se um cabo falhar, a rede continua conexa, pois vira uma árvore com 3 arestas.',
          rubrica: ['Escrevi V e E e disse o que cada um representa', 'Calculei os graus (e conferi com 2 × |E|)', 'Justifiquei a conexidade', 'Identifiquei o ciclo e concluí que não é árvore, citando |E| = |V| − 1', 'Apliquei o Teorema de Euler (conexo e graus pares)', 'Interpretei: o que o ciclo significa para a rede'],
        },
        { t: 'feynman', prompt: 'Explique para alguém da igreja: por que a rede "em árvore" é a mais barata de montar e a mais frágil de manter?' },
      ],
    },
  ],
  cards: cards('mat', 'm6', [
    ['O que é um grafo?', 'G = (V, E): um conjunto de vértices (pontos) e um conjunto de arestas (ligações entre dois vértices).'],
    ['Grau de um vértice; soma dos graus', 'Grau: número de arestas no vértice. A soma de todos os graus é 2 × |E|.'],
    ['Grafo dirigido × não dirigido', 'Dirigido: arestas com sentido (setas), grau de entrada e de saída. Não dirigido: a ligação vale nos dois sentidos.'],
    ['O que é uma árvore? Quantas arestas tem?', 'Grafo conexo e sem ciclo. |E| = |V| − 1. Um único caminho entre dois vértices.'],
    ['Euleriano × hamiltoniano', 'Euler: passa por todas as ARESTAS uma vez (existe se conexo e todos os graus pares). Hamilton: por todos os VÉRTICES (NP-completo; Dirac: grau ≥ n/2 garante).'],
    ['Matriz de adjacência: quando usar?', 'Tabela vértice × vértice. Consulta de aresta na hora. Boa para grafos densos; gasta |V|² posições.'],
    ['Lista de adjacência: quando usar?', 'Vizinhos de cada vértice. Econômica em memória; boa para grafos esparsos e para percorrer vizinhos.'],
    ['Matriz de incidência', 'Tabela vértice × aresta (não é quadrada). Usada em topologia e problemas de fluxo.'],
    ['BFS', 'Busca em largura: usa FILA, visita por camadas. Acha o caminho com menos arestas em grafo sem pesos.'],
    ['DFS', 'Busca em profundidade: usa PILHA (ou recursão), vai fundo e retrocede. Detecta ciclos; ordenação topológica.'],
    ['Dijkstra', 'Caminho mínimo de uma origem para todos. Só com pesos NÃO negativos. Fecha sempre o vértice aberto mais próximo.'],
    ['Bellman-Ford', 'Caminho mínimo que aceita pesos negativos. Relaxa todas as arestas |V| − 1 vezes e detecta ciclo negativo. Mais lento.'],
    ['Kruskal', 'Árvore geradora mínima: ordena as arestas por peso e pula as que fechariam ciclo.'],
    ['O que é um DAG e para que serve?', 'Grafo dirigido acíclico. Modela dependências entre tarefas; sem ciclo, existe uma ordem válida de execução.'],
    ['O que é uma ponte?', 'Aresta cuja retirada desconecta o grafo. Não pertence a nenhum ciclo. Numa rede, é ponto único de falha.'],
    ['"Relaxar" uma aresta', 'Se d[u] + peso < d[v], atualiza d[v]. É o passo básico de Dijkstra e Bellman-Ford.'],
  ]),
};
