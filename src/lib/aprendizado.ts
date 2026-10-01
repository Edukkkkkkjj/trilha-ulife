// Três modelos de brinquedo para a camada C3: uma reta que aprende (minimizar erro), um filtro de spam
// (regra × modelo aprendido) e um gerador de texto por "próxima palavra mais provável".

// ---------- 1. reta que aprende ----------
/** Horas de uso de um servidor (x) e energia gasta (y). Mais ou menos y = 2x + 1, com ruído. */
export const PONTOS: [number, number][] = [[1, 3.2], [2, 4.6], [3, 7.4], [4, 8.7], [5, 11.3], [6, 12.6], [7, 15.5], [8, 16.8]];
/** Um ponto muito fora do padrão (medição errada, ou um caso raro). */
export const ESTRANHO: [number, number] = [2, 16];
export const dados = (comEstranho: boolean) => (comEstranho ? [...PONTOS, ESTRANHO] : PONTOS);
/** Erro quadrático médio da reta y = a·x + b. */
export const erro = (a: number, b: number, pts: [number, number][]) => pts.reduce((t, [x, y]) => t + (a * x + b - y) ** 2, 0) / pts.length;
/** Um passo de treino (descida do gradiente): mexe a e b um pouquinho na direção que diminui o erro. */
export function passo(a: number, b: number, pts: [number, number][], taxa = 0.02): [number, number] {
  let ga = 0, gb = 0;
  for (const [x, y] of pts) { const e = a * x + b - y; ga += 2 * e * x; gb += 2 * e; }
  return [a - (taxa * ga) / pts.length, b - (taxa * gb) / pts.length];
}
/** A melhor reta possível (mínimos quadrados), para comparar. */
export function melhorReta(pts: [number, number][]): [number, number] {
  const n = pts.length, sx = pts.reduce((t, p) => t + p[0], 0), sy = pts.reduce((t, p) => t + p[1], 0), sxx = pts.reduce((t, p) => t + p[0] * p[0], 0), sxy = pts.reduce((t, p) => t + p[0] * p[1], 0);
  const a = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return [a, (sy - a * sx) / n];
}

// ---------- 2. filtro de spam: regra × modelo ----------
export type Msg = { id: string; texto: string; palavras: string[]; spam: boolean };
export const PALAVRAS = ['grátis', 'promoção', 'urgente', 'clique', 'pix', 'reunião'];
export const TREINO: Msg[] = [
  { id: 't1', texto: 'Promoção: celular grátis, clique aqui', palavras: ['promoção', 'grátis', 'clique'], spam: true },
  { id: 't2', texto: 'Urgente: clique para liberar seu prêmio', palavras: ['urgente', 'clique'], spam: true },
  { id: 't3', texto: 'Reunião do louvor na quinta', palavras: ['reunião'], spam: false },
  { id: 't4', texto: 'Grátis! Promoção só hoje', palavras: ['grátis', 'promoção'], spam: true },
  { id: 't5', texto: 'Urgente: reunião da diretoria mudou de sala', palavras: ['urgente', 'reunião'], spam: false },
  { id: 't6', texto: 'Segue o pix do almoço, obrigado', palavras: ['pix'], spam: false },
];
export const TESTE: Msg[] = [
  { id: 'e1', texto: 'Clique e ganhe um curso grátis', palavras: ['clique', 'grátis'], spam: true },
  { id: 'e2', texto: 'Reunião urgente amanhã cedo', palavras: ['reunião', 'urgente'], spam: false },
  { id: 'e3', texto: 'Pix premiado: clique para receber', palavras: ['pix', 'clique'], spam: true },
  { id: 'e4', texto: 'Mandei o pix da cantina', palavras: ['pix'], spam: false },
];
/** Regra escrita por gente: é spam se contém qualquer uma das palavras escolhidas. */
export const porRegra = (m: Msg, escolhidas: string[]) => m.palavras.some((p) => escolhidas.includes(p));
/** Modelo aprendido: cada palavra ganha um peso = (vezes em spam) − (vezes em mensagem boa), contado nos exemplos rotulados. */
export function pesos(exemplos: { m: Msg; rotulo: boolean }[]): Record<string, number> {
  const w: Record<string, number> = Object.fromEntries(PALAVRAS.map((p) => [p, 0]));
  for (const { m, rotulo } of exemplos) for (const p of m.palavras) w[p] += rotulo ? 1 : -1;
  return w;
}
export const porModelo = (m: Msg, w: Record<string, number>) => m.palavras.reduce((t, p) => t + (w[p] ?? 0), 0) > 0;
export const acertos = (msgs: Msg[], f: (m: Msg) => boolean) => msgs.filter((m) => f(m) === m.spam).length;

// ---------- 3. gerador de texto ----------
export const CORPORA: { nome: string; frases: string[] }[] = [
  { nome: 'Igreja', frases: ['o louvor começa às sete', 'o louvor termina às nove', 'o pastor prega às oito', 'o pastor ora pela igreja', 'a igreja canta o louvor', 'a igreja ora pelo pastor'] },
  { nome: 'Tecnologia', frases: ['o servidor guarda os dados', 'o servidor caiu às nove', 'a rede liga o servidor', 'a rede caiu às sete', 'os dados passam pela rede', 'o modelo aprende com os dados'] },
];
export const FIM = '.';
/** Conta, para cada palavra, quais palavras vieram logo depois dela no texto de treino. */
export function bigramas(frases: string[]): Record<string, Record<string, number>> {
  const t: Record<string, Record<string, number>> = {};
  for (const f of frases) {
    const ps = [...f.split(' '), FIM];
    for (let i = 0; i < ps.length - 1; i++) { t[ps[i]] ??= {}; t[ps[i]][ps[i + 1]] = (t[ps[i]][ps[i + 1]] ?? 0) + 1; }
  }
  return t;
}
/** Próximas palavras possíveis depois de `palavra`, com probabilidade, da mais provável para a menos. */
export function proximas(t: Record<string, Record<string, number>>, palavra: string): { p: string; prob: number }[] {
  const o = t[palavra] ?? {}, tot = Object.values(o).reduce((a, b) => a + b, 0);
  return Object.entries(o).map(([p, n]) => ({ p, prob: n / tot })).sort((a, b) => b.prob - a.prob || a.p.localeCompare(b.p));
}
export const inicios = (frases: string[]) => [...new Set(frases.map((f) => f.split(' ')[0]))].sort();
