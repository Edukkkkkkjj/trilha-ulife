// EDITOR DE GRAFOS: desenhe vértices e arestas; graus, conexidade, ciclo, matrizes e listas se atualizam ao vivo.
// A aba "Algoritmo" roda BFS, DFS, Dijkstra, Bellman-Ford e Kruskal passo a passo sobre o grafo que você desenhou.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Moldura, limitar, useGesto, useHistorico, useModo } from '../Sandbox';
import { bellmanFord, bfs, caminho, componentes, conexo, dfs, dijkstra, dirac, ehArvore, euleriano, graus, kruskal, listaAdj, matrizAdj, matrizInc, temCiclo, type Execucao, type Grafo } from '../../lib/grafos';
import { useDesafios, type DesafioBase } from './desafio';
import type { ToyProps } from './tipos';

const W = 360, H = 280, R = 17, LETRAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const no = (id: string, x: number, y: number) => ({ id, x, y });
const ar = (a: string, b: string, w = 1) => ({ a, b, w });
const POS5 = [no('A', 60, 70), no('B', 180, 40), no('C', 150, 150), no('D', 250, 190), no('E', 320, 90)];
/** Exercício do curso (U7, atividade 01): A-B, A-C, B-C, C-D, D-E. */
export const G_EXERCICIO: Grafo = { nos: POS5, arestas: [ar('A', 'B'), ar('A', 'C'), ar('B', 'C'), ar('C', 'D'), ar('D', 'E')], dirigido: false, ponderado: false };
/** Grafo dos exemplos de BFS e DFS do curso: A-B, A-C, B-D, C-D, D-E. */
export const G_BUSCA: Grafo = { nos: [no('A', 50, 140), no('B', 150, 60), no('C', 150, 220), no('D', 250, 140), no('E', 325, 140)], arestas: [ar('A', 'B'), ar('A', 'C'), ar('B', 'D'), ar('C', 'D'), ar('D', 'E')], dirigido: false, ponderado: false };
/** Rede do exemplo de Bellman-Ford do curso (em Python), com um peso negativo. A = Router A, B = Router B, C = Server C, D = Router D, E = Router E, F = Client F. */
export const G_BELLMAN: Grafo = { nos: [no('A', 45, 140), no('B', 135, 55), no('C', 135, 225), no('D', 235, 55), no('E', 245, 225), no('F', 325, 140)], arestas: [ar('A', 'B', 1), ar('A', 'C', 5), ar('B', 'C', 2), ar('B', 'D', 3), ar('C', 'E', 1), ar('C', 'B', -1), ar('D', 'E', 4), ar('E', 'F', 2), ar('E', 'A', 8)], dirigido: true, ponderado: true };
export const G_PESOS: Grafo = { nos: [no('A', 50, 140), no('B', 150, 55), no('C', 150, 225), no('D', 255, 55), no('E', 255, 225), no('F', 325, 140)], arestas: [ar('A', 'B', 4), ar('A', 'C', 2), ar('B', 'C', 1), ar('B', 'D', 5), ar('C', 'E', 8), ar('D', 'E', 2), ar('D', 'F', 6), ar('E', 'F', 3)], dirigido: false, ponderado: true };
/** Projeto de TI do curso (atividade 02): A → B, C; B → D; C → E; D, E → F; F → G. */
export const G_TAREFAS: Grafo = { nos: [no('A', 40, 140), no('B', 115, 65), no('C', 115, 215), no('D', 195, 65), no('E', 195, 215), no('F', 265, 140), no('G', 330, 140)], arestas: [ar('A', 'B'), ar('A', 'C'), ar('B', 'D'), ar('C', 'E'), ar('D', 'F'), ar('E', 'F'), ar('F', 'G')], dirigido: true, ponderado: false };
const G_VAZIO4: Grafo = { nos: [no('A', 90, 70), no('B', 270, 70), no('C', 270, 210), no('D', 90, 210)], arestas: [], dirigido: false, ponderado: false };
const G_ATALHO: Grafo = { nos: [no('A', 50, 140), no('B', 180, 55), no('C', 180, 225), no('D', 310, 140)], arestas: [ar('A', 'B', 1), ar('B', 'D', 1), ar('A', 'C', 2), ar('C', 'D', 5)], dirigido: false, ponderado: true };

const valido = (x: unknown) => !!x && Array.isArray((x as Grafo).nos) && Array.isArray((x as Grafo).arestas) && (x as Grafo).nos.length <= 8;
const CENARIOS: { rotulo: string; s: Grafo; nota: string }[] = [
  { rotulo: 'Exercício do curso (5 vértices)', s: G_EXERCICIO, nota: 'Atividade 01 da U7: é conexo, tem o ciclo A-B-C, e os graus são A = 2, B = 2, C = 3, D = 2, E = 1.' },
  { rotulo: 'Grafo das buscas (BFS e DFS)', s: G_BUSCA, nota: 'O grafo dos exemplos de busca do curso. Vá na aba "Algoritmo" e rode BFS e DFS a partir de A.' },
  { rotulo: 'Rede com pesos (Dijkstra, Kruskal)', s: G_PESOS, nota: 'Os números são custos (latência, distância). Rode Dijkstra a partir de A e depois Kruskal.' },
  { rotulo: 'E se… houver peso negativo?', s: G_BELLMAN, nota: 'A rede do exemplo em Python do curso: a aresta C→B vale −1. Dijkstra não é confiável aqui; Bellman-Ford é.' },
  { rotulo: 'E se… o ciclo for negativo?', s: { ...G_BELLMAN, arestas: G_BELLMAN.arestas.map((e) => (e.a === 'C' && e.b === 'B' ? { ...e, w: -3 } : e)) }, nota: 'Agora B→C→B soma 2 + (−3) = −1: dando voltas, a "distância" diminui para sempre. Rode Bellman-Ford e veja a verificação final acusar.' },
  { rotulo: 'Tarefas de um projeto (dirigido)', s: G_TAREFAS, nota: 'Atividade 02 da U7: cada seta diz "precisa vir antes". É um grafo dirigido sem ciclos (DAG). Rode BFS a partir de A.' },
  { rotulo: 'E se… tirar uma aresta do ciclo?', s: { ...G_EXERCICIO, arestas: G_EXERCICIO.arestas.filter((e) => !(e.a === 'B' && e.b === 'C')) }, nota: 'Sem a aresta B-C o ciclo some: conexo e sem ciclo, virou uma árvore. Repare: 5 vértices, 4 arestas.' },
];

const temAresta = (g: Grafo, a: string, b: string) => g.arestas.some((e) => (e.a === a && e.b === b) || (!g.dirigido && e.a === b && e.b === a));
export const DESAFIOS_GRAFO: DesafioBase<Grafo>[] = [
  { id: 'g-graus', texto: 'Ligue os 4 vértices de modo que TODOS tenham grau 2.', ini: G_VAZIO4, prever: 'Antes de ligar: quantas arestas vão ser necessárias?',
    falta: (g) => (g.nos.length !== 4 ? 'Mantenha os 4 vértices.' : Object.values(graus(g)).every((x) => x.grau === 2) ? null : `Graus agora: ${Object.entries(graus(g)).map(([k, v]) => `${k} = ${v.grau}`).join(', ')}.`), depois: 'Um ciclo de 4 vértices: 4 arestas. A soma dos graus (8) é sempre o dobro do número de arestas, porque cada aresta conta para dois vértices.' },
  { id: 'g-arvore', texto: 'Este é o grafo do exercício do curso. Ele tem um ciclo. Apague UMA aresta para ele virar uma árvore.', ini: G_EXERCICIO,
    falta: (g) => (g.nos.length !== 5 ? 'Mantenha os 5 vértices.' : g.arestas.length !== 4 ? 'Apague exatamente uma aresta (devem sobrar 4).' : ehArvore(g) ? null : 'Ficou desconexo. A aresta a tirar tem que ser uma das que formam o ciclo.'), depois: 'Árvore = conexo e sem ciclo. Com 5 vértices sobram exatamente 4 arestas: |E| = |V| − 1.' },
  { id: 'g-ponte', texto: 'No mesmo grafo: apague UMA aresta que deixe a rede desconexa (alguém fica isolado do resto).', ini: G_EXERCICIO,
    falta: (g) => (g.arestas.length !== 4 ? 'Apague exatamente uma aresta.' : !conexo(g) ? null : 'A rede continua conexa: essa aresta fazia parte do ciclo, havia outro caminho. Tente outra.'), depois: 'Uma aresta cuja retirada desconecta o grafo se chama ponte. C-D e D-E são pontes; as três do ciclo A-B-C não são. Numa rede real, ponte é ponto único de falha.' },
  { id: 'g-euler', texto: 'Acrescente UMA aresta ao grafo do exercício para que todos os vértices fiquem com grau par (aí existe um circuito euleriano).', ini: G_EXERCICIO,
    falta: (g) => (g.arestas.length !== 6 ? 'Acrescente exatamente uma aresta.' : euleriano(g) ? null : `Ainda há grau ímpar: ${Object.entries(graus(g)).filter(([, v]) => v.grau % 2).map(([k, v]) => `${k} = ${v.grau}`).join(', ')}.`), depois: 'Os únicos de grau ímpar eram C (3) e E (1): ligando os dois, ambos ficam pares. Teorema de Euler: conexo + todos os graus pares = dá para passar por todas as arestas uma única vez e voltar ao início.' },
  { id: 'g-atalho', texto: 'De A até D, o caminho mais curto hoje passa por B. Mude só os PESOS para que o mais curto passe por C.', ini: G_ATALHO, prever: 'Antes de mexer: qual a menor distância de A até D agora?',
    falta: (g) => { if (g.arestas.length !== 4 || g.nos.length !== 4) return 'Não apague nem crie nada: só mude pesos.'; if (g.arestas.some((e) => e.w < 0)) return 'Sem pesos negativos aqui.'; const r = dijkstra(g, 'A'); return caminho(r.ant!, 'D').includes('C') ? null : `O mais curto ainda é ${caminho(r.ant!, 'D').join(' → ')} (custo ${r.dist!.D}).`; }, depois: 'O caminho mínimo depende dos pesos, não do número de arestas. É o que o Dijkstra calcula num GPS ou num roteador.' },
];

type Ferramenta = 'mover' | 'vertice' | 'aresta' | 'peso' | 'apagar';
type Alg = 'bfs' | 'dfs' | 'dijkstra' | 'bellman' | 'kruskal';
const NOME_ALG: Record<Alg, string> = { bfs: 'BFS (largura)', dfs: 'DFS (profundidade)', dijkstra: 'Dijkstra', bellman: 'Bellman-Ford', kruskal: 'Kruskal' };
const inf = (v: number) => (v === Infinity ? '∞' : String(v));

export function EditorGrafos({ modoInicial = 'livre', desafios, preset, chave, onProgresso }: ToyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const gesto = useGesto(svg);
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const inicial = preset === 'busca' ? G_BUSCA : preset === 'pesos' ? G_PESOS : preset === 'bellman' ? G_BELLMAN : preset === 'tarefas' ? G_TAREFAS : G_EXERCICIO;
  const h = useHistorico<Grafo>(inicial, chave, valido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const [nota, setNota] = useState('');
  const [ferr, setFerr] = useState<Ferramenta>('mover');
  const [sel, setSel] = useState<string | null>(null);
  const [selAr, setSelAr] = useState<number | null>(null);
  const [aba, setAba] = useState<'props' | 'matriz' | 'alg'>(preset ? 'alg' : 'props');
  const [alg, setAlg] = useState<Alg>(preset === 'pesos' ? 'dijkstra' : preset === 'bellman' ? 'bellman' : 'bfs');
  const [origem, setOrigem] = useState('A');
  const [passo, setPasso] = useState(0);
  const { painel } = useDesafios(DESAFIOS_GRAFO, desafios, modo, h, onProgresso, () => { setNota(''); setSel(null); setSelAr(null); });
  const g = h.estado;
  useEffect(() => { setPasso(0); }, [g, alg, origem]);
  const org = g.nos.some((n) => n.id === origem) ? origem : g.nos[0]?.id;

  const exec: Execucao | null = useMemo(() => {
    if (aba !== 'alg' || !org) return null;
    return alg === 'bfs' ? bfs(g, org) : alg === 'dfs' ? dfs(g, org) : alg === 'dijkstra' ? dijkstra(g, org) : alg === 'bellman' ? bellmanFord(g, org) : kruskal(g);
  }, [g, alg, org, aba]);
  const P = exec ? exec.passos[Math.min(passo, exec.passos.length - 1)] : null;
  const marcada = (a: string, b: string) => !!P && P.marcadas.some(([x, y]) => (x === a && y === b) || (!g.dirigido && x === b && y === a));
  const olhando = (a: string, b: string) => !!P?.olhando && ((P.olhando[0] === a && P.olhando[1] === b) || (!g.dirigido && P.olhando[0] === b && P.olhando[1] === a));

  // ---------- edição ----------
  const tocarNo = (id: string) => {
    if (ferr === 'apagar') { h.mudar({ ...g, nos: g.nos.filter((n) => n.id !== id), arestas: g.arestas.filter((e) => e.a !== id && e.b !== id) }); setSel(null); return; }
    if (ferr === 'aresta') {
      if (!sel) { setSel(id); return; }
      if (sel !== id) h.mudar(temAresta(g, sel, id) ? { ...g, arestas: g.arestas.filter((e) => !((e.a === sel && e.b === id) || (!g.dirigido && e.a === id && e.b === sel))) } : { ...g, arestas: [...g.arestas, ar(sel, id, 1)] });
      setSel(null); return;
    }
    if (aba === 'alg') setOrigem(id);
  };
  const tocarAresta = (i: number) => {
    if (ferr === 'apagar') { h.mudar({ ...g, arestas: g.arestas.filter((_, k) => k !== i) }); setSelAr(null); }
    else if (ferr === 'peso') setSelAr(selAr === i ? null : i);
  };
  const tocarFundo = (p: { x: number; y: number }) => {
    if (ferr === 'vertice') {
      const livre = LETRAS.find((l) => !g.nos.some((n) => n.id === l));
      if (!livre) { setNota('O editor vai até 8 vértices (A a H).'); return; }
      h.mudar({ ...g, nos: [...g.nos, no(livre, limitar(p.x, R + 4, W - R - 4), limitar(p.y, R + 4, H - R - 4))].sort((a, b) => a.id.localeCompare(b.id)) });
    } else { setSel(null); setSelAr(null); }
  };
  const mudaPeso = (d: number) => { if (selAr === null) return; h.mudar({ ...g, arestas: g.arestas.map((e, k) => (k === selAr ? { ...e, w: Math.max(g.dirigido ? -9 : 0, Math.min(20, e.w + d)) } : e)) }); };

  // ---------- desenho ----------
  const pos = Object.fromEntries(g.nos.map((n) => [n.id, n]));
  const arestas = g.arestas.map((e, i) => {
    const A = pos[e.a], B = pos[e.b]; if (!A || !B) return null;
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const volta = g.dirigido && g.arestas.some((o) => o.a === e.b && o.b === e.a), desv = volta ? 12 : 0;
    const p1 = { x: A.x + ux * R - uy * desv, y: A.y + uy * R + ux * desv }, p2 = { x: B.x - ux * (R + (g.dirigido ? 5 : 0)) - uy * desv, y: B.y - uy * (R + (g.dirigido ? 5 : 0)) + ux * desv };
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2, m = marcada(e.a, e.b), o = olhando(e.a, e.b);
    const cor = o ? (P?.recusada ? 'var(--bad)' : 'var(--gold)') : m ? 'var(--accent)' : selAr === i ? 'var(--gold)' : 'var(--fio)';
    return (
      <g key={i} onPointerDown={(ev) => gesto.iniciar(ev, { tocar: () => tocarAresta(i) })} style={{ cursor: ferr === 'peso' || ferr === 'apagar' ? 'pointer' : 'default' }}>
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={22} />
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={cor} strokeWidth={m || o ? 4.5 : 2.2} strokeLinecap="round" />
        {g.dirigido && <path d={`M${p2.x + ux * 5},${p2.y + uy * 5} L${p2.x - ux * 6 - uy * 5},${p2.y - uy * 6 + ux * 5} L${p2.x - ux * 6 + uy * 5},${p2.y - uy * 6 - ux * 5} Z`} fill={cor} />}
        {g.ponderado && <><circle cx={mx} cy={my} r={10} fill="var(--paper)" stroke={cor} strokeWidth={1.2} /><text x={mx} y={my + 4} textAnchor="middle" fontSize={11} fontWeight={800}>{e.w}</text></>}
      </g>
    );
  });
  const nos = g.nos.map((n) => {
    const vis = P?.visitados.includes(n.id), atual = P?.atual === n.id, esp = P?.espera.includes(n.id);
    return (
      <g key={n.id} className="pega" transform={`translate(${n.x} ${n.y})`} onPointerDown={(e) => gesto.iniciar(e, { comecar: ferr === 'mover' ? h.marcar : undefined, mover: ferr === 'mover' ? (p) => h.ajustar((st) => ({ ...st, nos: st.nos.map((m) => (m.id === n.id ? { ...m, x: limitar(p.x, R + 2, W - R - 2), y: limitar(p.y, R + 2, H - R - 2) } : m)) })) : undefined, tocar: () => tocarNo(n.id) })}>
        <circle r={R + 6} fill="transparent" />
        <circle r={R} fill={atual ? 'var(--gold)' : vis ? 'var(--accent)' : 'var(--paper)'} stroke={sel === n.id ? 'var(--gold)' : esp ? 'var(--accent)' : 'var(--ink-2)'} strokeWidth={sel === n.id || esp ? 3.5 : 1.6} strokeDasharray={esp && !vis ? '4 3' : undefined} className={sel === n.id ? 'pulsa' : ''} />
        <text textAnchor="middle" y={5} fontSize={14} fontWeight={800} style={{ fill: vis && !atual ? 'var(--accent-ink)' : 'var(--ink)' }}>{n.id}</text>
        {P?.dist && P.dist[n.id] !== undefined && <text textAnchor="middle" y={-R - 5} fontSize={11} fontWeight={800} style={{ fill: 'var(--accent)' }}>{inf(P.dist[n.id])}</text>}
        {aba === 'alg' && alg !== 'kruskal' && org === n.id && <text textAnchor="middle" y={R + 13} fontSize={9} fontWeight={700}>origem</text>}
      </g>
    );
  });

  const V = g.nos.map((n) => n.id), gr = graus(g), L = listaAdj(g), comps = componentes(g);
  const tabela = (M: number[][], cols: string[]) => (
    <div style={{ overflowX: 'auto' }}>
      <table className="tv" style={{ fontSize: '.82rem' }}><thead><tr><th></th>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{M.map((l, i) => <tr key={i}><th>{V[i]}</th>{l.map((x, j) => <td key={j} style={x ? { fontWeight: 800 } : { opacity: 0.45 }}>{x}</td>)}</tr>)}</tbody></table>
    </div>
  );
  const avisoAlg = alg === 'dijkstra' && g.arestas.some((e) => e.w < 0) ? 'Atenção: há peso negativo. O Dijkstra pode errar aqui; use Bellman-Ford.' : alg === 'kruskal' && g.dirigido ? 'Kruskal é para grafos não dirigidos: as setas estão sendo ignoradas.' : (alg === 'dijkstra' || alg === 'bellman' || alg === 'kruskal') && !g.ponderado ? 'O grafo está sem pesos: todas as arestas valem 1.' : '';
  const FERR: [Ferramenta, string][] = [['mover', 'Mover'], ['vertice', '+ Vértice'], ['aresta', '+ Aresta'], ['peso', 'Peso'], ['apagar', 'Apagar']];
  const dica = { mover: aba === 'alg' ? 'Arraste os vértices. Toque num vértice para torná-lo a origem.' : 'Arraste os vértices para arrumar o desenho.', vertice: 'Toque num lugar vazio para criar um vértice.', aresta: sel ? `Agora toque no outro vértice para ligar (ou desligar) ${sel}.` : 'Toque num vértice e depois em outro para criar a aresta. Repetir desfaz.', peso: g.ponderado ? (selAr === null ? 'Toque numa aresta para escolher e mude o peso com − e +.' : 'Use − e + para mudar o peso.') : 'Ligue "com pesos" primeiro.', apagar: 'Toque num vértice ou numa aresta para apagar.' }[ferr];

  return (
    <Moldura titulo="Editor de grafos" modo={modo} onModo={setModo} h={h} cenarios={modo === 'livre' ? CENARIOS.map((c) => ({ rotulo: c.rotulo, acao: () => { h.mudar(c.s); setNota(c.nota); setSel(null); setSelAr(null); } })) : undefined}>
      {painel}
      {nota && <div className="fb neutro">{nota}</div>}
      <div className="linha">
        <div className="seg" role="group" aria-label="Ferramenta" style={{ flexWrap: 'wrap' }}>
          {FERR.map(([f, r]) => <button key={f} aria-pressed={ferr === f} onClick={() => { setFerr(f); setSel(null); setSelAr(null); }}>{r}</button>)}
        </div>
      </div>
      <div className="linha">
        <button className="btn sm" aria-pressed={g.dirigido} onClick={() => h.mudar({ ...g, dirigido: !g.dirigido })}>{g.dirigido ? '◉' : '○'} dirigido (setas)</button>
        <button className="btn sm" aria-pressed={g.ponderado} onClick={() => h.mudar({ ...g, ponderado: !g.ponderado, arestas: g.ponderado ? g.arestas.map((e) => ({ ...e, w: 1 })) : g.arestas })}>{g.ponderado ? '◉' : '○'} com pesos</button>
        {ferr === 'peso' && selAr !== null && g.arestas[selAr] && <span className="linha" style={{ gap: 4 }}><button className="btn sm" onClick={() => mudaPeso(-1)} aria-label="Diminuir peso">−</button><b className="mono">{g.arestas[selAr].w}</b><button className="btn sm" onClick={() => mudaPeso(1)} aria-label="Aumentar peso">+</button></span>}
      </div>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="palco" role="img" aria-label={`Grafo com ${V.length} vértices e ${g.arestas.length} arestas`} onPointerDown={(e) => gesto.iniciar(e, { tocar: tocarFundo })}>
        {arestas}{nos}
      </svg>
      <span className="mini">{dica}</span>

      <div className="seg" role="group" aria-label="Painel">
        <button aria-pressed={aba === 'props'} onClick={() => setAba('props')}>Propriedades</button>
        <button aria-pressed={aba === 'matriz'} onClick={() => setAba('matriz')}>Matrizes e lista</button>
        <button aria-pressed={aba === 'alg'} onClick={() => setAba('alg')}>Algoritmo</button>
      </div>

      {aba === 'props' && (
        <div className="vivo" aria-live="polite">
          <div className="f">G = (V, E) · |V| = {V.length} vértices · |E| = {g.arestas.length} arestas</div>
          <div className="f">{g.dirigido ? 'Graus (entrada/saída): ' + V.map((v) => `${v} ${gr[v].entrada}/${gr[v].saida}`).join(' · ') : 'Graus: ' + V.map((v) => `${v} = ${gr[v].grau}`).join(' · ')}</div>
          {!g.dirigido && <div className="f">Soma dos graus = {V.reduce((t, v) => t + gr[v].grau, 0)} = 2 × {g.arestas.length} arestas</div>}
          <div className="linha">
            <span className={'pilula ' + (conexo(g) ? 'ok' : '')}>{conexo(g) ? 'conexo' : `desconexo (${comps.length} partes)`}</span>
            <span className={'pilula ' + (temCiclo(g) ? 'ouro' : 'ok')}>{temCiclo(g) ? 'tem ciclo' : 'sem ciclo'}</span>
            {!g.dirigido && <span className={'pilula ' + (ehArvore(g) ? 'ok' : '')} style={ehArvore(g) ? undefined : { opacity: 0.55, textDecoration: 'line-through' }}>árvore</span>}
            {!g.dirigido && <span className={'pilula ' + (euleriano(g) ? 'ok' : '')} style={euleriano(g) ? undefined : { opacity: 0.55, textDecoration: 'line-through' }}>euleriano</span>}
          </div>
          <span className="mini">{g.dirigido ? (temCiclo(g) ? 'Dirigido com ciclo: não dá para pôr as tarefas em ordem.' : 'Dirigido e sem ciclo: é um DAG; existe uma ordem válida de execução.') : ehArvore(g) ? `Árvore: conexo, sem ciclo e |E| = |V| − 1 (${g.arestas.length} = ${V.length} − 1).` : !conexo(g) ? `Partes: ${comps.map((c) => `{${c.join(', ')}}`).join(' e ')}.` : `Para ser árvore sobram ${g.arestas.length - (V.length - 1)} aresta(s).`}{!g.dirigido && dirac(g) ? ' Todo vértice tem grau ≥ n/2: pelo Teorema de Dirac, existe ciclo hamiltoniano.' : ''}</span>
        </div>
      )}
      {aba === 'matriz' && (
        <div className="vivo">
          <span className="rotulo">Matriz de adjacência (vértice × vértice){!g.dirigido ? ': simétrica' : ''}</span>
          {tabela(matrizAdj(g), V)}
          <span className="rotulo">Lista de adjacência</span>
          {V.map((v) => <div className="f" key={v}>{v}: {L[v].map((x) => (g.ponderado ? `${x.v}(${x.w})` : x.v)).join(', ') || '—'}</div>)}
          <span className="rotulo">Matriz de incidência (vértice × aresta)</span>
          {g.arestas.length ? tabela(matrizInc(g), g.arestas.map((e) => e.a + e.b)) : <span className="mini">Sem arestas ainda.</span>}
          <span className="mini">A matriz de adjacência gasta {V.length} × {V.length} = {V.length * V.length} posições, haja ou não aresta. A lista guarda só as {g.dirigido ? g.arestas.length : g.arestas.length * 2} ligações que existem.</span>
        </div>
      )}
      {aba === 'alg' && exec && P && (
        <div className="vivo" aria-live="polite">
          <div className="linha">{(Object.keys(NOME_ALG) as Alg[]).map((a) => <button key={a} className="btn sm" aria-pressed={alg === a} onClick={() => setAlg(a)}>{NOME_ALG[a]}</button>)}</div>
          {avisoAlg && <div className="dica">{avisoAlg}</div>}
          <div className="linha">
            <button className="btn sm" disabled={passo === 0} onClick={() => setPasso(0)}>⏮ começo</button>
            <button className="btn sm" disabled={passo === 0} onClick={() => setPasso(passo - 1)}>◀</button>
            <button className="btn sm pri" disabled={passo >= exec.passos.length - 1} onClick={() => setPasso(passo + 1)}>próximo passo ▶</button>
            <button className="btn sm" disabled={passo >= exec.passos.length - 1} onClick={() => setPasso(exec.passos.length - 1)}>fim ⏭</button>
            <span className="mini">{Math.min(passo, exec.passos.length - 1) + 1}/{exec.passos.length}</span>
          </div>
          <div style={{ fontWeight: 650 }}>{P.texto}</div>
          {(alg === 'bfs' || alg === 'dfs') && <div className="f">{alg === 'bfs' ? 'Fila (sai pela frente)' : 'Pilha (o topo é o último)'}: [{P.espera.join(', ')}] · visitados: {P.visitados.join(', ') || '—'}</div>}
          {P.dist && alg !== 'bfs' && <div className="f">dist: {V.map((v) => `${v} = ${inf(P.dist![v])}`).join(' · ')}</div>}
          {alg === 'bfs' && P.dist && <div className="f">nível (nº de arestas desde {org}): {Object.entries(P.dist).map(([v, d]) => `${v} = ${d}`).join(' · ')}</div>}
          <span className="mini">{{ bfs: 'BFS: visita por camadas, usando uma FILA. Acha o caminho com menos arestas em grafo sem pesos.', dfs: 'DFS: vai fundo num ramo e só então volta, usando uma PILHA. Bom para achar ciclos e analisar dependências. A ordem depende da ordem dos vizinhos; aqui é alfabética.', dijkstra: 'Dijkstra: sempre fecha o vértice em aberto com menor distância. Só vale com pesos não negativos.', bellman: 'Bellman-Ford: repete "relaxar todas as arestas" até |V| − 1 vezes. Aceita peso negativo e detecta ciclo negativo.', kruskal: 'Kruskal: pega as arestas da mais barata para a mais cara e pula as que fechariam ciclo. Resultado: árvore geradora mínima.' }[alg]}</span>
        </div>
      )}
    </Moldura>
  );
}
