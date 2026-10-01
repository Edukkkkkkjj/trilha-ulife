// Conjuntos no diagrama de Venn.
// Um diagrama de 3 círculos tem 8 regiões. Cada região é um número de 0 a 7:
// bit 1 = dentro de A, bit 2 = dentro de B, bit 4 = dentro de C. Região 0 = fora de todos.
// Um conjunto qualquer é uma "máscara": quais das 8 regiões ele ocupa.

export const NOMES = ['A', 'B', 'C'] as const;
export const MASK = { A: 0xaa, B: 0xcc, C: 0xf0 } as const;

export class SetParseError extends Error {}

export function universe(n: 2 | 3): number { return n === 3 ? 0xff : 0x0f; }

/** Avalia uma expressão como "(B ∩ C) − A" e devolve a máscara de regiões. */
export function evalSetExpr(src: string, n: 2 | 3 = 3): number {
  const U = universe(n);
  const toks: string[] = [];
  for (const ch of src) {
    if (/\s/.test(ch)) continue;
    if ('ABC'.includes(ch)) { if (ch === 'C' && n === 2) throw new SetParseError('Este diagrama só tem A e B.'); toks.push(ch); }
    else if (ch === 'U' ) toks.push('U');
    else if (ch === '∅' || ch === '0') toks.push('∅');
    else if ('∪+|u'.includes(ch)) toks.push('∪');
    else if ('∩^&n'.includes(ch)) toks.push('∩');
    else if ('−-–\\'.includes(ch)) toks.push('−');
    else if ("'’′ᶜ".includes(ch)) toks.push("'");
    else if (ch === '(' || ch === ')') toks.push(ch);
    else throw new SetParseError(`Não entendi o símbolo "${ch}".`);
  }
  if (!toks.length) throw new SetParseError('A expressão está vazia.');
  let i = 0;
  const expr = (): number => {
    let a = inter();
    while (toks[i] === '∪' || toks[i] === '−') {
      const op = toks[i++]; const b = inter();
      a = op === '∪' ? a | b : a & ~b & U;
    }
    return a;
  };
  const inter = (): number => {
    let a = post();
    while (toks[i] === '∩') { i++; a &= post(); }
    return a;
  };
  const post = (): number => {
    let a = atom();
    while (toks[i] === "'") { i++; a = ~a & U; }
    return a;
  };
  const atom = (): number => {
    const t = toks[i++];
    if (t === undefined) throw new SetParseError('A expressão terminou antes da hora.');
    if (t === 'A' || t === 'B' || t === 'C') return MASK[t] & U;
    if (t === 'U') return U;
    if (t === '∅') return 0;
    if (t === '(') { const a = expr(); if (toks[i++] !== ')') throw new SetParseError('Faltou fechar um parêntese.'); return a; }
    throw new SetParseError(`"${t}" está fora de lugar.`);
  };
  const r = expr();
  if (i < toks.length) throw new SetParseError(`Sobrou "${toks[i]}" no fim.`);
  return r;
}

/** Em que região cai um elemento, dado em quais círculos ele está. */
export function regionOf(inA: boolean, inB: boolean, inC: boolean): number {
  return (inA ? 1 : 0) | (inB ? 2 : 0) | (inC ? 4 : 0);
}

/** Expressão exata de UMA região: A∩B'∩C'. */
export function regionExpr(r: number, n: 2 | 3 = 3): string {
  return NOMES.slice(0, n).map((s, k) => ((r >> k) & 1 ? s : s + "'")).join(' ∩ ');
}

/** Descrição em português de uma região. */
export function regionName(r: number, n: 2 | 3 = 3): string {
  const dentro = NOMES.slice(0, n).filter((_, k) => (r >> k) & 1);
  if (!dentro.length) return 'fora de todos os conjuntos';
  if (dentro.length === n) return n === 3 ? 'nos três ao mesmo tempo' : 'nos dois ao mesmo tempo';
  if (dentro.length === 1) return `só em ${dentro[0]}`;
  return `em ${dentro.join(' e ')}, mas não em ${NOMES.slice(0, n).find((s) => !dentro.includes(s))}`;
}

export function regionsOf(mask: number, n: 2 | 3 = 3): number[] {
  const out: number[] = [];
  for (let r = 0; r < (n === 3 ? 8 : 4); r++) if ((mask >> r) & 1) out.push(r);
  return out;
}

/** Conta elementos de um conjunto (máscara), dado quantos elementos há em cada região. */
export function countIn(mask: number, perRegion: number[]): number {
  return perRegion.reduce((s, q, r) => s + ((mask >> r) & 1 ? q : 0), 0);
}

// ---- conjuntos "de verdade" (listas de elementos) para os exercícios gerados ----
export const uniq = <T,>(xs: T[]) => [...new Set(xs)];
export const union = <T,>(a: T[], b: T[]) => uniq([...a, ...b]);
export const inter = <T,>(a: T[], b: T[]) => a.filter((x) => b.includes(x));
export const diff = <T,>(a: T[], b: T[]) => a.filter((x) => !b.includes(x));
export const sameSet = <T,>(a: T[], b: T[]) => uniq(a).length === uniq(b).length && uniq(a).every((x) => b.includes(x));

/** Lê "1, 2, 3" ou "{1,2,3}" ou "vazio"/"∅". */
export function parseSetList(src: string): string[] {
  const s = src.trim().replace(/[{}]/g, '');
  if (!s || /^(∅|vazio|nenhum)$/i.test(s)) return [];
  return uniq(s.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean));
}
