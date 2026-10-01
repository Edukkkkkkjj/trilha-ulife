// Modelo da bancada de circuitos: entradas (chaves), portas e saídas (lâmpadas) ligadas por fios.
import { type Ast, type Env, type Op, applyOp, evalAst, envs, show } from './logic';

export type GateType = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR';
export type NodeType = 'IN' | 'OUT' | GateType;
export type CNode = { id: string; type: NodeType; x: number; y: number; name?: string; on?: boolean };
export type Wire = { from: string; to: string; pin: number };
export type Circuit = { nodes: CNode[]; wires: Wire[] };

export const GATES: GateType[] = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'];
const OPS: Record<Exclude<GateType, 'NOT'>, Op> = { AND: 'and', OR: 'or', NAND: 'nand', NOR: 'nor', XOR: 'xor', XNOR: 'xnor' };

export const nInputs = (t: NodeType) => (t === 'IN' ? 0 : t === 'NOT' || t === 'OUT' ? 1 : 2);
export const hasOutput = (t: NodeType) => t !== 'OUT';

const node = (c: Circuit, id: string) => c.nodes.find((n) => n.id === id);
const source = (c: Circuit, to: string, pin: number) => c.wires.find((w) => w.to === to && w.pin === pin)?.from;

/** Ligar from→to criaria um laço? (o sinal voltaria para a própria porta) */
export function wouldCycle(c: Circuit, from: string, to: string): boolean {
  if (from === to) return true;
  const seen = new Set<string>();
  const reach = (id: string): boolean => {
    if (id === from) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return c.wires.filter((w) => w.from === id).some((w) => reach(w.to));
  };
  return reach(to);
}

/** Valor do sinal na saída de um nó. null = há entrada solta no caminho. */
export function signal(c: Circuit, id: string, env?: Env, memo = new Map<string, boolean | null>()): boolean | null {
  if (memo.has(id)) return memo.get(id)!;
  const n = node(c, id);
  let v: boolean | null;
  if (!n) v = null;
  else if (n.type === 'IN') v = env ? !!env[n.name ?? n.id] : !!n.on;
  else {
    const ins = Array.from({ length: nInputs(n.type) }, (_, p) => { const s = source(c, id, p); return s ? signal(c, s, env, memo) : null; });
    if (ins.some((x) => x === null)) v = null;
    else if (n.type === 'OUT') v = ins[0];
    else if (n.type === 'NOT') v = !ins[0];
    else v = applyOp(OPS[n.type], ins[0]!, ins[1]!);
  }
  memo.set(id, v);
  return v;
}

/** A expressão que o circuito calcula naquele nó. null se houver entrada solta. */
export function exprOf(c: Circuit, id: string): Ast | null {
  const n = node(c, id);
  if (!n) return null;
  if (n.type === 'IN') return { k: 'var', n: n.name ?? n.id };
  const ins = Array.from({ length: nInputs(n.type) }, (_, p) => { const s = source(c, id, p); return s ? exprOf(c, s) : null; });
  if (ins.some((x) => x === null)) return null;
  if (n.type === 'OUT') return ins[0];
  if (n.type === 'NOT') return { k: 'not', a: ins[0]! };
  if (n.type === 'NAND') return { k: 'not', a: { k: 'bin', op: 'and', a: ins[0]!, b: ins[1]! } };
  if (n.type === 'NOR') return { k: 'not', a: { k: 'bin', op: 'or', a: ins[0]!, b: ins[1]! } };
  if (n.type === 'XNOR') return { k: 'not', a: { k: 'bin', op: 'xor', a: ins[0]!, b: ins[1]! } };
  return { k: 'bin', op: OPS[n.type], a: ins[0]!, b: ins[1]! };
}

export const inputs = (c: Circuit) => c.nodes.filter((n) => n.type === 'IN').sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
export const outputs = (c: Circuit) => c.nodes.filter((n) => n.type === 'OUT');
export const gates = (c: Circuit) => c.nodes.filter((n) => n.type !== 'IN' && n.type !== 'OUT');

/** Tabela-verdade de uma saída sobre todas as chaves da bancada. */
export function tableOf(c: Circuit, outId: string) {
  const vs = inputs(c).map((n) => n.name ?? n.id);
  return { vars: vs, rows: envs(vs).map((env) => ({ env, value: signal(c, outId, env) })) };
}

/** Compara a saída com uma expressão-alvo, linha a linha, sobre a união das variáveis. */
export function matches(c: Circuit, outId: string, target: Ast, targetVars: string[]): { ok: boolean; reason?: string; counter?: Env } {
  const e = exprOf(c, outId);
  if (!e) return { ok: false, reason: 'Há uma entrada solta: toda porta precisa de todos os fios, e a lâmpada precisa estar ligada.' };
  const vs = [...new Set([...inputs(c).map((n) => n.name ?? n.id), ...targetVars])].sort();
  for (const env of envs(vs)) if (evalAst(e, env) !== evalAst(target, env)) return { ok: false, counter: env };
  return { ok: true };
}

export function describe(c: Circuit, outId: string): string {
  const e = exprOf(c, outId);
  return e ? show(e, 'bool') : '— (ligue todos os fios)';
}

let seq = 0;
export const newId = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Monta um circuito a partir de uma descrição curta (usado nos exemplos prontos). */
export function build(spec: { ins: string[]; gates: [id: string, type: GateType, ...from: string[]][]; out: string }): Circuit {
  const nodes: CNode[] = [], wires: Wire[] = [];
  spec.ins.forEach((name, k) => nodes.push({ id: name, type: 'IN', name, x: 34, y: 50 + k * 70, on: false }));
  const depth = new Map<string, number>(spec.ins.map((n) => [n, 0]));
  const perCol = new Map<number, number>();
  for (const [id, type, ...from] of spec.gates) {
    const d = Math.max(...from.map((f) => depth.get(f) ?? 0)) + 1;
    depth.set(id, d);
    const row = perCol.get(d) ?? 0; perCol.set(d, row + 1);
    nodes.push({ id, type, x: 34 + d * 84, y: 60 + row * 78 });
    from.forEach((f, pin) => wires.push({ from: f, to: id, pin }));
  }
  const dOut = (depth.get(spec.out) ?? 0) + 1;
  nodes.push({ id: 'S', type: 'OUT', name: 'S', x: Math.min(326, 34 + dOut * 84), y: nodes.find((n) => n.id === spec.out)?.y ?? 100 });
  wires.push({ from: spec.out, to: 'S', pin: 0 });
  return { nodes, wires };
}
