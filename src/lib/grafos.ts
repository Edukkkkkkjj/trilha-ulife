// Grafos: propriedades, representações e os cinco algoritmos da U7, cada um devolvendo os passos para o brinquedo mostrar.

export type No = { id: string; x: number; y: number };
export type Aresta = { a: string; b: string; w: number };
export type Grafo = { nos: No[]; arestas: Aresta[]; dirigido: boolean; ponderado: boolean };

const ids = (g: Grafo) => g.nos.map((n) => n.id);
/** Vizinhos de cada vértice, em ordem alfabética (a ordem de visita dos algoritmos depende disso). */
export function listaAdj(g: Grafo): Record<string, { v: string; w: number }[]> {
  const L: Record<string, { v: string; w: number }[]> = Object.fromEntries(ids(g).map((i) => [i, []]));
  for (const e of g.arestas) { L[e.a]?.push({ v: e.b, w: e.w }); if (!g.dirigido && e.a !== e.b) L[e.b]?.push({ v: e.a, w: e.w }); }
  for (const k of Object.keys(L)) L[k].sort((p, q) => p.v.localeCompare(q.v));
  return L;
}
/** Matriz de adjacência: 1 (ou o peso) se há aresta de i para j. */
export function matrizAdj(g: Grafo): number[][] {
  const V = ids(g), L = listaAdj(g);
  return V.map((i) => V.map((j) => { const e = L[i].find((x) => x.v === j); return e ? (g.ponderado ? e.w : 1) : 0; }));
}
/** Matriz de incidência: linhas = vértices, colunas = arestas. Em dirigido: −1 onde sai, +1 onde chega. */
export function matrizInc(g: Grafo): number[][] {
  return ids(g).map((v) => g.arestas.map((e) => (g.dirigido ? (e.a === v ? -1 : e.b === v ? 1 : 0) : e.a === v || e.b === v ? 1 : 0)));
}
export function graus(g: Grafo): Record<string, { grau: number; entrada: number; saida: number }> {
  const r = Object.fromEntries(ids(g).map((i) => [i, { grau: 0, entrada: 0, saida: 0 }]));
  for (const e of g.arestas) { r[e.a].saida++; r[e.b].entrada++; r[e.a].grau++; r[e.b].grau++; }
  return r;
}
/** Componentes conexas, ignorando a direção das arestas. */
export function componentes(g: Grafo): string[][] {
  const L = listaAdj({ ...g, dirigido: false }), visto = new Set<string>(), comps: string[][] = [];
  for (const s of ids(g)) {
    if (visto.has(s)) continue;
    const c: string[] = [], pilha = [s]; visto.add(s);
    while (pilha.length) { const u = pilha.pop()!; c.push(u); for (const { v } of L[u]) if (!visto.has(v)) { visto.add(v); pilha.push(v); } }
    comps.push(c.sort());
  }
  return comps;
}
export const conexo = (g: Grafo) => g.nos.length > 0 && componentes(g).length === 1;
/** Há ciclo? (grafo não dirigido: mais arestas do que uma floresta teria; dirigido: busca em profundidade com "cinza".) */
export function temCiclo(g: Grafo): boolean {
  if (!g.dirigido) return g.arestas.length > g.nos.length - componentes(g).length;
  const L = listaAdj(g), cor: Record<string, number> = {};
  const visita = (u: string): boolean => { cor[u] = 1; for (const { v } of L[u]) { if (cor[v] === 1) return true; if (!cor[v] && visita(v)) return true; } cor[u] = 2; return false; };
  return ids(g).some((u) => !cor[u] && visita(u));
}
export const ehArvore = (g: Grafo) => !g.dirigido && conexo(g) && !temCiclo(g);
/** Teorema de Euler: circuito euleriano existe se o grafo é conexo e todo vértice tem grau par. */
export const euleriano = (g: Grafo) => !g.dirigido && g.arestas.length > 0 && conexo(g) && Object.values(graus(g)).every((x) => x.grau % 2 === 0);
/** Teorema de Dirac (condição suficiente): n ≥ 3 e todo vértice com grau ≥ n/2. */
export const dirac = (g: Grafo) => !g.dirigido && g.nos.length >= 3 && Object.values(graus(g)).every((x) => x.grau >= g.nos.length / 2);

// ---------- algoritmos, passo a passo ----------
export type Passo = {
  texto: string;
  atual?: string;
  visitados: string[];
  /** Fila (BFS), pilha (DFS) ou candidatos (Dijkstra). */
  espera: string[];
  dist?: Record<string, number>;
  /** Arestas destacadas (da árvore de busca, dos caminhos mínimos ou da árvore geradora). */
  marcadas: [string, string][];
  /** Aresta sendo examinada agora. */
  olhando?: [string, string];
  recusada?: boolean;
};
export type Execucao = { passos: Passo[]; ordem: string[]; dist?: Record<string, number>; ant?: Record<string, string | null>; cicloNegativo?: boolean; total?: number };
const INF = Infinity;

export function bfs(g: Grafo, origem: string): Execucao {
  const L = listaAdj(g), visto = new Set([origem]), fila = [origem], ordem: string[] = [], marcadas: [string, string][] = [], nivel: Record<string, number> = { [origem]: 0 };
  const passos: Passo[] = [{ texto: `Começo: ${origem} entra na fila.`, visitados: [], espera: [origem], marcadas: [], dist: { ...nivel } }];
  while (fila.length) {
    const u = fila.shift()!; ordem.push(u);
    const novos: string[] = [];
    for (const { v } of L[u]) if (!visto.has(v)) { visto.add(v); fila.push(v); novos.push(v); marcadas.push([u, v]); nivel[v] = nivel[u] + 1; }
    passos.push({ texto: `Tira ${u} da frente da fila e visita. ${novos.length ? `Vizinhos novos entram no fim da fila: ${novos.join(', ')}.` : 'Nenhum vizinho novo.'}`, atual: u, visitados: [...ordem], espera: [...fila], marcadas: [...marcadas], dist: { ...nivel } });
  }
  passos.push({ texto: `Fila vazia: fim. Ordem de visita: ${ordem.join(', ')}.`, visitados: [...ordem], espera: [], marcadas: [...marcadas], dist: { ...nivel } });
  return { passos, ordem, dist: nivel };
}

export function dfs(g: Grafo, origem: string): Execucao {
  const L = listaAdj(g), visto = new Set<string>(), ordem: string[] = [], marcadas: [string, string][] = [], pilha: string[] = [];
  const passos: Passo[] = [{ texto: `Começo em ${origem}.`, visitados: [], espera: [origem], marcadas: [] }];
  const visita = (u: string, de?: string) => {
    visto.add(u); ordem.push(u); pilha.push(u); if (de) marcadas.push([de, u]);
    passos.push({ texto: `Visita ${u}${de ? ` (vindo de ${de})` : ''} e tenta ir mais fundo.`, atual: u, visitados: [...ordem], espera: [...pilha], marcadas: [...marcadas] });
    for (const { v } of L[u]) if (!visto.has(v)) visita(v, u);
    pilha.pop();
    if (pilha.length) passos.push({ texto: `${u} não tem mais vizinho novo: volta para ${pilha[pilha.length - 1]}.`, atual: pilha[pilha.length - 1], visitados: [...ordem], espera: [...pilha], marcadas: [...marcadas] });
  };
  visita(origem);
  passos.push({ texto: `Pilha vazia: fim. Ordem de visita: ${ordem.join(', ')}.`, visitados: [...ordem], espera: [], marcadas: [...marcadas] });
  return { passos, ordem };
}

const arvoreDe = (ant: Record<string, string | null>): [string, string][] => Object.entries(ant).filter(([, p]) => p).map(([v, p]) => [p!, v]);

export function dijkstra(g: Grafo, origem: string): Execucao {
  const L = listaAdj(g), V = ids(g), dist: Record<string, number> = Object.fromEntries(V.map((v) => [v, INF])), ant: Record<string, string | null> = Object.fromEntries(V.map((v) => [v, null]));
  dist[origem] = 0;
  const S: string[] = [], passos: Passo[] = [{ texto: `Começo: distância 0 para ${origem} e infinito (∞) para os outros.`, visitados: [], espera: [origem], dist: { ...dist }, marcadas: [] }];
  while (S.length < V.length) {
    const cand = V.filter((v) => !S.includes(v) && dist[v] < INF);
    if (!cand.length) break;
    const u = cand.reduce((m, v) => (dist[v] < dist[m] ? v : m)); S.push(u);
    const mud: string[] = [];
    for (const { v, w } of L[u]) if (!S.includes(v) && dist[u] + w < dist[v]) { dist[v] = dist[u] + w; ant[v] = u; mud.push(`${v} = ${dist[u]} + ${w} = ${dist[v]}`); }
    passos.push({ texto: `Fecha ${u} (menor distância em aberto: ${dist[u]}). ${mud.length ? `Melhora: ${mud.join('; ')}.` : 'Nenhum vizinho melhora.'}`, atual: u, visitados: [...S], espera: V.filter((v) => !S.includes(v) && dist[v] < INF), dist: { ...dist }, marcadas: arvoreDe(ant) });
  }
  passos.push({ texto: 'Fim: todas as distâncias mínimas estão fechadas.', visitados: [...S], espera: [], dist: { ...dist }, marcadas: arvoreDe(ant) });
  return { passos, ordem: S, dist, ant };
}

export function bellmanFord(g: Grafo, origem: string): Execucao {
  const V = ids(g), dist: Record<string, number> = Object.fromEntries(V.map((v) => [v, INF])), ant: Record<string, string | null> = Object.fromEntries(V.map((v) => [v, null]));
  dist[origem] = 0;
  const E = g.arestas.flatMap((e) => (g.dirigido ? [e] : [e, { a: e.b, b: e.a, w: e.w }]));
  const passos: Passo[] = [{ texto: `Começo: distância 0 para ${origem} e infinito (∞) para os outros. Serão até ${V.length - 1} rodadas.`, visitados: [], espera: [], dist: { ...dist }, marcadas: [] }];
  for (let i = 1; i <= V.length - 1; i++) {
    const mud: string[] = [];
    for (const e of E) if (dist[e.a] + e.w < dist[e.b]) { dist[e.b] = dist[e.a] + e.w; ant[e.b] = e.a; mud.push(`${e.b} = ${dist[e.b]} (por ${e.a})`); }
    passos.push({ texto: `Rodada ${i}: relaxa todas as arestas. ${mud.length ? `Melhoras: ${mud.join('; ')}.` : 'Nada mudou: pode parar.'}`, visitados: V.filter((v) => dist[v] < INF), espera: [], dist: { ...dist }, marcadas: arvoreDe(ant) });
    if (!mud.length) break;
  }
  const ruim = E.find((e) => dist[e.a] + e.w < dist[e.b]);
  passos.push({ texto: ruim ? `Verificação final: a aresta ${ruim.a}→${ruim.b} AINDA melhora. Existe ciclo de peso negativo: não há caminho mínimo.` : 'Verificação final: nenhuma aresta melhora mais. Não há ciclo negativo; as distâncias estão certas.', visitados: V.filter((v) => dist[v] < INF), espera: [], dist: { ...dist }, marcadas: arvoreDe(ant), olhando: ruim ? [ruim.a, ruim.b] : undefined, recusada: !!ruim });
  return { passos, ordem: V, dist, ant, cicloNegativo: !!ruim };
}

export function kruskal(g: Grafo): Execucao {
  const pai: Record<string, string> = Object.fromEntries(ids(g).map((v) => [v, v]));
  const acha = (x: string): string => (pai[x] === x ? x : acha(pai[x]));
  const E = [...g.arestas].sort((p, q) => p.w - q.w || (p.a + p.b).localeCompare(q.a + q.b)), marc: [string, string][] = [];
  let total = 0;
  const passos: Passo[] = [{ texto: `Ordena as arestas por peso: ${E.map((e) => `${e.a}${e.b}(${e.w})`).join(', ')}.`, visitados: [], espera: [], marcadas: [] }];
  for (const e of E) {
    const ra = acha(e.a), rb = acha(e.b), ok = ra !== rb;
    if (ok) { pai[ra] = rb; marc.push([e.a, e.b]); total += e.w; }
    passos.push({ texto: ok ? `${e.a}–${e.b} (peso ${e.w}): liga dois grupos separados. Entra. Custo até aqui: ${total}.` : `${e.a}–${e.b} (peso ${e.w}): os dois já estão ligados; fecharia um ciclo. Fica de fora.`, visitados: [...new Set(marc.flat())], espera: [], marcadas: [...marc], olhando: [e.a, e.b], recusada: !ok });
    if (marc.length === g.nos.length - 1) break;
  }
  passos.push({ texto: marc.length === g.nos.length - 1 ? `Fim: árvore geradora mínima com ${marc.length} arestas e custo total ${total}.` : 'Fim: o grafo não é conexo, então não existe árvore geradora.', visitados: [...new Set(marc.flat())], espera: [], marcadas: [...marc] });
  return { passos, ordem: [], total };
}

/** Caminho da origem até o destino, a partir dos antecessores. */
export function caminho(ant: Record<string, string | null>, destino: string): string[] {
  const c = [destino]; let u = destino, guarda = 0;
  while (ant[u] && guarda++ < 50) { u = ant[u]!; c.unshift(u); }
  return c;
}
