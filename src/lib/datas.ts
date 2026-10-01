// Datas como texto "AAAA-MM-DD" no horário local (evita sustos de fuso horário).

export function hoje(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const toUTC = (s: string) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };

/** Quantos dias de `a` até `b` (positivo se b é depois). */
export function diasEntre(a: string, b: string): number {
  return Math.round((toUTC(b) - toUTC(a)) / 86400000);
}

export function somaDias(s: string, n: number): string {
  const d = new Date(toUTC(s) + n * 86400000);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

export function dataBR(s: string): string {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

// ---- Calendário de avaliações (iguais nas duas disciplinas) ----
export type Prova = { id: 'A1' | 'A2' | 'A3' | 'AI'; nome: string; abre: string; fecha: string; pontos: number; resumo: string };

export const PROVAS: Prova[] = [
  { id: 'A1', nome: 'A1 · dissertativa', abre: '2026-11-02', fecha: '2026-11-11', pontos: 30, resumo: '4 h cronometradas. Vale o raciocínio escrito.' },
  { id: 'A3', nome: 'A3 · dissertativa', abre: '2026-11-05', fecha: '2026-12-02', pontos: 40, resumo: 'Sem cronômetro e sem recuperação. A que mais pesa.' },
  { id: 'A2', nome: 'A2 · objetiva', abre: '2026-11-12', fecha: '2026-11-18', pontos: 30, resumo: '5 alternativas, 3 h.' },
  { id: 'AI', nome: 'AI · recuperação', abre: '2026-12-16', fecha: '2026-12-17', pontos: 30, resumo: 'Substitui só a menor entre A1 e A2, e só com 40+ em A1+A3 ou A2+A3.' },
];

export type Situacao = { prova: Prova; estado: 'futura' | 'aberta' | 'encerrada'; dias: number };

/** Para cada prova: quantos dias faltam para abrir (ou para fechar, se já abriu). */
export function situacoes(dia = hoje()): Situacao[] {
  return PROVAS.map((prova) => {
    if (diasEntre(dia, prova.abre) > 0) return { prova, estado: 'futura', dias: diasEntre(dia, prova.abre) };
    if (diasEntre(dia, prova.fecha) >= 0) return { prova, estado: 'aberta', dias: diasEntre(dia, prova.fecha) };
    return { prova, estado: 'encerrada', dias: 0 };
  });
}

export function proximaProva(dia = hoje()): Situacao | undefined {
  return situacoes(dia).filter((s) => s.estado !== 'encerrada').sort((a, b) => (a.estado === 'aberta' ? -1 : 0) - (b.estado === 'aberta' ? -1 : 0) || a.dias - b.dias)[0];
}
