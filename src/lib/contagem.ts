// Contagem (análise combinatória): as fórmulas e a árvore de possibilidades que o brinquedo desenha.

export const fat = (n: number): number => (n <= 1 ? 1 : n * fat(n - 1));
/** Arranjo: escolher p entre n, com ordem, sem repetir. */
export const arranjo = (n: number, p: number): number => (p > n ? 0 : fat(n) / fat(n - p));
/** Combinação: escolher p entre n, sem ordem, sem repetir. */
export const comb = (n: number, p: number): number => (p > n ? 0 : arranjo(n, p) / fat(p));
/** Quantas vezes cada letra aparece. */
export const frequencias = (palavra: string): Record<string, number> => [...palavra].reduce<Record<string, number>>((a, l) => ({ ...a, [l]: (a[l] ?? 0) + 1 }), {});
/** Anagramas de uma palavra, descontando letras repetidas: n! / (p1! · p2! · …). */
export const anagramas = (palavra: string): number => Object.values(frequencias(palavra)).reduce((t, k) => t / fat(k), fat([...palavra].length));

// ---------- a árvore ----------
export type Etapa = { nome: string; n: number };
export type EstadoArvore =
  | { tipo: 'etapas'; etapas: Etapa[] }
  | { tipo: 'escolha'; n: number; p: number; repete: boolean; ordem: boolean }
  | { tipo: 'palavra'; palavra: string };

export type No = { rot: string; prof: number; filhos: No[]; folha?: Folha };
/** Uma folha é um resultado. `chave` diz a qual resultado DISTINTO ela pertence (folhas com a mesma chave contam uma vez só). */
export type Folha = { i: number; caminho: string[]; chave: string };

const ITENS = ['A', 'B', 'C', 'D', 'E', 'F'];
export const MAX_FOLHAS = 64;

/** Quantas folhas a árvore teria, sem precisar desenhar. */
export function numFolhas(s: EstadoArvore): number {
  if (s.tipo === 'etapas') return s.etapas.reduce((t, e) => t * e.n, 1);
  if (s.tipo === 'palavra') return fat([...s.palavra].length);
  return s.repete ? s.n ** s.p : arranjo(s.n, s.p);
}

export function montar(s: EstadoArvore): { raiz: No; folhas: Folha[]; prof: number } {
  const folhas: Folha[] = [];
  const prof = s.tipo === 'etapas' ? s.etapas.length : s.tipo === 'palavra' ? [...s.palavra].length : s.p;
  const letras = s.tipo === 'palavra' ? [...s.palavra] : [];
  const chaveDe = (caminho: string[]) => (s.tipo === 'escolha' && !s.ordem ? [...caminho].sort().join('') : s.tipo === 'etapas' ? caminho.join('·') : caminho.join(''));
  const desce = (no: No, caminho: string[], usados: number[]) => {
    if (no.prof === prof) { no.folha = { i: folhas.length, caminho, chave: chaveDe(caminho) }; folhas.push(no.folha); return; }
    let ops: { rot: string; idx: number }[];
    if (s.tipo === 'etapas') ops = Array.from({ length: s.etapas[no.prof].n }, (_, k) => ({ rot: String(k + 1), idx: k }));
    else if (s.tipo === 'palavra') ops = letras.map((l, k) => ({ rot: l, idx: k })).filter((o) => !usados.includes(o.idx));
    else ops = ITENS.slice(0, s.n).map((l, k) => ({ rot: l, idx: k })).filter((o) => s.repete || !usados.includes(o.idx));
    for (const o of ops) {
      const f: No = { rot: o.rot, prof: no.prof + 1, filhos: [] };
      no.filhos.push(f);
      desce(f, [...caminho, o.rot], [...usados, o.idx]);
    }
  };
  const raiz: No = { rot: '', prof: 0, filhos: [] };
  desce(raiz, [], []);
  return { raiz, folhas, prof };
}

/** Resultados distintos, na ordem em que aparecem, com quantas folhas cada um junta. */
export function grupos(folhas: Folha[]): { chave: string; folhas: Folha[] }[] {
  const m = new Map<string, Folha[]>();
  for (const f of folhas) m.set(f.chave, [...(m.get(f.chave) ?? []), f]);
  return [...m].map(([chave, fs]) => ({ chave, folhas: fs }));
}

/** O total de resultados distintos, pela fórmula (o teste compara com a contagem das folhas). */
export function totalPelaFormula(s: EstadoArvore): number {
  if (s.tipo === 'etapas') return numFolhas(s);
  if (s.tipo === 'palavra') return anagramas(s.palavra);
  if (s.ordem) return s.repete ? s.n ** s.p : arranjo(s.n, s.p);
  return s.repete ? comb(s.n + s.p - 1, s.p) : comb(s.n, s.p);
}
