// Correção de exercícios: tudo conferido por código, nunca "de cabeça".
import type { Ex, Resultado } from './types';
import { evalSetExpr, parseSetList, regionsOf, sameSet, SetParseError } from '../lib/sets';
import { equivalent, literalCount, parse, ParseError, show, subexprs, truthTable, vars, envs, evalAst, type Ast } from '../lib/logic';

/** Lê número digitado à brasileira: "0,62", "1/3", "25%", "1.000". */
export function lerNumero(src: string): number | null {
  let s = src.trim().replace(/\s/g, '');
  if (!s) return null;
  let pct = false;
  if (s.endsWith('%')) { pct = true; s = s.slice(0, -1); }
  const one = (t: string): number | null => {
    if (/^-?[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, '');
    t = t.replace(',', '.');
    return /^-?(\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : null;
  };
  let v: number | null;
  if (s.includes('/')) {
    const [a, b, ...rest] = s.split('/');
    const x = one(a), y = one(b);
    v = rest.length || x === null || y === null || y === 0 ? null : x / y;
  } else v = one(s);
  return v === null ? null : pct ? v / 100 : v;
}

const perto = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol + 1e-9;
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10000) / 10000).replace('.', ','));

export type Resposta = number | number[] | string | number[][];

export function corrigir(ex: Ex, resp: Resposta): Resultado {
  switch (ex.kind) {
    case 'mcq': {
      const i = resp as number;
      const ok = i === ex.correct;
      const msg = ex.porOpcao?.[i];
      return { ok, given: ex.options[i] ?? '—', expected: ex.options[ex.correct], diag: !ok && msg ? { causa: 'conceito', msg } : undefined };
    }
    case 'multi': {
      const sel = [...(resp as number[])].sort();
      const cor = [...ex.correct].sort();
      const ok = sel.length === cor.length && sel.every((x, k) => x === cor[k]);
      const faltou = cor.filter((x) => !sel.includes(x)).length, sobrou = sel.filter((x) => !cor.includes(x)).length;
      return {
        ok, given: sel.map((k) => ex.options[k]).join(' · ') || '—', expected: cor.map((k) => ex.options[k]).join(' · '),
        diag: ok ? undefined : { causa: 'leitura', msg: `${faltou ? `Faltou marcar ${faltou}. ` : ''}${sobrou ? `Marcou ${sobrou} a mais. ` : ''}Aqui há mais de uma correta.` },
      };
    }
    case 'num': {
      const v = lerNumero(resp as string);
      const tol = ex.tol ?? 0;
      const expected = fmt(ex.answer) + (ex.unidade ? ' ' + ex.unidade : '');
      if (v === null) return { ok: false, given: String(resp), expected, diag: { causa: 'leitura', msg: 'Não consegui ler isso como número. Use algo como 12, 0,62 ou 1/3.' } };
      if (perto(v, ex.answer, tol)) return { ok: true, given: fmt(v), expected };
      const arm = ex.armadilhas?.find((a) => perto(v, a.valor, tol));
      if (!arm && perto(v * 100, ex.answer, tol * 100) ) return { ok: false, given: fmt(v), expected, diag: { causa: 'leitura', msg: 'Parece que você respondeu em fração de 1 e a pergunta pedia em porcentagem (ou o contrário).' } };
      return { ok: false, given: fmt(v), expected, diag: arm && { causa: arm.causa, msg: arm.msg } };
    }
    case 'set': {
      const v = parseSetList(resp as string);
      const expected = ex.answer.length ? `{${ex.answer.join(', ')}}` : '∅ (vazio)';
      const given = v.length ? `{${v.join(', ')}}` : '∅ (vazio)';
      if (sameSet(v, ex.answer)) return { ok: true, given, expected };
      const arm = ex.armadilhas?.find((a) => sameSet(v, a.valor));
      return { ok: false, given, expected, diag: arm && { causa: arm.causa, msg: arm.msg } };
    }
    case 'expr': {
      let a: Ast;
      const alvo = parse(ex.target);
      try { a = parse(resp as string); } catch (e) {
        return { ok: false, given: String(resp), expected: ex.target, diag: { causa: 'leitura', msg: e instanceof ParseError ? e.message : 'Não consegui ler a expressão.' } };
      }
      const eq = equivalent(a, alvo);
      const given = show(a, 'bool');
      if (!eq.equal) {
        const arm = ex.armadilhas?.find((x) => equivalent(a, parse(x.valor)).equal);
        const e = eq.diff[0];
        const linha = eq.vars.map((v) => `${v}=${e[v] ? 1 : 0}`).join(', ');
        return { ok: false, given, expected: ex.target, diag: arm ? { causa: arm.causa, msg: arm.msg } : { causa: 'conceito', msg: `Não é equivalente. Teste ${linha}: a sua dá ${evalAst(a, e) ? 1 : 0}, a certa dá ${evalAst(alvo, e) ? 1 : 0}.` } };
      }
      if (ex.maxLits !== undefined && literalCount(a) > ex.maxLits) {
        return { ok: false, given, expected: ex.target, diag: { causa: 'conceito', msg: `Está equivalente, mas ainda dá para enxugar: use no máximo ${ex.maxLits} ${ex.maxLits === 1 ? 'variável' : 'variáveis'} na expressão.` } };
      }
      return { ok: true, given, expected: ex.target };
    }
    case 'venn': {
      const sel = [...(resp as number[])].sort();
      let alvo: number[];
      try { alvo = regionsOf(evalSetExpr(ex.target, ex.n), ex.n); } catch (e) { throw e instanceof SetParseError ? e : e; }
      const ok = sel.length === alvo.length && sel.every((x, k) => x === alvo[k]);
      const amais = sel.filter((r) => !alvo.includes(r)).length, faltam = alvo.filter((r) => !sel.includes(r)).length;
      return { ok, given: `${sel.length} região(ões) pintada(s)`, expected: ex.target, diag: ok ? undefined : { causa: 'conceito', msg: `${amais ? `Você pintou ${amais} região(ões) que não fazem parte. ` : ''}${faltam ? `Faltou pintar ${faltam}. ` : ''}Leia a expressão de dentro dos parênteses para fora.` } };
    }
    case 'classificar': {
      const r = resp as number[];
      const erradas = ex.itens.filter((it, k) => r[k] !== it.cat);
      return {
        ok: erradas.length === 0, given: `${ex.itens.length - erradas.length} de ${ex.itens.length} certas`, expected: 'todas certas',
        diag: erradas.length ? { causa: 'conceito', msg: `Reveja: “${erradas[0].texto}” é ${ex.categorias[erradas[0].cat]}.${erradas[0].porque ? ' ' + erradas[0].porque : ''}` } : undefined,
      };
    }
    case 'tabela': {
      const cols = resp as number[][]; // uma coluna por subexpressão; 1/0/-1(vazio)
      const r = corrigirTabela(ex.expr, ex.ordem, cols);
      return { ok: r.ok, given: r.ok ? 'tabela correta' : `erro na coluna ${r.primeiraErrada}`, expected: 'todas as colunas corretas', diag: r.ok ? undefined : { causa: 'conta', msg: r.msg } };
    }
    case 'passos': {
      const r = resp as number[]; // 1 = acertou aquele passo
      const ok = r.every((x) => x === 1);
      return { ok, given: `${r.filter((x) => x === 1).length} de ${r.length} passos`, expected: 'todos os passos' };
    }
  }
}

/** Colunas que o aluno preenche na tabela-verdade: uma por subexpressão, na ordem de cálculo. */
export function colunasDaTabela(expr: string, ordem: 'asc' | 'desc') {
  const ast = parse(expr);
  const vs = vars(ast);
  const linhas = envs(vs, ordem);
  const subs = subexprs(ast);
  return { vs, linhas, subs, gabarito: subs.map((s) => linhas.map((e) => (evalAst(s, e) ? 1 : 0))) };
}

export function corrigirTabela(expr: string, ordem: 'asc' | 'desc', cols: number[][]) {
  const { subs, gabarito, linhas, vs } = colunasDaTabela(expr, ordem);
  const erros = gabarito.map((col, c) => col.map((v, l) => (cols[c]?.[l] === v ? -1 : l)).filter((l) => l >= 0));
  const c = erros.findIndex((e) => e.length > 0);
  if (c < 0) return { ok: true, erros, primeiraErrada: '', msg: '' };
  const l = erros[c][0];
  const env = linhas[l];
  const vazia = cols[c]?.[l] === undefined || cols[c][l] < 0;
  const nome = show(subs[c]);
  const onde = vs.map((v) => `${v}=${env[v] ? 'V' : 'F'}`).join(', ');
  return {
    ok: false, erros, primeiraErrada: nome,
    msg: vazia ? `A coluna “${nome}” ainda tem célula vazia.` : `Coluna “${nome}”, linha ${onde}: o certo é ${gabarito[c][l] ? 'V (1)' : 'F (0)'}. Confira essa coluna antes de seguir para a próxima.`,
  };
}

/** Nota de um exercício: leva em conta dicas usadas e se acertou de primeira. */
export function nota(acertouDePrimeira: boolean, acertouDepois: boolean, dicas: number): number {
  const porDica = [1, 0.85, 0.65, 0.35][Math.min(3, Math.max(0, dicas))];
  if (acertouDePrimeira) return porDica;
  if (acertouDepois) return Math.round(porDica * 50) / 100;
  return 0;
}

export { truthTable };
