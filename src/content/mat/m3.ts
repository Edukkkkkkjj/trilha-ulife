// M3 · Contagem (U4, Análise Combinatória), ensinado do zero.
// Fontes: fontes/matematica/U4.txt e o padrão de resposta da campanha Tech-Life.
import type { Regiao } from '../../engine/types';
import { cards, cheque, ex, ficha, gen, mcq, num, texto } from '../ajuda';

export const M3: Regiao = {
  id: 'm3', mundo: 'mat', nome: 'Contagem', unidades: 'U4', pronto: true,
  tese: 'Contar possibilidades sem listar uma por uma. A pergunta que decide tudo: a ordem importa?',
  fases: [
    // ------------------------------------------------------------------ AULA 1
    {
      id: 'm3-pfc', titulo: 'Aula 1 · Multiplicar ou somar?', tipo: 'licao', min: 11, resumo: 'Do zero: a árvore de possibilidades, o princípio multiplicativo (PFC) e o princípio aditivo.',
      steps: [
        texto('**O problema.** Você vai tocar no culto e tem 3 camisetas (branca, preta, azul) e 2 calças (jeans, sarja). De quantos jeitos diferentes dá para se vestir?\n\nDá para listar:\n\n- branca + jeans, branca + sarja\n- preta + jeans, preta + sarja\n- azul + jeans, azul + sarja\n\nSão 6. Repare no formato da lista: **para cada** camiseta (3), aparecem **todas** as calças (2). Três grupos de dois: $3 \\times 2 = 6$.'),
        texto('**A árvore.** O jeito de enxergar isso é um desenho chamado **árvore de possibilidades** (ou diagrama de árvore):\n\n- De um ponto inicial saem 3 galhos: as camisetas.\n- Da ponta de **cada** galho saem 2 galhos: as calças.\n- Cada ponta final (cada **folha**) é um resultado completo.\n\nContar possibilidades é contar folhas. E o número de folhas é o produto dos galhos de cada etapa.\n\nEssa matéria se chama **análise combinatória**: a arte de contar **sem precisar listar**. Com 6 resultados, listar é fácil. Com 3 milhões, só a conta resolve.'),
        { t: 'toy', toy: 'arvore', modo: 'livre', intro: 'Esta é a árvore das roupas: 3 camisetas, 2 calças, 6 folhas. Use os botões + e − para mudar o número de opções e "+ etapa" para acrescentar os tênis. Ligue "Prever antes" para o jogo perguntar quantos resultados vão dar antes de mostrar. Toque perto de uma folha para ver o caminho até ela.' },
        texto('**Princípio multiplicativo.** O que você viu na árvore tem nome: **Princípio Fundamental da Contagem (PFC)**, ou princípio multiplicativo.\n\nSe uma tarefa é feita em etapas, uma depois da outra, e a 1ª etapa tem $n$ opções, a 2ª tem $m$ opções, e assim por diante, o total de resultados é o **produto**:\n\n$$N = n \\times m \\times \\dots \\times p$$\n\nA palavra que denuncia o PFC é **E**: escolho uma camiseta **e** uma calça **e** um tênis.\n\nExemplo do curso: uma senha com 1 letra (26 opções) **e** 1 número (10 opções) tem $26 \\times 10 = 260$ possibilidades.'),
        ex(cheque('m3-k01', 'm3.principios', 'Você tem 3 calças, 5 camisas e 2 pares de sapatos (exemplo do curso). Quantos conjuntos diferentes?', ['30', '10', '15'], 0, 'Uma calça E uma camisa E um sapato: 3 × 5 × 2 = 30. Somar (10) seria escolher uma peça só.')),
        gen('m3.princ', 1),
        texto('**E quando é "ou"?** Outro problema: para ir à faculdade, você pode pegar **um** ônibus (4 linhas servem) **ou** **um** metrô (2 linhas servem). De quantas maneiras dá para ir?\n\nAqui você não escolhe um ônibus **e** um metrô. Você escolhe **uma** condução, de um grupo **ou** do outro. São $4 + 2 = 6$ maneiras.\n\nIsso é o **princípio aditivo**: quando os casos são **mutuamente exclusivos** (escolher um exclui o outro, e nenhuma opção está nos dois grupos), o total é a **soma**:\n\n$$N = n_1 + n_2 + \\dots + n_k$$\n\nResumo das duas palavrinhas:\n\n- **E** (uma coisa e depois outra): **multiplica**.\n- **OU** (uma coisa ou outra, sem misturar): **soma**.'),
        ex(cheque('m3-k02', 'm3.principios', 'A biblioteca tem 10 livros de física e 15 de química. Você vai levar UM livro. Quantas opções?', ['25', '150', '2'], 0, 'Um livro de física OU um de química: 10 + 15 = 25. O produto (150) seria levar um de cada.')),
        texto('**A pegadinha do "ou": grupos que se cruzam.** O princípio aditivo só vale quando nenhuma opção está nos dois grupos. Se estiver, a soma conta essa opção **duas vezes**.\n\nVocê já resolveu isso na região de conjuntos: é a inclusão-exclusão. Soma os grupos e **desconta a interseção**:\n\n$$|A \\cup B| = |A| + |B| - |A \\cap B|$$\n\nA Questão 04 da U4 (clientes Premium e clientes que compraram no mês) é exatamente isso, e você já a respondeu lá.'),
        gen('m3.princ', 3),
        ex(mcq('m3-q1', 'm3.principios', 'U4 · Fundamentos da contagem · Questão 1', 'Questão do curso. O que o Princípio Fundamental da Contagem (PFC) nos permite calcular?', [
          'O número total de possibilidades resultantes de decisões feitas em etapas independentes, multiplicando as opções de cada etapa.',
          'O total de possibilidades somando as opções de cada etapa de um processo.',
          'O número máximo de etapas que um processo pode ter.',
          'A quantidade de possibilidades considerando apenas a primeira etapa de uma tarefa.',
          'A probabilidade de que uma única escolha aconteça em um experimento.',
        ], 0, 'Etapas sucessivas, multiplica. "Somando" é o princípio aditivo, que vale para casos alternativos.')),
        ficha({
          titulo: 'Multiplicativo e aditivo: a ficha',
          porque: 'Antes de testar um sistema, lançar uma campanha ou avaliar uma senha, você precisa saber quantas possibilidades existem. O curso chama isso de medir o "espaço de busca".',
          ideia: 'Etapas em sequência (E): multiplica. Casos alternativos que não se misturam (OU): soma. Se os casos se cruzam, desconta a interseção.',
          regra: '$$\\text{E: } N = n \\times m \\times \\dots \\qquad \\text{OU: } N = n_1 + n_2 + \\dots$$',
          exemplo: 'Senha de 1 letra e 1 número: 26 × 10 = 260. Ir de ônibus (4 linhas) ou metrô (2 linhas): 4 + 2 = 6.',
          armadilha: 'Somar quando era para multiplicar. Teste: "escolho uma de cada?" (multiplica) ou "escolho uma só?" (soma).',
        }),
      ],
    },
    // ------------------------------------------------------------------ AULA 2
    {
      id: 'm3-fat', titulo: 'Aula 2 · Filas, fatorial e anagramas', tipo: 'licao', min: 12, resumo: 'Colocar coisas em ordem: permutação, o símbolo n!, e o que fazer quando há itens repetidos.',
      steps: [
        texto('**O problema.** Três músicas, A, B e C, vão ser tocadas no culto. Em quantas ordens diferentes?\n\nPense em etapas (é o PFC de novo):\n\n- Para a **1ª** música, 3 opções.\n- Para a **2ª**, sobram 2 (uma já foi).\n- Para a **3ª**, sobra 1.\n\n$3 \\times 2 \\times 1 = 6$ ordens: ABC, ACB, BAC, BCA, CAB, CBA.\n\nA diferença para a aula anterior: aqui as opções **vão acabando**, porque não dá para repetir a mesma música.'),
        ex(cheque('m3-k03', 'm3.permutacao', 'E com 4 músicas diferentes, quantas ordens?', ['24', '16', '10'], 0, '4 opções para a 1ª, 3 para a 2ª, 2 para a 3ª, 1 para a última: 4 × 3 × 2 × 1 = 24.')),
        texto('**Fatorial.** Essa conta "multiplica o número por todos os menores até o 1" aparece tanto que ganhou um símbolo: o ponto de exclamação.\n\n$$n! = n \\cdot (n-1) \\cdot (n-2) \\cdots 2 \\cdot 1$$\n\nLê-se "n fatorial". Exemplos:\n\n- $1! = 1$\n- $2! = 2 \\cdot 1 = 2$\n- $3! = 3 \\cdot 2 \\cdot 1 = 6$\n- $4! = 24$\n- $5! = 120$\n- $6! = 720$\n\nCada um é o anterior vezes o número novo: $5! = 5 \\cdot 4!$. Guarde esse truque; ele vai simplificar muita conta.\n\n**Permutação** é o nome de "colocar todos os elementos em ordem". O número de permutações de $n$ elementos diferentes é:\n\n$$P(n) = n!$$', 'confira', 'No texto extraído da U4 aparece "2! = 2 · 1 = 23". O certo é 2! = 2; o "3" deve ser um número de nota de rodapé colado na extração.'),
        gen('m3.fat', 1),
        texto('**Fatorial cresce absurdamente rápido.** Exemplo do curso: um programador quer testar todas as ordenações de uma lista de 10 itens. São $10! = 3.628.800$. Com 20 itens, já são mais de 2 quintilhões.\n\nÉ por isso que a contagem importa para a computação: ela avisa **antes** que "testar tudo" é inviável, e que é preciso um algoritmo esperto.\n\n**E o zero?** Por definição, $0! = 1$. Parece estranho, mas faz sentido: de quantas maneiras dá para organizar **nenhum** objeto? De uma só: não fazendo nada. E as fórmulas que vêm a seguir só funcionam se for assim.'),
        ex(mcq('m3-q2', 'm3.fatorial', 'U4 · Fatorial e Permutação', 'Questão do curso. Qual alternativa descreve corretamente o motivo pelo qual 0! é definido como 1?', [
          'Para garantir a coerência das fórmulas combinatórias e representar a única forma de organizar nenhum elemento.',
          'Porque o produto dos números até 0 é sempre 1, seguindo a multiplicação sequencial.',
          'Para que a definição de permutação nunca retorne zero em nenhum cálculo.',
          'Por ser uma convenção matemática arbitrária sem impacto prático importante.',
          'Para que o fatorial de números negativos não gere resultados inválidos.',
        ], 0, 'Coerência das fórmulas, e "uma única maneira de organizar nada".')),
        texto('**Dividir fatoriais sem calcular tudo.** Quanto é $\\dfrac{10!}{8!}$?\n\nNão calcule 3.628.800 dividido por 40.320. Abra o de cima só até aparecer o de baixo:\n\n$$\\frac{10!}{8!} = \\frac{10 \\cdot 9 \\cdot 8!}{8!} = 10 \\cdot 9 = 90$$\n\nO $8!$ de cima cancela com o de baixo. Sobra só o "começo" do fatorial maior.'),
        gen('m3.fat', 2),
        texto('**Anagramas.** Um **anagrama** é qualquer ordem das letras de uma palavra (não precisa fazer sentido). SOL tem 3 letras diferentes: $3! = 6$ anagramas. LÓGICA tem 6 letras diferentes: $6! = 720$.\n\n**E quando há letra repetida?** Pegue ANA. Finja por um instante que os dois A são diferentes: A₁ N A₂. Seriam $3! = 6$ ordens:\n\n- A₁NA₂ e A₂NA₁ → as duas são **ANA**\n- A₁A₂N e A₂A₁N → as duas são **AAN**\n- NA₁A₂ e NA₂A₁ → as duas são **NAA**\n\nCada palavra de verdade apareceu **2 vezes**, porque trocar um A pelo outro não muda nada. Então o número real é $6 \\div 2 = 3$.\n\nPor que 2? Porque é o número de jeitos de embaralhar os dois A entre si: $2!$.'),
        { t: 'toy', toy: 'arvore', modo: 'desafio', intro: 'Veja isso acontecer. No modo "Anagramas", folhas da mesma cor são a mesma palavra.', desafios: ['a-ana'] },
        texto('**A regra geral: permutação com repetição.** Conte como se tudo fosse diferente ($n!$) e divida pelas trocas que não mudam nada: o fatorial de quantas vezes cada letra se repete.\n\n$$P = \\frac{n!}{p_1! \\cdot p_2! \\cdots p_k!}$$\n\nExemplo do curso, BANANA: 6 letras; A aparece 3 vezes, N aparece 2 vezes (o B, que aparece 1 vez, não muda nada, pois $1! = 1$).\n\n$$\\frac{6!}{3! \\cdot 2!} = \\frac{720}{6 \\cdot 2} = 60$$\n\nRoteiro para qualquer palavra: (1) conte as letras; (2) ache quais se repetem e quantas vezes; (3) monte a fração.'),
        gen('m3.anag', 3),
        ficha({
          titulo: 'Fatorial e permutação: a ficha',
          porque: 'Filas de processos, ordem de execução, senhas, ordenação de listas: tudo isso é "colocar em ordem", e o número de ordens explode rápido.',
          ideia: 'Para ordenar n coisas, as opções vão acabando: n, depois n − 1, … até 1. Com itens repetidos, divide-se pelas trocas que não mudam nada.',
          regra: '$$P(n) = n! \\qquad 0! = 1 \\qquad P = \\frac{n!}{p_1! \\cdot p_2! \\cdots}$$',
          exemplo: 'LÓGICA: 6! = 720. BANANA: 6!/(3!·2!) = 60.',
          armadilha: 'Esquecer de procurar letras repetidas. E n! não é n × n nem a soma de 1 até n.',
        }),
      ],
    },
    // ------------------------------------------------------------------ AULA 3
    {
      id: 'm3-ordem', titulo: 'Aula 3 · A ordem importa?', tipo: 'licao', min: 12, resumo: 'Escolher só alguns: arranjo (com ordem) e combinação (sem ordem). De onde vêm as duas fórmulas.',
      steps: [
        texto('**O problema.** Na aula passada você ordenava **todos** os elementos. Agora são só **alguns**.\n\nCinco atletas (A, B, C, D, E) disputam uma corrida. De quantas formas o pódio (ouro, prata, bronze) pode ficar?\n\nPFC com opções acabando:\n\n- Ouro: 5 opções.\n- Prata: 4 (quem ganhou ouro saiu).\n- Bronze: 3.\n\n$5 \\times 4 \\times 3 = 60$ pódios. É como o fatorial, mas **parando antes**: só 3 fatores, porque só há 3 lugares.'),
        texto('**Arranjo.** Escolher $p$ elementos entre $n$, **com ordem**, chama-se **arranjo**, e se escreve $A(n, p)$.\n\nNa prática: comece em $n$ e multiplique $p$ fatores, descendo. $A(5, 3) = 5 \\cdot 4 \\cdot 3 = 60$.\n\nA fórmula do curso diz a mesma coisa com fatoriais:\n\n$$A(n, p) = \\frac{n!}{(n - p)!}$$\n\nPor quê? $\\dfrac{5!}{2!} = \\dfrac{5 \\cdot 4 \\cdot 3 \\cdot 2!}{2!} = 5 \\cdot 4 \\cdot 3$. O $(n-p)!$ de baixo serve só para **cortar o rabo** do fatorial, deixando os $p$ primeiros fatores. É o truque de cancelar da aula anterior.'),
        ex(cheque('m3-k04', 'm3.arranjo', 'Dez atletas disputam ouro, prata e bronze (autodiagnóstico da U4). Quantos pódios?', ['720', '30', '1000'], 0, 'A(10, 3) = 10 × 9 × 8 = 720. Três fatores, começando em 10.')),
        texto('**Mudando uma coisa só.** Mesmos 5 atletas. Agora não há pódio: é só escolher **3 para uma comissão**, todos com a mesma função.\n\nNo pódio, "ouro A, prata B, bronze C" e "ouro B, prata A, bronze C" eram resultados **diferentes**. Na comissão, {A, B, C} é **o mesmo grupo**, não importa quem foi chamado primeiro.\n\nEntão os 60 pódios estão contando cada comissão **várias vezes**. Quantas?'),
        ex(cheque('m3-k05', 'm3.combinacao', 'O trio {A, B, C} aparece em quantos dos 60 pódios (ou seja, em quantas ordens)?', ['6', '3', '60'], 0, 'São as ordens de 3 pessoas: 3! = 6 (ABC, ACB, BAC, BCA, CAB, CBA).')),
        texto('Cada trio aparece $3! = 6$ vezes. Para ficar com um de cada, divide-se:\n\n$$60 \\div 6 = 10 \\text{ comissões}$$\n\n**Combinação.** Escolher $p$ entre $n$ **sem ordem** chama-se **combinação**, $C(n, p)$. É o arranjo dividido pelas ordens internas de cada grupo:\n\n$$C(n, p) = \\frac{A(n, p)}{p!} = \\frac{n!}{p! \\cdot (n - p)!}$$\n\nÉ a mesma ideia do anagrama com letra repetida: conte como se tudo fosse diferente e **divida pelas trocas que não mudam nada**.'),
        { t: 'toy', toy: 'arvore', modo: 'desafio', intro: 'Monte o pódio e depois transforme em comissão. Quando desligar "a ordem importa", as 60 folhas continuam lá, mas ganham cores: cada cor é um grupo.', desafios: ['a-podio', 'a-comissao'] },
        texto('**A pergunta que decide.** O curso dá a dica e ela vale ouro:\n\n*"Se eu mudar a ordem dos elementos, o resultado final muda?"*\n\n- **Sim** (pódio, senha, cargos diferentes, prateleira): **arranjo**.\n- **Não** (comissão, grupo, sabores de pizza, dezenas da loteria): **combinação**.\n- E se entram **todos** os elementos, com ordem: é **permutação** (que é o arranjo com $p = n$).\n\nExemplos do curso: 3 livros numa prateleira, escolhidos entre 5: $A(5,3) = 60$. Escolher 3 pessoas entre 6 para uma reunião: $C(6,3) = \\dfrac{6 \\cdot 5 \\cdot 4}{3 \\cdot 2 \\cdot 1} = 20$.\n\nNos próximos exercícios o jogo mostra o raciocínio no primeiro e vai escondendo os passos.'),
        gen('m3.ac', 4),
        texto('**Uma simetria bonita.** Escolher 3 pessoas entre 10 para viajar é o mesmo que escolher as 7 que **ficam**. Cada escolha de quem vai determina quem fica. Por isso:\n\n$$C(n, p) = C(n, n - p)$$\n\n$C(10, 3) = C(10, 7) = 120$. Isso também poupa conta: $C(10, 7)$ é chato; $C(10, 3)$ é rápido.\n\n**Com repetição.** O curso cita mais dois casos sem desenvolver. Se a ordem importa e **pode repetir** (senha em que a mesma letra pode aparecer de novo), as opções não acabam: são $n$ em toda etapa, total $n^p$. Um PIN de 4 dígitos tem $10^4 = 10.000$ possibilidades.'),
        ex(mcq('m3-q5', 'm3.combinacao', 'U4 · Avaliando · Questão 05', 'Questão do curso. "Em um grupo de 10 pessoas, o número de formas de escolher 3 para uma viagem é exatamente o mesmo número de formas de escolher 7 para ficarem em casa." Verdadeiro ou falso?', ['Verdadeiro', 'Falso'], 0, 'C(10, 3) = C(10, 7) = 120. Quem escolhe os 3 que vão está, ao mesmo tempo, escolhendo os 7 que ficam.', { fixo: true })),
        ficha({
          titulo: 'Arranjo e combinação: a ficha',
          porque: 'Quase todo problema de contagem da prova é "escolher alguns de um grupo". Errar se a ordem importa é o erro mais comum, e o próprio curso avisa.',
          ideia: 'Arranjo: escolhe e ordena. Combinação: só escolhe; é o arranjo dividido pelas p! ordens de cada grupo.',
          regra: '$$A(n,p) = \\frac{n!}{(n-p)!} \\qquad C(n,p) = \\frac{n!}{p!\\,(n-p)!}$$',
          exemplo: 'Pódio de 3 entre 5: 5·4·3 = 60. Comissão de 3 entre 5: 60 ÷ 3! = 10.',
          armadilha: 'Usar arranjo para grupo sem cargos. Pergunte sempre: trocar a ordem muda o resultado?',
        }),
      ],
    },
    // ------------------------------------------------------------------ LAB
    {
      id: 'm3-lab', titulo: 'Laboratório · A árvore de contagem', tipo: 'lab', min: 8, resumo: 'Tudo da região num brinquedo só: etapas, arranjo, combinação e anagramas.',
      steps: [
        texto('Hora de mexer à vontade. A árvore tem três modos:\n\n- **Etapas**: o princípio multiplicativo.\n- **Escolher p de n**: ligue e desligue "a ordem importa" e "pode repetir" e veja a fórmula mudar.\n- **Anagramas**: digite uma palavra de até 4 letras.\n\nA árvore só desenha até 64 folhas. Quando passar disso, ela avisa. Esse aviso é a lição: a partir de certo ponto, só a fórmula conta.'),
        { t: 'toy', toy: 'arvore', modo: 'livre', intro: 'Experimente os botões "E se…?". Um bom teste: com n = 5 e sem ordem, compare p = 2 e p = 3.' },
        { t: 'toy', toy: 'arvore', modo: 'desafio', intro: 'Três desafios. O último é a simetria da combinação.', desafios: ['a-doze', 'a-campanha', 'a-espelho'] },
        gen('m3.qual', 2),
      ],
    },
    // ------------------------------------------------------------------ RESUMO
    {
      id: 'm3-leitura', titulo: 'Resumo da região (para revisar)', tipo: 'leitura', min: 4, resumo: 'A U4 em uma página, para reler antes da prova. Só faz sentido depois das aulas.',
      steps: [
        texto('Esta página é para **revisão**. Se algo parecer novo, volte à aula daquele assunto.\n\n**Princípio multiplicativo (PFC)**: etapas em sequência (E) multiplicam: $N = n \\times m \\times \\dots$. **Princípio aditivo**: casos alternativos e exclusivos (OU) somam; se os casos se cruzam, desconta a interseção.\n\n**Fatorial**: $n! = n \\cdot (n-1) \\cdots 1$; $0! = 1$; $\\dfrac{10!}{8!} = 10 \\cdot 9$.\n\n**Permutação** (ordenar todos): $P(n) = n!$. Com repetição: $\\dfrac{n!}{p_1! \\cdot p_2! \\cdots}$ (BANANA = 60).'),
        texto('**Arranjo** (escolher $p$ de $n$, a ordem importa): $A(n,p) = \\dfrac{n!}{(n-p)!}$, ou "$p$ fatores começando em $n$".\n\n**Combinação** (a ordem não importa): $C(n,p) = \\dfrac{n!}{p!\\,(n-p)!}$, ou "arranjo dividido por $p!$". Simetria: $C(n,p) = C(n, n-p)$.\n\n**Com repetição e ordem**: $n^p$.\n\n**Como decidir**: trocar a ordem muda o resultado? Sim: arranjo (ou permutação, se entram todos). Não: combinação.\n\n**Casos do curso**: campanha de e-commerce $5 \\times 4 \\times 3 = 60$; Tech-Life $3 \\times 10 \\times 6 = 180$.'),
        ex(mcq('m3-q3', 'm3.escolha-da-tecnica', 'U4 · Fixando os conceitos', 'Deseja-se formar seleções **ordenadas** de 3 elementos a partir de 6 elementos distintos. Qual fórmula usar, e por quê?', [
          'A(n, p) = n! / (n - p)!, pois seleciona e ordena um subconjunto de p elementos de n, considerando a ordem.',
          'C(n, p) = n! / [p! × (n - p)!], pois conta as combinações sem considerar a ordem dos elementos.',
          'P(n) = n!, pois calcula todas as permutações possíveis de n elementos distintos.',
          'P = n! / (p1! × p2! × ... × pk!), pois é usada para permutações com objetos repetidos.',
        ], 0, '"Ordenadas" e "3 de 6": escolhe alguns, com ordem. Arranjo: A(6, 3) = 6 · 5 · 4 = 120.')),
        { t: 'feynman', prompt: 'Sem olhar: explique com um exemplo seu a diferença entre arranjo e combinação, e por que a combinação é "o arranjo dividido por p!".' },
      ],
    },
    // ------------------------------------------------------------------ QUESTÕES
    {
      id: 'm3-questoes', titulo: 'Questões reais da U4', tipo: 'questoes', min: 10, resumo: 'As questões da plataforma, com a fonte. Três delas têm defeito no material; o jogo mostra qual.',
      steps: [
        texto('As alternativas aparecem **embaralhadas**. Atenção: nesta unidade o material tem três questões de anagrama com problemas. O jogo avisa em cada uma o que está errado e o que marcar se cair igual.'),
        ex(mcq('m3-r-computador', 'm3.permutacao', 'U4 · Fatorial e Permutação', 'Considere a palavra "COMPUTADOR", **formada por 10 letras distintas** (é o que diz o enunciado). De quantas maneiras podemos organizar todas essas letras?', ['10! = 3.628.800', '10! / 2! = 1.814.400', '9! = 362.880', '10 × 9 × 8 = 720', '10! / (2! × 3!) = 60.480'], 0,
          'Seguindo o enunciado ("10 letras distintas"), a resposta esperada é 10!. Mas confira as letras: C-O-M-P-U-T-A-D-O-R tem **dois O**. O número real de anagramas é 10!/2! = 1.814.400.',
          { selo: 'erro', seloNota: 'A premissa do enunciado está errada: a letra O aparece duas vezes. Conferido por código. Se cair com a frase "letras distintas", marque 10!; se cair sem ela, o certo é 10!/2!.', porOpcao: [undefined, 'Esse é o número REAL de anagramas, porque COMPUTADOR tem dois O. Mas o enunciado afirma que as letras são distintas, e o gabarito esperado segue o enunciado.'] })),
        ex(mcq('m3-r-balanca', 'm3.permutacao', 'U4 · Estudo guiado (Gersting)', 'Palavra "BALANÇA": letras B, A, L, A, N, Ç, A. Qual o número de permutações distintas, considerando as repetições?', ['7! / 3! = 5040 / 6 = 840', '7! / (3! × 2!) = 5040 / 12 = 420', '7! / 3! = 5040 / 6 = 720', '7! / 2! = 2520', '7! = 5040'], 0,
          'São 7 letras e só o A se repete (3 vezes): 7!/3! = 5040 ÷ 6 = 840.',
          { selo: 'erro', seloNota: 'Na plataforma, três alternativas (A, D e E) dão o mesmo valor, 840, com fórmulas equivalentes, e outra usa a mesma fórmula com resultado 720. Aqui deixei uma só com 840. Se cair, marque a que mostra 7!/3! = 840.' })),
        ex(mcq('m3-r-araras', 'm3.permutacao', 'U4 · Fixando os conceitos', 'Palavra "ARARAS". Qual o número correto de permutações de suas letras?', [
          '60 permutações, calculadas por 6! dividido por (3! × 2!), pois há 6 letras com repetições de A (3 vezes) e R (2 vezes).',
          '720 permutações, pois 6! deve ser usado sem considerar as repetições.',
          '120 permutações, calculadas por 5!, pois a palavra tem 5 letras distintas ignorando a repetição.',
          '36 permutações, resultantes de multiplicar as frequências das letras repetidas como 3 × 2 × 6.',
          '30 permutações, porque a fórmula é simplesmente n! dividido pelo total de repetições somadas.',
        ], 0, 'A aparece 3 vezes, R aparece 2, S aparece 1: 6!/(3!·2!) = 720 ÷ 12 = 60.',
          { selo: 'erro', seloNota: 'Na plataforma, a alternativa correta diz "A (3 vezes) e N (2 vezes)". Não existe N em ARARAS: a letra que repete 2 vezes é o R. O valor 60 está certo. Aqui o texto foi corrigido.' })),
        ex(mcq('m3-q6', 'm3.permutacao', 'U4 · Avaliando · Questão 03', 'Palavra "ALFABETO": 8 letras, com a letra A repetida 2 vezes. Quantas permutações distintas?', ['20160', '40320', '5040', '10080', '2520'], 0, '8!/2! = 40320 ÷ 2 = 20160. (40320 é 8!, que ignora a repetição do A.)')),
        ex(mcq('m3-q7', 'm3.arranjo', 'U4 · Arranjo e Combinação', 'Em um concurso, são escolhidos 4 finalistas entre 10 candidatos para o 1º, 2º, 3º e 4º lugares. Qual fórmula representa o número de maneiras?', ['A(10, 4) = 10! / (10 - 4)!', 'C(10, 4) = 10! / [4! × (10 - 4)!]', '10! / 4!', '4! / (10 - 4)!', '(10 - 4)! / 10!'], 0, 'Posições distintas: a ordem importa. Arranjo: 10 · 9 · 8 · 7 = 5040.')),
        ex(mcq('m3-q8', 'm3.escolha-da-tecnica', 'U4 · Estudo guiado (Araujo et al.)', 'Você precisa selecionar 4 participantes de um grupo de 8 para uma equipe em que a ordem representa a prioridade de decisão. Qual conceito é o mais adequado?', [
          'Arranjo, porque neste caso a ordem importa para definir prioridade.',
          'Combinação, pois estamos apenas selecionando membros sem importar a ordem.',
          'Permutação simples, porque todos os 8 elementos são usados na ordem correta.',
          'Combinação com repetição, pois alguns membros podem repetir posições.',
          'Arranjo com repetição, pois a ordem importa e os elementos podem repetir.',
        ], 0, 'Alguns (4 de 8), com ordem, sem repetir pessoa: arranjo. Permutação usaria os 8.')),
        ex(mcq('m3-q9', 'm3.combinacao', 'U4 · Fixando os conceitos', 'Você vai escolher 3 sabores de pizza entre 8, sem se importar com a ordem. Qual fórmula, e por quê?', [
          'C(8, 3) = 8! / (3! × (8 - 3)!), porque a combinação desconsidera a ordem, dividindo o total de arranjos pelas permutações internas do grupo escolhido.',
          'P(8, 3) = 8! / (8 - 3)!, porque a permutação considera diferentes sequências como itens distintos.',
          '8³, porque a combinação considera as escolhas repetidas e a ordem importa.',
          '3! × 8!, pois multiplicar os fatoriais permite calcular as combinações sem considerar ordem.',
          'C(8, 3) = 8! / 3!, porque a combinação divide o fatorial do total apenas pelo fatorial da quantidade de escolhas.',
        ], 0, 'C(8, 3) = (8 · 7 · 6) ÷ 3! = 336 ÷ 6 = 56. A última alternativa esquece o (8 − 3)! embaixo.')),
        ex(mcq('m3-q10', 'm3.arranjo', 'U4 · Avaliando · Questão 02', 'Qual situação deve ser resolvida com arranjo, e com qual fórmula?', [
          'Escolher e ordenar 3 pilotos entre 10 para formar o top 3 de uma corrida, usando A(10, 3) = 10! / (10-3)!.',
          'Selecionar 3 pilotos entre 10 para participar de uma corrida, independentemente da ordem, usando C(10, 3).',
          'Organizar 10 pilotos todos em uma fila para uma foto, usando a permutação P(10) = 10!.',
          'Dividir 10 pilotos em 3 grupos para diferentes circuitos, sem considerar ordem, usando C(10, 3).',
          'Calcular o número de maneiras de escolher quaisquer pilotos sem se importar com a ordem, usando 10 × 3.',
        ], 0, 'Top 3 = escolher alguns e ordenar: arranjo. As outras descrevem combinação ou permutação corretamente, mas não são arranjo.')),
        ex(num('m3-r-senhas', 'm3.principios', 'U4 · Avaliando · Questão 01', 'Um gerador de senhas monta: 1 letra maiúscula (26 opções), 1 número (10), 1 símbolo especial (4), 1 letra minúscula (26) e 1 dígito hexadecimal (16). Quantas senhas distintas ele pode gerar?', 432640, 'Etapas independentes, uma de cada: 26 × 10 × 4 × 26 × 16 = 432.640. A justificativa da alternativa certa é "multiplicamos as possibilidades independentes de cada etapa".', ['É uma escolha de cada tipo: E, E, E…', 'Princípio multiplicativo: 26 × 10 × 4 × 26 × 16.', '26 × 10 = 260; × 4 = 1040; × 26 = 27.040; × 16 = 432.640.'], { selo: 'confira', seloNota: 'No texto extraído, as alternativas aparecem cortadas (começam por "000"). O valor foi calculado por código; veja o enunciado completo na plataforma.', armadilhas: [{ valor: 82, causa: 'conceito', msg: 'Você somou as opções. São etapas em sequência (uma de cada tipo): multiplica.' }] })),
        ex(mcq('m3-q11', 'm3.combinacao', 'U4 · Autodiagnóstico', 'Um técnico tem 5 atacantes e precisa escolher 2 para começar a partida. De quantas formas?', ['10', '20', '25', '120'], 0, 'A ordem não importa: C(5, 2) = (5 · 4) ÷ 2 = 10. O 20 é o arranjo (conta cada dupla duas vezes).')),
      ],
    },
    // ------------------------------------------------------------------ CHEFÃO
    {
      id: 'm3-chefe', titulo: 'Chefão: a campanha Tech-Life', tipo: 'chefe', min: 12, resumo: 'O estudo de caso da U4, do cálculo ao texto dissertativo que a unidade pede.',
      steps: [
        texto('**A missão (estudo de caso da U4).** Você vai planejar o lançamento do produto **Tech-Life** num mercado saturado. Os recursos:\n\n- **3 vídeos** publicitários (Teaser, Funcionalidades, Depoimentos)\n- **10 influenciadores** digitais\n- **6 plataformas** de anúncio (Instagram, TikTok, Google, LinkedIn, YouTube e X)\n\nUma "estratégia" é um vídeo, com um influenciador, numa plataforma.'),
        ex(num('m3-b1', 'm3.principios', 'U4 · Efetivando: campanha Tech-Life', 'Quantas estratégias diferentes (vídeo × influenciador × plataforma) existem?', 180, 'PFC: 3 × 10 × 6 = 180 combinações estratégicas, como no padrão de resposta do curso.', ['Um vídeo E um influenciador E uma plataforma.', 'Princípio multiplicativo.', '3 × 10 × 6 = 180.'], { armadilhas: [{ valor: 19, causa: 'conceito', msg: 'Você somou 3 + 10 + 6. Cada estratégia usa um de CADA: multiplica.' }] })),
        texto('180 estratégias. Ninguém testa 180 campanhas: o orçamento não deixa. As próximas perguntas são variações minhas sobre o mesmo cenário (não estão no material), para você usar o resto da região.', 'alem', 'O caso do curso para no cálculo 3 × 10 × 6 = 180 e na reflexão escrita. As perguntas seguintes ampliam o cenário para treinar arranjo, combinação e permutação.'),
        ex(num('m3-b2', 'm3.combinacao', undefined, 'O orçamento só dá para anunciar em **3 das 6 plataformas**. Quantos conjuntos de 3 plataformas dá para escolher?', 20, 'Um conjunto de plataformas não tem ordem: C(6, 3) = (6 · 5 · 4) ÷ 3! = 120 ÷ 6 = 20.', ['Trocar a ordem das plataformas escolhidas muda o conjunto?', 'Não muda: combinação. Conte 6 · 5 · 4 e divida por 3!.', '120 ÷ 6 = 20.'], { armadilhas: [{ valor: 120, causa: 'conceito', msg: 'Isso é arranjo (6 · 5 · 4): conta {Instagram, TikTok, Google} seis vezes, uma para cada ordem. Divida por 3!.' }, { valor: 18, causa: 'conceito', msg: '6 × 3 não: é escolher 3 entre 6, sem ordem.' }] })),
        ex(num('m3-b3', 'm3.arranjo', undefined, 'Três influenciadores, dos 10, vão publicar em sequência: o 1º abre a campanha, o 2º aprofunda, o 3º fecha. De quantas formas dá para montar essa sequência?', 720, 'Papéis diferentes: a ordem importa. A(10, 3) = 10 · 9 · 8 = 720.', ['Trocar quem abre com quem fecha muda a campanha?', 'Muda: arranjo. Três fatores, começando em 10.', '10 × 9 × 8 = 720.'], { armadilhas: [{ valor: 120, causa: 'conceito', msg: 'Isso é C(10, 3), que ignora a ordem. Aqui cada posição tem um papel diferente.' }, { valor: 1000, causa: 'conceito', msg: '10³ deixaria o mesmo influenciador ocupar duas posições. Sem repetição: 10 · 9 · 8.' }] })),
        ex(num('m3-b4', 'm3.permutacao', undefined, 'Os 3 vídeos (Teaser, Funcionalidades, Depoimentos) serão todos publicados, um por semana. Em quantas ordens?', 6, 'Todos os elementos, com ordem: permutação. 3! = 6.', ['Entram todos os vídeos, e a ordem importa.', 'Permutação de 3.', '3! = 3 × 2 × 1 = 6.'], { armadilhas: [{ valor: 3, causa: 'conceito', msg: 'São 3 vídeos, mas a pergunta é em quantas ORDENS eles podem sair.' }, { valor: 9, causa: 'conceito', msg: '3 × 3 permitiria repetir vídeo. As opções vão acabando: 3 × 2 × 1.' }] })),
        { t: 'toy', toy: 'arvore', modo: 'livre', intro: 'Confira a última resposta: no modo "Escolher p de n", ponha n = 3 e p = 3 com ordem. Depois veja o que acontece se a agência escolher só 2 dos 3 vídeos.' },
        ex(mcq('m3-b5', 'm3.principios', 'U4 · Fixando os conceitos (interpretação estratégica)', 'Segundo o curso, qual é o papel da análise combinatória numa decisão como essa?', [
          'Garantir que todas as possibilidades sejam consideradas, dando base para comparar e priorizar; ela não decide qual estratégia é a melhor.',
          'Indicar automaticamente a estratégia de maior retorno financeiro.',
          'Substituir os dados históricos de desempenho dos canais.',
          'Reduzir o número de possibilidades a uma só.',
        ], 0, 'O texto diz: "Ela não decide qual estratégia é a melhor, mas garante que todas as possibilidades sejam consideradas". Quem prioriza é o analista, cruzando com dados e orçamento.', { fixo: true })),
        {
          t: 'escrita', fonte: 'U4 · Efetivando (texto de 300 a 400 palavras) e treino para a A1',
          prompt: 'É a atividade da unidade. Escreva (aqui pode ser mais curto) ligando a campanha Tech-Life ao Princípio Fundamental da Contagem: (1) como os recursos criam um espaço de decisões; (2) o cálculo e por que essa magnitude importa para o orçamento; (3) o que muda em relação a decidir por intuição; (4) uma ação prática para os próximos 3 dias.',
          modelo: 'O lançamento da Tech-Life acontece num mercado saturado, em que cada escolha de comunicação afeta alcance e percepção da marca. Os recursos disponíveis (3 vídeos, 10 influenciadores e 6 plataformas) formam um espaço de decisões: cada estratégia é uma escolha de um vídeo, um influenciador e uma plataforma. Como são etapas sucessivas e independentes, aplico o Princípio Fundamental da Contagem: 3 × 10 × 6 = 180 combinações estratégicas únicas. Conhecer esse número importa porque mostra que não é possível testar tudo: o orçamento precisa ser alocado em um subconjunto escolhido com critério, mantendo a narrativa coerente. Antes dessa visão, a decisão tenderia a seguir intuição, experiência passada ou modismo, com risco de repetir mensagens e dispersar recursos, contribuindo para a própria saturação. Com o mapa das 180 possibilidades, posso comparar alternativas, cruzar com dados históricos de cada canal e priorizar as combinações mais alinhadas ao público. A contagem não diz qual é a melhor estratégia; ela garante que nenhuma foi esquecida. Como ação prática, nos próximos três dias vou desenhar um diagrama de árvore para um projeto meu, listando as etapas de decisão e as opções de cada uma, para enxergar o espaço de escolhas antes de decidir.',
          rubrica: ['Descrevi os recursos como etapas de uma decisão (espaço de possibilidades)', 'Apliquei o PFC e mostrei a conta 3 × 10 × 6 = 180', 'Expliquei POR QUE multiplica (etapas sucessivas e independentes)', 'Liguei o número ao orçamento e à coerência da campanha', 'Comparei decidir por intuição com decidir com o mapa de possibilidades', 'Propus uma ação prática concreta (por exemplo, um diagrama de árvore)'],
        },
        { t: 'feynman', prompt: 'Explique para alguém da igreja, sem fórmula: por que escolher 3 pessoas para uma comissão dá menos possibilidades do que escolher 3 pessoas para presidente, vice e tesoureiro?' },
      ],
    },
  ],
  cards: cards('mat', 'm3', [
    ['Princípio multiplicativo (PFC)', 'Etapas em sequência (uma coisa E outra): multiplica as opções de cada etapa.'],
    ['Princípio aditivo', 'Casos alternativos que não se misturam (uma coisa OU outra): soma. Se os casos se cruzam, desconta a interseção.'],
    ['O que é n! ?', 'n · (n−1) · … · 2 · 1. Exemplos: 4! = 24, 5! = 120, 6! = 720.'],
    ['Quanto é 0! e por quê?', '1. Há uma única forma de organizar nenhum elemento, e as fórmulas dependem disso.'],
    ['Quanto é 10!/8! sem calcular tudo?', '10 · 9 = 90. Abra o de cima até aparecer o de baixo e cancele.'],
    ['Permutação de n elementos distintos', 'P(n) = n!. É ordenar todos.'],
    ['Anagramas com letras repetidas', 'n! dividido pelo fatorial de cada repetição. BANANA: 6!/(3!·2!) = 60.'],
    ['Arranjo: quando e como', 'Escolher p de n com ordem. A(n,p) = n!/(n−p)!: p fatores começando em n. A(10,3) = 720.'],
    ['Combinação: quando e como', 'Escolher p de n sem ordem. C(n,p) = A(n,p) ÷ p!. C(5,3) = 60 ÷ 6 = 10.'],
    ['A pergunta que separa arranjo de combinação', 'Se eu trocar a ordem dos escolhidos, o resultado muda? Sim: arranjo. Não: combinação.'],
    ['C(n, p) = C(n, ?)', 'C(n, n − p). Escolher quem vai é escolher quem fica. C(10,3) = C(10,7) = 120.'],
    ['Ordem importa e pode repetir (senhas)', 'nᵖ. Um PIN de 4 dígitos: 10⁴ = 10.000.'],
    ['Tech-Life: quantas estratégias?', '3 vídeos × 10 influenciadores × 6 plataformas = 180 (PFC).'],
    ['O que a contagem faz e o que não faz numa decisão?', 'Garante que todas as possibilidades foram consideradas. Não diz qual é a melhor.'],
  ]),
};
