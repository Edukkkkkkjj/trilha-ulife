// Indução, recorrência e o modelo do caso Aegis-Grid (U8).

// ---------- afirmações para testar caso a caso (dominós) ----------
export const primo = (n: number) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
export type Afirmacao = { id: string; texto: string; vale: (n: number) => boolean; mostra: (n: number) => string; nota: string };
export const AFIRMACOES: Afirmacao[] = [
  { id: 'soma', texto: '1 + 2 + … + n = n(n + 1)/2', vale: (n) => (n * (n + 1)) / 2 === Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a + b, 0), mostra: (n) => `soma = ${(n * (n + 1)) / 2}; fórmula = ${n}·${n + 1}/2 = ${(n * (n + 1)) / 2}`, nota: 'Verdadeira para todo n ≥ 1, e a indução prova isso.' },
  { id: 'impares', texto: 'a soma dos n primeiros ímpares é n²', vale: () => true, mostra: (n) => `${Array.from({ length: Math.min(n, 5) }, (_, i) => 2 * i + 1).join(' + ')}${n > 5 ? ' + …' : ''} = ${n * n} = ${n}²`, nota: 'Verdadeira para todo n ≥ 1.' },
  { id: 'pot', texto: '2ⁿ > n²', vale: (n) => 2 ** n > n * n, mostra: (n) => `2^${n} = ${2 ** n}; ${n}² = ${n * n}`, nota: 'Falha em n = 2, 3 e 4, e vale de n = 5 em diante. A base da indução nem sempre é o 1.' },
  { id: 'primos', texto: 'n² + n + 41 é sempre primo', vale: (n) => primo(n * n + n + 41), mostra: (n) => `${n}² + ${n} + 41 = ${n * n + n + 41}${primo(n * n + n + 41) ? ' (primo)' : n === 40 ? ' = 41 × 41' : n === 41 ? ' = 41 × 43' : ' (não é primo)'}`, nota: 'Vale para n de 1 a 39 e FALHA em n = 40. Testar muitos casos não prova nada.' },
];

// ---------- recorrências ----------
/** a(1) = a1; a(n) = m·a(n−1) + c */
export function recorrencia(a1: number, m: number, c: number, n: number): number { let a = a1; for (let i = 2; i <= n; i++) a = m * a + c; return a; }
export const hanoi = (n: number) => 2 ** n - 1;
export const fib = (n: number): number => { let a = 1, b = 1; for (let i = 3; i <= n; i++) [a, b] = [b, a + b]; return n <= 0 ? 0 : b; };

// ---------- Aegis-Grid ----------
export type Aegis = { P: boolean; P2: boolean; Q: boolean; R: boolean; T: boolean; reserva: boolean; rota3: boolean; pp: number; pq: number; pr: number };
/** O sistema falha se o servidor falha (com reserva: se os dois falham) OU se todas as rotas críticas falham. */
export const servidorCai = (s: Aegis) => (s.reserva ? s.P && s.P2 : s.P);
export const rotasCaem = (s: Aegis) => s.Q && s.R && (s.rota3 ? s.T : true);
export const falha = (s: Aegis) => servidorCai(s) || rotasCaem(s);
export const variaveis = (s: Aegis) => ['P', ...(s.reserva ? ['P2'] : []), 'Q', 'R', ...(s.rota3 ? ['T'] : [])] as ('P' | 'P2' | 'Q' | 'R' | 'T')[];
export const expressao = (s: Aegis) => `S = ${s.reserva ? 'P·P₂' : 'P'} + Q·R${s.rota3 ? '·T' : ''}`;
/** Todas as combinações (0 = funciona, 1 = falha), com a saída S. */
export function tabela(s: Aegis): { ent: number[]; S: number }[] {
  const vs = variaveis(s), linhas = [];
  for (let i = 0; i < 2 ** vs.length; i++) {
    const ent = vs.map((_, k) => (i >> (vs.length - 1 - k)) & 1), t: Aegis = { ...s };
    vs.forEach((v, k) => { t[v] = !!ent[k]; });
    linhas.push({ ent, S: falha(t) ? 1 : 0 });
  }
  return linhas;
}
/** Risco total supondo falhas independentes: 1 − P(servidor ok)·P(rotas ok). O reserva tem a mesma chance do principal; a rota 3, a da rota 2. */
export function risco(s: Aegis): { serv: number; rotas: number; total: number } {
  const serv = s.reserva ? s.pp * s.pp : s.pp, rotas = s.pq * s.pr * (s.rota3 ? s.pr : 1);
  return { serv, rotas, total: 1 - (1 - serv) * (1 - rotas) };
}
