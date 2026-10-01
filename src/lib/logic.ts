// Motor de lógica proposicional / álgebra booleana.
// Aceita as duas notações do curso: p ∧ q ∨ ¬r  e  A·B + C'.

export type Op = 'and' | 'or' | 'xor' | 'imp' | 'iff' | 'nand' | 'nor' | 'xnor';
export type Ast =
  | { k: 'var'; n: string }
  | { k: 'const'; v: boolean }
  | { k: 'not'; a: Ast }
  | { k: 'bin'; op: Op; a: Ast; b: Ast };

export class ParseError extends Error {}

type Tok = { t: 'var' | 'const' | 'not' | 'post' | 'lp' | 'rp' | Op; s: string };

const WORDS: [RegExp, string][] = [
  [/\bXNOR\b/g, '⊙'], [/\bNAND\b/g, '↑'], [/\bNOR\b/g, '↓'], [/\bXOR\b/g, '⊕'],
  [/\bAND\b/g, '∧'], [/\bNOT\b/g, '¬'], [/\bOR\b/g, '∨'],
];

function tokenize(src: string): Tok[] {
  let s = src;
  for (const [re, sym] of WORDS) s = s.replace(re, sym);
  s = s.replace(/<->|<=>/g, '↔').replace(/->|=>/g, '→');
  const out: Tok[] = [];
  for (const ch of s) {
    if (/\s/.test(ch)) continue;
    if (ch === '(' || ch === '[') out.push({ t: 'lp', s: ch });
    else if (ch === ')' || ch === ']') out.push({ t: 'rp', s: ch });
    else if ('¬~!'.includes(ch)) out.push({ t: 'not', s: ch });
    else if ("'’′".includes(ch)) out.push({ t: 'post', s: ch });
    else if ('∧^·.*&'.includes(ch)) out.push({ t: 'and', s: ch });
    else if ('∨+|v'.includes(ch)) out.push({ t: 'or', s: ch });
    else if (ch === '⊕') out.push({ t: 'xor', s: ch });
    else if (ch === '→') out.push({ t: 'imp', s: ch });
    else if (ch === '↔') out.push({ t: 'iff', s: ch });
    else if (ch === '↑') out.push({ t: 'nand', s: ch });
    else if (ch === '↓') out.push({ t: 'nor', s: ch });
    else if (ch === '⊙') out.push({ t: 'xnor', s: ch });
    else if (ch === '1' || ch === '0') out.push({ t: 'const', s: ch });
    else if (/[A-Za-z]/.test(ch)) out.push({ t: 'var', s: ch });
    else throw new ParseError(`Não entendi o símbolo "${ch}".`);
  }
  return out;
}

/** Transforma texto em árvore. Lança ParseError com mensagem em português. */
export function parse(src: string): Ast {
  const toks = tokenize(src);
  if (!toks.length) throw new ParseError('A expressão está vazia.');
  let i = 0;
  const peek = () => toks[i];
  const startsAtom = (t?: Tok) => !!t && (t.t === 'var' || t.t === 'const' || t.t === 'lp' || t.t === 'not');

  function iff(): Ast {
    let a = imp();
    while (peek()?.t === 'iff') { i++; a = { k: 'bin', op: 'iff', a, b: imp() }; }
    return a;
  }
  function imp(): Ast {
    const a = or();
    if (peek()?.t === 'imp') { i++; return { k: 'bin', op: 'imp', a, b: imp() }; }
    return a;
  }
  function or(): Ast {
    let a = xor();
    while (peek()?.t === 'or' || peek()?.t === 'nor') { const op = toks[i++].t as Op; a = { k: 'bin', op, a, b: xor() }; }
    return a;
  }
  function xor(): Ast {
    let a = and();
    while (peek()?.t === 'xor' || peek()?.t === 'xnor') { const op = toks[i++].t as Op; a = { k: 'bin', op, a, b: and() }; }
    return a;
  }
  function and(): Ast {
    let a = unary();
    for (;;) {
      const t = peek();
      if (t?.t === 'and' || t?.t === 'nand') { i++; a = { k: 'bin', op: t.t as Op, a, b: unary() }; }
      else if (startsAtom(t)) a = { k: 'bin', op: 'and', a, b: unary() }; // AB = A·B
      else return a;
    }
  }
  function unary(): Ast {
    if (peek()?.t === 'not') { i++; return { k: 'not', a: unary() }; }
    return postfix();
  }
  function postfix(): Ast {
    let a = atom();
    while (peek()?.t === 'post') { i++; a = { k: 'not', a }; }
    return a;
  }
  function atom(): Ast {
    const t = toks[i++];
    if (!t) throw new ParseError('A expressão terminou antes da hora (falta um termo).');
    if (t.t === 'var') return { k: 'var', n: t.s };
    if (t.t === 'const') return { k: 'const', v: t.s === '1' };
    if (t.t === 'lp') {
      const a = iff();
      if (toks[i++]?.t !== 'rp') throw new ParseError('Faltou fechar um parêntese.');
      return a;
    }
    if (t.t === 'rp') throw new ParseError('Há um parêntese fechando sem abrir.');
    throw new ParseError(`O operador "${t.s}" está sem um dos lados.`);
  }
  const ast = iff();
  if (i < toks.length) {
    throw new ParseError(toks[i].t === 'rp' ? 'Há um parêntese fechando sem abrir.' : `Sobrou "${toks[i].s}" no fim da expressão.`);
  }
  return ast;
}

export function tryParse(src: string): { ast?: Ast; error?: string } {
  try { return { ast: parse(src) }; } catch (e) { return { error: (e as Error).message }; }
}

export function vars(ast: Ast, acc = new Set<string>()): string[] {
  if (ast.k === 'var') acc.add(ast.n);
  else if (ast.k === 'not') vars(ast.a, acc);
  else if (ast.k === 'bin') { vars(ast.a, acc); vars(ast.b, acc); }
  return [...acc].sort((x, y) => x.localeCompare(y));
}

export type Env = Record<string, boolean>;

export function applyOp(op: Op, a: boolean, b: boolean): boolean {
  switch (op) {
    case 'and': return a && b;
    case 'or': return a || b;
    case 'xor': return a !== b;
    case 'imp': return !a || b;
    case 'iff': return a === b;
    case 'nand': return !(a && b);
    case 'nor': return !(a || b);
    case 'xnor': return a === b;
  }
}

export function evalAst(ast: Ast, env: Env): boolean {
  switch (ast.k) {
    case 'var': return !!env[ast.n];
    case 'const': return ast.v;
    case 'not': return !evalAst(ast.a, env);
    case 'bin': return applyOp(ast.op, evalAst(ast.a, env), evalAst(ast.b, env));
  }
}

/** Todas as combinações das variáveis. order 'asc' começa em 0 0 0; 'desc' começa em V V V. */
export function envs(vs: string[], order: 'asc' | 'desc' = 'asc'): Env[] {
  const n = vs.length, out: Env[] = [];
  for (let r = 0; r < 1 << n; r++) {
    const idx = order === 'asc' ? r : (1 << n) - 1 - r;
    const env: Env = {};
    vs.forEach((v, j) => { env[v] = !!((idx >> (n - 1 - j)) & 1); });
    out.push(env);
  }
  return out;
}

export function truthTable(ast: Ast, vs = vars(ast), order: 'asc' | 'desc' = 'asc') {
  return envs(vs, order).map((env) => ({ env, value: evalAst(ast, env) }));
}

export function equivalent(a: Ast, b: Ast): { equal: boolean; vars: string[]; diff: Env[] } {
  const vs = [...new Set([...vars(a), ...vars(b)])].sort((x, y) => x.localeCompare(y));
  const diff = envs(vs).filter((e) => evalAst(a, e) !== evalAst(b, e));
  return { equal: diff.length === 0, vars: vs, diff };
}

export type Classe = 'tautologia' | 'contradição' | 'contingência';
export function classify(ast: Ast): Classe {
  const vals = truthTable(ast).map((r) => r.value);
  return vals.every(Boolean) ? 'tautologia' : vals.some(Boolean) ? 'contingência' : 'contradição';
}

export type Notation = 'logica' | 'bool';
const SYM: Record<Notation, Record<Op, string>> = {
  logica: { and: ' ∧ ', or: ' ∨ ', xor: ' ⊕ ', imp: ' → ', iff: ' ↔ ', nand: ' ↑ ', nor: ' ↓ ', xnor: ' ⊙ ' },
  bool: { and: '·', or: ' + ', xor: ' ⊕ ', imp: ' → ', iff: ' ↔ ', nand: ' ↑ ', nor: ' ↓ ', xnor: ' ⊙ ' },
};
const PREC: Record<Op, number> = { iff: 1, imp: 2, or: 3, nor: 3, xor: 4, xnor: 4, and: 5, nand: 5 };

/** Escreve a árvore de volta em texto, na notação pedida. */
export function show(ast: Ast, nt: Notation = 'logica'): string {
  const assoc = (op: Op) => op === 'and' || op === 'or' || op === 'xor';
  const go = (x: Ast, parentPrec: number, parentOp?: Op): string => {
    if (x.k === 'var') return x.n;
    if (x.k === 'const') return nt === 'logica' ? (x.v ? 'V' : 'F') : x.v ? '1' : '0';
    if (x.k === 'not') {
      if (nt === 'bool') return x.a.k === 'bin' ? '(' + go(x.a, 0) + ")'" : go(x.a, 9) + "'";
      return '¬' + (x.a.k === 'bin' ? '(' + go(x.a, 0) + ')' : go(x.a, 9));
    }
    const p = PREC[x.op];
    const s = go(x.a, p, x.op) + SYM[nt][x.op] + go(x.b, p, x.op);
    // Na notação lógica, todo agrupamento aparece com parênteses (é como o curso escreve e evita dúvida).
    // Na booleana vale o costume da álgebra: o produto dentro da soma dispensa parênteses (A·B + C).
    void p; void parentPrec;
    const mesmoGrupo = x.op === parentOp && assoc(x.op);
    const produtoNaSoma = nt === 'bool' && x.op === 'and' && parentOp === 'or';
    const precisa = parentOp !== undefined && !mesmoGrupo && !produtoNaSoma;
    return precisa ? '(' + s + ')' : s;
  };
  return go(ast, 0);
}

/** Subexpressões na ordem em que se calcula (para as colunas intermediárias da tabela). */
export function subexprs(ast: Ast): Ast[] {
  const seen = new Set<string>(), out: Ast[] = [];
  const walk = (x: Ast) => {
    if (x.k === 'var' || x.k === 'const') return;
    if (x.k === 'not') walk(x.a); else { walk(x.a); walk(x.b); }
    const key = show(x);
    if (!seen.has(key)) { seen.add(key); out.push(x); }
  };
  walk(ast);
  return out;
}

/** Conta ocorrências de variáveis (medida simples de "tamanho" para exercícios de simplificação). */
export function literalCount(ast: Ast): number {
  if (ast.k === 'var') return 1;
  if (ast.k === 'const') return 0;
  if (ast.k === 'not') return literalCount(ast.a);
  return literalCount(ast.a) + literalCount(ast.b);
}

/** Soma de produtos a partir das linhas com saída 1. */
export function sumOfProducts(vs: string[], ones: Env[]): string {
  if (!ones.length) return '0';
  return ones.map((e) => vs.map((v) => (e[v] ? v : v + "'")).join('·')).join(' + ');
}

export const bit = (b: boolean) => (b ? 1 : 0);
