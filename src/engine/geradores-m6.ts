// Geradores da M6 · Grafos. As respostas saem dos mesmos algoritmos que o editor de grafos usa.
import type { Ex } from './types';
import type { Rng } from '../lib/rng';
import { bfs, conexo, dfs, dijkstra, caminho, graus, kruskal, type Grafo } from '../lib/grafos';

type Gerador = (r: Rng, nivel: number) => Ex;
let n = 0;
const id = (g: string) => `${g}#${Date.now().toString(36)}m6${(n++).toString(36)}`;
const LET = ['A', 'B', 'C', 'D', 'E', 'F'];
const txtArestas = (g: Grafo) => g.arestas.map((e) => `${e.a}–${e.b}${g.ponderado ? ` (${e.w})` : ''}`).join(', ');

/** Grafo conexo sorteado: primeiro uma árvore (garante conexão), depois algumas arestas extras. */
export function grafoSorteado(r: Rng, nv: number, extras: number, pesos = false): Grafo {
  const V = LET.slice(0, nv), arestas: Grafo['arestas'] = [];
  const tem = (a: string, b: string) => arestas.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
  for (let i = 1; i < nv; i++) arestas.push({ a: V[r.int(0, i - 1)], b: V[i], w: pesos ? r.int(1, 9) : 1 });
  for (let k = 0, guarda = 0; k < extras && guarda < 40; guarda++) {
    const a = r.pick(V), b = r.pick(V);
    if (a !== b && !tem(a, b)) { arestas.push({ a: a < b ? a : b, b: a < b ? b : a, w: pesos ? r.int(1, 9) : 1 }); k++; }
  }
  arestas.sort((p, q) => (p.a + p.b).localeCompare(q.a + q.b));
  return { nos: V.map((v) => ({ id: v, x: 0, y: 0 })), arestas, dirigido: false, ponderado: pesos };
}

const grau: Gerador = (r, nivel) => {
  const g = grafoSorteado(r, r.int(4, 6), r.int(1, 3)), gr = graus(g), base = `Um grafo não dirigido tem os vértices ${g.nos.map((x) => x.id).join(', ')} e as arestas: **${txtArestas(g)}**.`;
  if (nivel > 0 && r.bool(0.4)) {
    const soma = Object.values(gr).reduce((t, x) => t + x.grau, 0);
    return { id: id('m6.grau'), kind: 'num', topic: 'm6.conceitos', answer: soma, prompt: `${base}\n\nQuanto dá a **soma dos graus** de todos os vértices?`,
      armadilhas: [{ valor: g.arestas.length, causa: 'conceito', msg: 'Esse é o número de arestas. Cada aresta conta no grau de DOIS vértices, então a soma dos graus é o dobro.' }],
      hints: ['Dá para somar grau por grau, mas há um atalho.', 'Cada aresta encosta em dois vértices: soma dos graus = 2 × número de arestas.', `2 × ${g.arestas.length} = ${soma}.`], explain: `São ${g.arestas.length} arestas, e cada uma conta para dois vértices: 2 × ${g.arestas.length} = **${soma}**.` };
  }
  const v = r.pick(g.nos).id, viz = g.arestas.filter((e) => e.a === v || e.b === v).map((e) => (e.a === v ? e.b : e.a));
  return { id: id('m6.grau'), kind: 'num', topic: 'm6.conceitos', answer: gr[v].grau, prompt: `${base}\n\nQual é o **grau** do vértice **${v}**?`,
    hints: ['Grau = quantas arestas encostam no vértice.', `Procure todas as arestas em que ${v} aparece.`, `${v} liga com ${viz.join(', ')}: grau ${gr[v].grau}.`], explain: `${v} aparece em ${gr[v].grau} aresta(s) (liga com ${viz.join(', ')}): grau **${gr[v].grau}**.` };
};

const arvore: Gerador = (r, nivel) => {
  if (nivel === 0 || r.bool()) {
    const v = r.int(5, 40);
    return { id: id('m6.arv'), kind: 'num', topic: 'm6.arvores', answer: v - 1, prompt: `Uma rede em forma de **árvore** liga **${v}** computadores. Quantas conexões (arestas) ela tem?`,
      armadilhas: [{ valor: v, causa: 'conceito', msg: 'Com tantas arestas quanto vértices, sobra uma: ela fecha um ciclo. Árvore tem uma a menos.' }, { valor: (v * (v - 1)) / 2, causa: 'conceito', msg: 'Isso é ligar todos com todos (grafo completo). A árvore usa o mínimo de arestas para conectar.' }],
      hints: ['Árvore é conexa e sem ciclo: usa o mínimo de arestas.', '|E| = |V| − 1.', `${v} − 1 = ${v - 1}.`], explain: `Numa árvore, |E| = |V| − 1 = ${v} − 1 = **${v - 1}**. Uma a menos desconecta; uma a mais cria ciclo.` };
  }
  const v = r.int(5, 9), e = v - 1 + r.int(1, 5);
  return { id: id('m6.arv'), kind: 'num', topic: 'm6.arvores', answer: e - (v - 1), prompt: `Um grafo **conexo** tem **${v}** vértices e **${e}** arestas. Quantas arestas é preciso retirar (sem desconectar) para ele virar uma árvore?`,
    armadilhas: [{ valor: e - v, causa: 'conta', msg: `A árvore fica com ${v} − 1 = ${v - 1} arestas, não com ${v}.` }],
    hints: ['Quantas arestas tem uma árvore com esse número de vértices?', `Árvore com ${v} vértices: ${v - 1} arestas.`, `${e} − ${v - 1} = ${e - (v - 1)}.`], explain: `A árvore geradora terá ${v} − 1 = ${v - 1} arestas. Sobram ${e} − ${v - 1} = **${e - (v - 1)}**: cada uma delas fecha um ciclo.` };
};

const busca: Gerador = (r) => {
  for (let t = 0; t < 30; t++) {
    const g = grafoSorteado(r, 5, r.int(1, 2)), b = bfs(g, 'A').ordem.join(', '), d = dfs(g, 'A').ordem.join(', ');
    if (b === d) continue;
    const qual = r.bool() ? 'bfs' : 'dfs', certo = qual === 'bfs' ? b : d;
    const ops = [...new Set([b, d, r.shuffle(['B', 'C', 'D', 'E']).reduce((s, x) => s + ', ' + x, 'A'), 'A, E, D, C, B'])].slice(0, 4);
    return { id: id('m6.busca'), kind: 'mcq', topic: 'm6.buscas', options: r.shuffle(ops), correct: 0, fixo: true,
      prompt: `Grafo não dirigido com arestas: **${txtArestas(g)}**.\n\nComeçando em **A** e visitando os vizinhos em **ordem alfabética**, qual é a ordem de visita da **${qual === 'bfs' ? 'busca em largura (BFS)' : 'busca em profundidade (DFS)'}**?`,
      hints: [qual === 'bfs' ? 'BFS: primeiro todos os vizinhos de A, depois os vizinhos deles (camadas). Use uma fila.' : 'DFS: vá para o primeiro vizinho, e dele para o primeiro vizinho novo, até não dar mais; só então volte.', `Vizinhos de A: ${g.arestas.filter((e) => e.a === 'A' || e.b === 'A').map((e) => (e.a === 'A' ? e.b : e.a)).sort().join(', ')}.`, certo + '.'],
      explain: `${qual === 'bfs' ? 'BFS (por camadas, com fila)' : 'DFS (indo fundo, com pilha)'}: **${certo}**. Para comparar, a ${qual === 'bfs' ? 'DFS' : 'BFS'} daria ${qual === 'bfs' ? d : b}.` } as Ex & { kind: 'mcq' };
  }
  throw new Error('não sorteou grafo com BFS ≠ DFS');
};
// a alternativa certa é localizada depois de embaralhar
const buscaCerta: Gerador = (r, nivel) => { const e = busca(r, nivel); if (e.kind !== 'mcq') return e; const m = /\*\*([A-E](?:, [A-E]){4})\*\*/.exec(e.explain)!; return { ...e, correct: e.options.indexOf(m[1]) }; };

const menorCaminho: Gerador = (r) => {
  for (let t = 0; t < 40; t++) {
    const g = grafoSorteado(r, 5, 3, true), res = dijkstra(g, 'A'), alvo = r.pick(['D', 'E']), c = caminho(res.ant!, alvo), d = res.dist![alvo];
    const saltos = bfs(g, 'A'), direto = g.arestas.find((e) => (e.a === 'A' && e.b === alvo) || (e.b === 'A' && e.a === alvo));
    if (c.length < 3) continue; // queremos um caminho com pelo menos uma parada
    return { id: id('m6.dij'), kind: 'num', topic: 'm6.caminhos', answer: d, prompt: `Rede com custos nas ligações: **${txtArestas(g)}**.\n\nQual é o **menor custo** para ir de **A** até **${alvo}**?`,
      armadilhas: direto && direto.w !== d ? [{ valor: direto.w, causa: 'conceito', msg: `Esse é o custo da ligação direta A–${alvo}. Há um caminho com mais paradas que sai mais barato: menos arestas não quer dizer menor custo.` }] : [],
      hints: ['Faça como o Dijkstra: comece com A = 0 e vá fechando sempre o vértice em aberto de menor distância.', `O caminho mínimo tem ${c.length - 1} arestas (pelo número de saltos, ${alvo} está no nível ${saltos.dist![alvo]}).`, `${c.join(' → ')}: custo ${d}.`],
      explain: `Caminho mínimo: **${c.join(' → ')}**, com custo **${d}**. Distâncias a partir de A: ${Object.entries(res.dist!).map(([k, v]) => `${k} = ${v}`).join(', ')}.` };
  }
  throw new Error('não sorteou caminho com parada');
};

const arvoreMinima: Gerador = (r) => {
  const g = grafoSorteado(r, 5, 3, true), k = kruskal(g), fora = g.arestas.length - 4, ord = [...g.arestas].sort((a, b) => a.w - b.w);
  return { id: id('m6.kru'), kind: 'num', topic: 'm6.caminhos', answer: k.total!, prompt: `Uma empresa quer ligar 5 prédios com cabos. Os custos possíveis são: **${txtArestas(g)}**.\n\nQual é o **custo total mínimo** para deixar todos os prédios conectados (árvore geradora mínima)?`,
    armadilhas: [{ valor: g.arestas.reduce((t, e) => t + e.w, 0), causa: 'conceito', msg: 'Você somou todas as ligações. Para conectar 5 prédios bastam 4 cabos: os que fechariam ciclo ficam de fora.' }, { valor: ord.slice(0, 4).reduce((t, e) => t + e.w, 0), causa: 'conceito', msg: 'Você pegou as 4 mais baratas sem olhar se fecham ciclo. Uma delas liga prédios que já estavam conectados.' }].filter((a) => a.valor !== k.total) as never,
    hints: ['Kruskal: ordene as ligações da mais barata para a mais cara.', 'Vá pegando; pule a que ligar dois prédios já conectados (fecharia ciclo). Pare com 4.', `Ordem: ${ord.map((e) => `${e.a}${e.b}(${e.w})`).join(', ')}. Total ${k.total}.`],
    explain: `Em ordem de custo: ${ord.map((e) => `${e.a}${e.b}(${e.w})`).join(', ')}. Entram 4 e ${fora} fica(m) de fora por fechar ciclo. Custo mínimo: **${k.total}**.` };
};

const qualAlgoritmo: Gerador = (r) => {
  const itens = r.shuffle([
    ['Achar a rota com menos saltos numa rede sem pesos', 0, 'Sem pesos, menor número de arestas: BFS.'],
    ['Descobrir o grau de separação entre duas pessoas numa rede social', 0, 'Menor número de ligações: BFS, por camadas.'],
    ['Detectar se há dependência circular entre módulos de um programa', 1, 'Detecção de ciclos e análise de dependências: DFS.'],
    ['Explorar um labirinto indo até o fim de cada corredor antes de voltar', 1, 'Ir fundo e retroceder (backtracking): DFS.'],
    ['Calcular a rota mais rápida num GPS (tempos sempre positivos)', 2, 'Caminho mínimo com pesos não negativos: Dijkstra.'],
    ['Achar o caminho de menor latência entre dois servidores', 2, 'Pesos positivos, caminho mínimo: Dijkstra.'],
    ['Achar o caminho de menor custo quando algumas ligações têm custo negativo', 3, 'Peso negativo: Bellman-Ford.'],
    ['Verificar se uma rede de custos tem um ciclo de peso negativo', 3, 'Só o Bellman-Ford detecta ciclo negativo.'],
    ['Ligar todos os prédios de um campus gastando o mínimo de cabo', 4, 'Conectar todos com menor custo total: árvore geradora mínima, Kruskal.'],
    ['Projetar a rede mais barata que deixe todas as filiais conectadas', 4, 'Economia global, sem ciclos: Kruskal.'],
  ] as [string, number, string][]).slice(0, 5), cats = ['BFS', 'DFS', 'Dijkstra', 'Bellman-Ford', 'Kruskal'];
  return { id: id('m6.qual'), kind: 'classificar', topic: 'm6.escolha', categorias: cats, prompt: 'Qual algoritmo resolve cada problema?', itens: itens.map(([texto, cat, porque]) => ({ texto, cat, porque })),
    hints: ['Três perguntas: quero percorrer, achar o caminho mais curto, ou conectar tudo gastando pouco?', 'Sem pesos: BFS (menos saltos) ou DFS (ciclos, ir fundo). Com pesos positivos: Dijkstra. Com negativos: Bellman-Ford. Conectar tudo: Kruskal.', itens.map(([, c]) => cats[c]).join(', ') + '.'],
    explain: 'BFS: menos saltos, sem pesos. DFS: ciclos e dependências. Dijkstra: caminho mínimo com pesos não negativos. Bellman-Ford: aceita pesos negativos e detecta ciclo negativo. Kruskal: árvore geradora mínima.' };
};

const eulerQ: Gerador = (r) => {
  for (let t = 0; t < 30; t++) {
    const g = grafoSorteado(r, r.int(4, 5), r.int(1, 3)), gr = graus(g), impares = Object.entries(gr).filter(([, x]) => x.grau % 2).map(([k]) => k), tem = impares.length === 0;
    if (!conexo(g) || (t < 20 && r.bool() !== tem)) continue;
    const ops = ['Sim: é conexo e todos os vértices têm grau par', 'Não: há vértice com grau ímpar', 'Não: o grafo tem ciclos', 'Sim: todo grafo conexo tem'];
    return { id: id('m6.euler'), kind: 'mcq', topic: 'm6.conceitos', options: ops, correct: tem ? 0 : 1, fixo: true, prompt: `Grafo conexo com arestas: **${txtArestas(g)}**.\n\nExiste um **circuito euleriano** (passar por todas as arestas exatamente uma vez e voltar ao início)?`,
      hints: ['Teorema de Euler: conexo e todos os graus pares.', `Graus: ${Object.entries(gr).map(([k, x]) => `${k} = ${x.grau}`).join(', ')}.`, tem ? 'Todos pares: existe.' : `${impares.join(' e ')} têm grau ímpar: não existe.`],
      explain: `Graus: ${Object.entries(gr).map(([k, x]) => `${k} = ${x.grau}`).join(', ')}. ${tem ? '**Todos pares** e o grafo é conexo: existe circuito euleriano.' : `**${impares.join(', ')}** ${impares.length > 1 ? 'têm' : 'tem'} grau ímpar: não existe circuito euleriano.`}` };
  }
  throw new Error('não sorteou');
};

export const GERADORES_M6: Record<string, Gerador> = { 'm6.grau': grau, 'm6.arv': arvore, 'm6.busca': buscaCerta, 'm6.dij': menorCaminho, 'm6.kru': arvoreMinima, 'm6.qual': qualAlgoritmo, 'm6.euler': eulerQ };
