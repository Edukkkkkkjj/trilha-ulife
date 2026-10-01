import { describe, expect, it } from 'vitest';
import { type Ast, classify, envs, equivalent, evalAst, literalCount, parse, ParseError, show, subexprs, sumOfProducts, truthTable, tryParse, vars } from '../lib/logic';
import { rng } from '../lib/rng';

const col = (e: string) => truthTable(parse(e)).map((r) => (r.value ? 1 : 0)).join('');

describe('motor de lógica', () => {
  it('lê as duas notações do curso como a mesma coisa', () => {
    expect(equivalent(parse('p ∨ (q ∧ r)'), parse('p + q·r')).equal).toBe(true);
    expect(equivalent(parse('~(p v ~q)'), parse("(p + q')'")).equal).toBe(true);
    expect(equivalent(parse('(A AND B) OR (NOT A AND C)'), parse("AB + A'C")).equal).toBe(true);
    expect(equivalent(parse('A NAND B'), parse("(AB)'")).equal).toBe(true);
    expect(equivalent(parse('A XNOR B'), parse('A ↔ B')).equal).toBe(true);
  });

  it('respeita a precedência: · antes de +, ¬ antes de tudo, → depois de ∨', () => {
    expect(col('A + B·C')).toBe(col('A + (B·C)'));
    expect(col('A + B·C')).not.toBe(col('(A + B)·C'));
    expect(col('¬p ∧ q')).toBe(col('(¬p) ∧ q'));
    expect(col('p ∨ q → r')).toBe(col('(p ∨ q) → r'));
    expect(col('p → q → r')).toBe(col('p → (q → r)'));
  });

  it('tabelas dos conectivos', () => {
    expect(col('p ∧ q')).toBe('0001');
    expect(col('p ∨ q')).toBe('0111');
    expect(col('p → q')).toBe('1101');
    expect(col('p ↔ q')).toBe('1001');
    expect(col('p ⊕ q')).toBe('0110');
    expect(col('¬p')).toBe('10');
  });

  it('ordem das linhas: asc começa em 000, desc em VVV', () => {
    expect(envs(['p', 'q'])[0]).toEqual({ p: false, q: false });
    expect(envs(['p', 'q'], 'desc')[0]).toEqual({ p: true, q: true });
    expect(envs(['a', 'b', 'c'])).toHaveLength(8);
  });

  it('classifica tautologia, contradição e contingência', () => {
    expect(classify(parse('(p ∧ (p → q)) → q'))).toBe('tautologia');
    expect(classify(parse('p ∧ ¬p'))).toBe('contradição');
    expect(classify(parse('p → q'))).toBe('contingência');
  });

  it('leis booleanas ensinadas na M2', () => {
    const leis: [string, string][] = [
      ['x + 0', 'x'], ['x·1', 'x'], ['x + 1', '1'], ['x·0', '0'], ['x + x', 'x'], ['x·x', 'x'], ["x + x'", '1'], ["x·x'", '0'],
      ['x·(y + z)', 'x·y + x·z'], ['x + y·z', '(x + y)·(x + z)'], ['x + x·y', 'x'], ["(x·y)'", "x' + y'"], ["(x + y)'", "x'·y'"],
      ['p → q', '¬p ∨ q'], ['p → q', '¬q → ¬p'],
    ];
    for (const [a, b] of leis) expect(equivalent(parse(a), parse(b)).equal, `${a} ≡ ${b}`).toBe(true);
    expect(equivalent(parse('p → q'), parse('q → p')).equal).toBe(false);
  });

  it('escrever e reler dá a mesma função (200 expressões aleatórias, nas duas notações)', () => {
    const r = rng(42);
    const gera = (d: number): Ast => {
      if (d === 0 || r.bool(0.25)) return { k: 'var', n: r.pick(['p', 'q', 'r']) };
      if (r.bool(0.25)) return { k: 'not', a: gera(d - 1) };
      return { k: 'bin', op: r.pick(['and', 'or', 'xor', 'imp', 'iff', 'nand', 'nor'] as const), a: gera(d - 1), b: gera(d - 1) };
    };
    for (let i = 0; i < 200; i++) {
      const a = gera(4);
      for (const nt of ['logica', 'bool'] as const) expect(equivalent(a, parse(show(a, nt))).equal, show(a, nt)).toBe(true);
    }
  });

  it('mensagens de erro em português', () => {
    expect(() => parse('')).toThrow(ParseError);
    expect(tryParse('(p ∧ q').error).toMatch(/parêntese/);
    expect(tryParse('p ∧').error).toBeTruthy();
    expect(tryParse('p # q').error).toMatch(/símbolo/);
  });

  it('subexpressões, variáveis, contagem e soma de produtos', () => {
    expect(subexprs(parse('p ∨ (q ∧ r)')).map((s) => show(s))).toEqual(['q ∧ r', 'p ∨ (q ∧ r)']);
    expect(vars(parse('(B ∧ C ∧ R) ∨ E'))).toEqual(['B', 'C', 'E', 'R']);
    expect(literalCount(parse("A·B + A·B'"))).toBe(4);
    const xor = parse('A ⊕ B');
    const sop = sumOfProducts(['A', 'B'], truthTable(xor).filter((x) => x.value).map((x) => x.env));
    expect(equivalent(parse(sop), xor).equal).toBe(true);
    expect(evalAst(parse('1 + 1·0'), {})).toBe(true);
  });
});
