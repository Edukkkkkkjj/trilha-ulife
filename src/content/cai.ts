// "Como isso cai": um cartão no fim de cada aula, com uma linha para cada prova.
// A1 = dissertativa (só U1 a U4); A2 = objetiva (tudo); A3 = caso integrador (Aegis-Grid em Matemática; cenário organizacional em Exploração).
// Fica num arquivo só para ser fácil de revisar; content/index.ts anexa cada cartão à aula de mesmo id.
import type { Phase, Regiao } from '../engine/types';
import { cai } from './ajuda';

type Linhas = [a1: string, a2: string, a3: string];

/** Linha de A1 das aulas que não caem nela. */
const FORA = 'Não cai na A1 (ela só cobra U1 a U4). Estude para a A2 e a A3.';

export const CAI: Record<string, Linhas> = {
  // ---------------------------------------------------------------- Matemática · U1
  'm1-oque': [
    'Defina conjunto (coleção bem definida de elementos distintos, sem ordem) e dê um exemplo seu. Use ∈ para elemento e ⊆ para conjunto.',
    'Trocar ∈ por ⊆, ou aceitar repetição e ordem. Desconfie de "qualquer", "aleatória", "exclusivo".',
    'No Aegis-Grid, o servidor e as rotas são os elementos; cada regra de falha fala de um subconjunto deles.',
  ],
  'm1-conj': [
    'Escreva a operação com o símbolo, mostre os elementos passo a passo e diga a frase: ∪ é OU, ∩ é E, − é E NÃO, o complemento é NÃO.',
    'Definições trocadas: "simultaneamente" é interseção, "mas não" é diferença (A − B ≠ B − A). O complemento precisa do universo.',
    'OU, E e NÃO voltam na lógica e na regra de falha do Aegis-Grid.',
  ],
  'm1-ie': [
    'Some tudo, desconte as interseções duas a duas e some a tripla de volta. Preencha o Venn de dentro para fora e use o complemento para "nenhum".',
    'Esquecer de descontar, ou de somar a tripla. As perguntas costumam pedir "somente A" ou "nenhum".',
    'A mesma ideia reaparece na probabilidade da união: P(A ∪ B) desconta a interseção.',
  ],
  'm1-cart': [
    'Liste A × B em pares ordenados, diga se uma relação é subconjunto de A × B e use |A × B| = |A| · |B| e 2ⁿ para o conjunto das partes.',
    '(a, b) ≠ (b, a). O conjunto das partes tem 2ⁿ elementos e inclui o vazio e o próprio conjunto.',
    'As 8 linhas da tabela do Aegis-Grid são 2³: o conjunto das partes de três proposições.',
  ],
  'm1-func': [
    'Defina domínio, contradomínio e imagem. Classifique em injetora, sobrejetora ou bijetora com um argumento ou um contraexemplo (g(2) = g(−2)).',
    'Injetora não repete imagem; sobrejetora atinge todo o contradomínio; bijetora exige as duas.',
    'Uma função leva a situação do sistema a um resultado (falha ou não): é assim que se lê a tabela do Aegis-Grid.',
  ],
  'm1-comp': [
    'Aplique de dentro para fora: (g∘f)(x) = g(f(x)). Mostre os dois passos e conclua que f∘g ≠ g∘f em geral.',
    'Ler g∘f como "g primeiro". Calcule f primeiro.',
    'Ligar etapas, em que o resultado de uma vira entrada da seguinte, é o jeito de montar o modelo em camadas do caso.',
  ],

  // ---------------------------------------------------------------- Matemática · U2 e U3
  'm2-prop': [
    'Diga se a frase é proposição (tem valor V ou F). Traduza o enunciado com letras e conectivos (¬, ∧, ∨), definindo cada letra.',
    'Ordens e perguntas não são proposições. O "ou" do curso é inclusivo.',
    '"O servidor falha ou duas rotas falham" vira p ∨ (q ∧ r): é a etapa 1 do Aegis-Grid.',
  ],
  'm2-cond': [
    'Escreva p → q e mostre que só é falsa quando p é verdadeira e q é falsa. Diferencie recíproca e contrapositiva.',
    'p → q equivale a ¬p ∨ q e à contrapositiva, mas não à recíproca.',
    'Regras de operação do tipo "se… então" entram no modelo como condicionais.',
  ],
  'm2-tabela': [
    'Monte a tabela com 2ⁿ linhas, coluna por coluna, e conclua: tautologia, contradição ou contingência.',
    'Contar as linhas (n variáveis, 2ⁿ) e a ordem das colunas. A tabela de uma tautologia só tem V.',
    'A tabela de 8 linhas (p, q, r) mostra as 5 situações de falha do Aegis-Grid.',
  ],
  'm2-equiv': [
    'Prove a equivalência por tabela ou por leis. Aplique De Morgan trocando o conectivo e negando cada parte.',
    '¬(p ∨ q) é ¬p ∧ ¬q: o conectivo troca. Negar um condicional não dá outro condicional.',
    'Negar "falha" dá "funciona": De Morgan transforma a condição de falha na de operação normal.',
  ],
  'm2-bool': [
    'Traduza lógica ↔ booleana (∨ é +, ∧ é ·, ¬ é \') e respeite a precedência: · antes de +.',
    'A + B·C não é (A + B)·C. Leia a precedência antes de comparar as alternativas.',
    'A fórmula p ∨ (q ∧ r) vira S = P + Q·R na etapa 2 do Aegis-Grid.',
  ],
  'm2-leis': [
    'Simplifique mostrando a lei usada em cada passo (absorção, distributiva, idempotência) e confira com a tabela.',
    'A + A·B = A; A·A\' = 0; A + A\' = 1. A questão dá a expressão e pede a mais simples.',
    'Simplificar a expressão de falha mostra o que realmente importa: o servidor sozinho já derruba o sistema.',
  ],
  'm2-sop': [
    'Da tabela à expressão: some os produtos das linhas com saída 1 e depois simplifique.',
    'Só as linhas de saída 1 entram; a variável que vale 0 aparece negada.',
    'É o caminho inverso do Aegis-Grid: da tabela de falhas observada à regra S.',
  ],
  'm2-circuitos': [
    'Descreva o circuito com portas (AND, OR, NOT, NAND, XOR) e dê a expressão de saída. Confira com a tabela.',
    'Multiplexador, decodificador e meio-somador (soma = A ⊕ B, vai-um = A · B) aparecem como questões de definição.',
    'S = P + Q·R é um circuito de duas portas, uma AND e uma OR.',
  ],

  // ---------------------------------------------------------------- Matemática · U4
  'm3-pfc': [
    'Divida o problema em etapas e diga se são sucessivas (multiplica, "e") ou alternativas (soma, "ou"). Justifique.',
    'Confundir etapas sucessivas com alternativas excludentes.',
    'Contar as configurações possíveis de um sistema (2ⁿ) usa o princípio multiplicativo.',
  ],
  'm3-fat': [
    'Explique n! como filas de n objetos distintos. Em anagramas, divida pelas repetições: ARARAS = 6! / (3! · 2!) = 60.',
    'Esquecer de dividir pelas letras repetidas. 0! = 1.',
    'Contar as ordens possíveis de um conjunto de ações é uma permutação.',
  ],
  'm3-ordem': [
    'Pergunte "a ordem importa?". Sim: arranjo A(n, p). Não: combinação C(n, p). Mostre as contas e a relação A = C · p!.',
    '"Comissão" é combinação; "cargos diferentes" é arranjo. A palavra do enunciado decide.',
    'Escolher quais componentes falham, sem ordem, é combinação.',
  ],

  // ---------------------------------------------------------------- Matemática · U5
  'm4-chance': [
    FORA,
    'A probabilidade fica entre 0 e 1. Favoráveis ÷ possíveis só vale com resultados igualmente prováveis.',
    'É o ponto de partida da etapa 4 do Aegis-Grid: com que chance cada parte falha.',
  ],
  'm4-regras': [
    FORA,
    'P(A ∪ B) desconta a interseção; independência multiplica; condicional é P(A ∩ B) / P(B).',
    'Falha com "ou" soma (menos a interseção); falha "simultânea" multiplica, se forem independentes.',
  ],
  'm4-binomial': [
    FORA,
    'Reconheça a binomial: n tentativas fixas, independentes, duas saídas, mesma probabilidade.',
    'Quantas rotas falham, entre n iguais e independentes, segue uma binomial.',
  ],
  'm4-normal': [
    FORA,
    'z = (x − μ) / σ; cerca de 68%, 95% e 99,7% a 1, 2 e 3 desvios; a área total é 1.',
    'Medidas contínuas, como tempo de resposta, são modeladas pela normal.',
  ],

  // ---------------------------------------------------------------- Matemática · U6
  'm5-vetores': [
    FORA,
    'O produto escalar dá um número; a soma de vetores dá um vetor; a norma é a raiz da soma dos quadrados.',
    'Um estado do sistema, com vários indicadores, é um vetor.',
  ],
  'm5-matrizes': [
    FORA,
    'AB só existe se as colunas de A forem iguais às linhas de B, e AB ≠ BA em geral.',
    'A matriz de adjacência da etapa 3 do Aegis-Grid é uma matriz vértice × vértice.',
  ],
  'm5-det': [
    FORA,
    'Determinante diferente de zero: tem inversa e o sistema é SPD. Igual a zero: SPI ou SI.',
    'Matriz sem inversa significa sistema sem solução única.',
  ],
  'm5-sistemas': [
    FORA,
    'Armar o sistema do enunciado (definir x e y), classificar e validar a solução no contexto.',
    'O caso Telecom treina exatamente isto: modelar com um sistema e interpretar.',
  ],
  'm5-gauss': [
    FORA,
    'Linha de zeros: SPI. Linha 0 = c com c ≠ 0: SI. Conte as variáveis livres.',
    'Escalonar resolve o sistema do modelo passo a passo e mostra a classificação.',
  ],

  // ---------------------------------------------------------------- Matemática · U7
  'm6-grafo': [
    FORA,
    'A soma dos graus é o dobro das arestas. Grafo dirigido tem grau de entrada e de saída.',
    'No Aegis-Grid, a rede de dados é um grafo: origem, servidor, rotas e destino.',
  ],
  'm6-estrutura': [
    FORA,
    'Árvore é grafo conexo sem ciclos, com n − 1 arestas. Passeio, trilha e caminho são diferentes.',
    'O servidor central é ponto único de falha e ponto de articulação do grafo.',
  ],
  'm6-repr': [
    FORA,
    'Matriz de adjacência × lista de adjacência: a matriz simétrica é de grafo não dirigido.',
    'A etapa 3 do Aegis-Grid pede a matriz de adjacência da rede.',
  ],
  'm6-buscas': [
    FORA,
    'BFS usa fila e anda por níveis; DFS usa pilha e vai fundo antes de voltar.',
    'Percorrer a rede para saber o que ainda é alcançável quando algo falha.',
  ],
  'm6-caminhos': [
    FORA,
    'Dijkstra: pesos não negativos. Bellman-Ford admite negativos. Kruskal: árvore geradora mínima.',
    'Caminho mais barato entre origem e destino é a pergunta natural sobre a rede do caso.',
  ],

  // ---------------------------------------------------------------- Matemática · U8
  'm7-inducao': [
    FORA,
    'Base + passo: sem a base, a prova não vale. O passo supõe a propriedade em n e prova em n + 1.',
    'Provar que uma propriedade vale para qualquer tamanho de sistema é o uso da indução.',
  ],
  'm7-recorrencia': [
    FORA,
    'Valor inicial + regra. Hanói: T(n) = 2T(n − 1) + 1, que dá 2ⁿ − 1.',
    'Custo de algoritmos recursivos e crescimento de processos se descrevem por recorrência.',
  ],
  'm7-aegis': [
    FORA,
    'Traduzir a frase em p ∨ (q ∧ r), montar a tabela e contar 5 falhas em 8.',
    'É o coração da A3 de Matemática: lógica, booleana e tabela são as etapas 1 e 2.',
  ],

  // ---------------------------------------------------------------- Exploração · U3 (C1)
  'c1-conexao': [
    'Defina banda (quanto passa) e latência (quanto demora) e dê um exemplo seu, como a transmissão ao vivo do culto.',
    'Banda não é velocidade, e mais banda não diminui a latência.',
    'Sistemas e infraestrutura é o primeiro ponto da A3: diga o que a rede do cenário precisa entregar.',
  ],
  'c1-redes': [
    'Explique o caminho do dado: dispositivos de rede, protocolos e o que cada um faz, com um exemplo.',
    'Questões de definições trocadas: ache a única em que nome e função combinam.',
    'Descreva a rede do cenário: que dispositivos e protocolos sustentam o sistema.',
  ],
  'c1-nuvem': [
    'Defina computação em nuvem e diferencie IaaS, PaaS e SaaS pelo que o provedor assume.',
    'SaaS é software pronto; PaaS é plataforma para desenvolver; IaaS é infraestrutura.',
    'Diga onde o sistema do cenário roda (nuvem ou servidor próprio) e o que isso muda em custo e risco.',
  ],
  'c1-seguranca': [
    'Aplique a tríade ao caso: confidencialidade, integridade e disponibilidade. Diga qual foi ferida e como proteger.',
    'Confidencialidade é quem vê; integridade é quem altera; disponibilidade é quem acessa.',
    'Privacidade, proteção de dados e segurança é o terceiro ponto da A3.',
  ],

  // ---------------------------------------------------------------- Exploração · U4 e U2 (C2)
  'c2-silos': [
    'Defina silos de informação e dê duas consequências: visão fragmentada, retrabalho, decisão atrasada.',
    'Silo não é falta de tecnologia, é falta de integração.',
    'Quase todo cenário da A3 tem silos: aponte-os e proponha integração.',
  ],
  'c2-erpcrm': [
    'Diferencie ERP (processos internos) de CRM (relacionamento com o cliente) e mostre como integrados evitam silos.',
    'Definições trocadas de ERP e CRM. O ERP não é a ferramenta de marketing.',
    'Diga como ERP e CRM integrados mudariam o cenário e o fluxo de dados.',
  ],
  'c2-transformacao': [
    'Diferencie digitalização (mudar o suporte) de transformação digital (repensar processos, modelo de negócio e valor).',
    'Automatizar processos mantendo o modelo de negócio não é transformação digital.',
    'A pergunta-chave do cenário: a organização só digitalizou ou se transformou?',
  ],
  'c2-rogers': [
    'Cite Rogers: "a transformação digital não é sobre tecnologia, mas sobre estratégia", e os cinco domínios (clientes, competição, dados, inovação, valor).',
    'A alternativa certa fala de estratégia, dados e cliente no centro; a errada diz "independentemente de mudanças culturais".',
    'Cite Rogers e Gabriel na abertura e no fechamento do texto.',
  ],

  // ---------------------------------------------------------------- Exploração · U5 e U6 (C3)
  'c3-autoia': [
    FORA,
    'Automação segue regra fixa; IA aprende com dados. "Aprende" é a palavra que separa.',
    'Diga o que o cenário automatiza e o que usa de IA, e quem decide no fim.',
  ],
  'c3-aprendizado': [
    FORA,
    'Supervisionado usa exemplos com resposta; treinar é reduzir o erro sobre eles. Dados são o combustível.',
    'Dados incompletos ou enviesados comprometem o resultado: aponte isso no cenário.',
  ],
  'c3-generativa': [
    FORA,
    'A IA generativa produz o texto mais provável, e não confere a verdade: pode errar com fluência.',
    'Risco de usar IA generativa sem revisão humana.',
  ],
  'c3-prompt': [
    FORA,
    'Prompt bom tem contexto, tarefa e formato. No-code monta sem programar.',
    'Low-code e no-code como forma de automatizar o cenário sem depender só da TI.',
  ],

  // ---------------------------------------------------------------- Exploração · C4 (U1, U7, U8)
  'c4-redes': [
    'Defina identidade digital (conteúdos + interações + comportamento) e explique a mediação por algoritmos, com um exemplo.',
    'Definições trocadas (identidade × produção de conteúdo × colaboração) e absolutos ("completamente", "total").',
    'Redes e opinião pública entram no cenário quando a organização se comunica por redes.',
  ],
  'c4-cidade': [
    'Mostre os dois lados da tecnologia no cotidiano. Cite Akabane (ampliam a capacidade humana), Gabriel (aprender continuamente) e a IoT.',
    'A tecnologia "substitui totalmente" o humano é distrator. IoT é conectar objetos para otimizar.',
    'Inclusão e exclusão digital: diga sempre quem fica de fora.',
  ],
  'c4-ecossistema': [
    FORA,
    'Atores: startups, universidades, governo, investidores, empresas. A palavra-chave é interdependência.',
    'Se o cenário depende de parceiros externos, descreva o ecossistema.',
  ],
  'c4-startups': [
    FORA,
    'Ideação, validação (MVP), tração e escala. Escalável é crescer sem custo proporcional.',
    'Crescer exige governança, segurança e conformidade.',
  ],
  'c4-etica': [
    FORA,
    'O algoritmo não é neutro. As quatro práticas são transparência, auditabilidade, explicabilidade e responsabilização.',
    'Quarto ponto da A3: práticas éticas e responsáveis, com supervisão humana.',
  ],
  'c4-lgpd': [
    FORA,
    'Finalidade e necessidade (coletar só o mínimo) são os princípios mais cobrados. Prevenção é técnica mais educação.',
    'Terceiro ponto da A3: privacidade, proteção de dados e segurança.',
  ],
};

/** Devolve a região com o cartão "Como isso cai" no fim de cada aula que tem entrada em `CAI`. */
export const comCai = (r: Regiao): Regiao => ({
  ...r,
  fases: r.fases.map((f): Phase => {
    const l = CAI[f.id];
    return l ? { ...f, steps: [...f.steps, cai(...l)] } : f;
  }),
});
