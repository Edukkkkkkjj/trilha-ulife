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
  { id: 'A1', nome: 'A1 · dissertativa', abre: '2026-11-02', fecha: '2026-11-11', pontos: 30, resumo: 'Só U1 a U4. 4 h cronometradas. Vale o raciocínio escrito.' },
  { id: 'A3', nome: 'A3 · dissertativa', abre: '2026-11-05', fecha: '2026-12-02', pontos: 40, resumo: 'Tudo. Sem cronômetro e sem segunda oportunidade. A que mais pesa.' },
  { id: 'A2', nome: 'A2 · objetiva', abre: '2026-11-12', fecha: '2026-11-18', pontos: 30, resumo: 'Tudo. 12 questões, 5 alternativas, 3 h.' },
  { id: 'AI', nome: 'AI · recuperação', abre: '2026-12-16', fecha: '2026-12-17', pontos: 30, resumo: 'Substitui só a menor entre A1 e A2, e só com 40+ em A1+A3 ou A2+A3.' },
];

/** Regras do regulamento 2026.2, em linguagem simples (cartão "Regras da prova"). */
export const REGRAS_PROVA: { prova: string; linhas: string[] }[] = [
  { prova: 'A1 · 02/11 a 11/11', linhas: ['Cobra só a **U1 a U4** (até a metade do material).', 'Dissertativa: uma ou mais questões, 4 horas.', 'Segunda oportunidade: 01/12 a 03/12, automática para quem **não iniciou**.', 'Recursos: 18/11 a 20/11.'] },
  { prova: 'A2 · 12/11 a 18/11', linhas: ['Cobra **tudo**: 12 questões objetivas, 5 alternativas, 3 horas.', 'Nota = 30 ÷ 12 × acertos, ou seja, **2,5 pontos por questão**.', 'O gabarito sai 30 minutos depois do fechamento.', 'Segunda oportunidade: 08/12 a 10/12.', 'Recursos: 19/11 a 22/11.'] },
  { prova: 'A3 · 05/11 a 02/12', linhas: ['Cobra **tudo**, dissertativa, sem cronômetro.', '**Sem segunda oportunidade.** Vale 40 pontos.'] },
  { prova: 'AI · 16/12 e 17/12', linhas: ['Só para quem tem **40 ou mais** em A1+A3 ou em A2+A3.', 'Substitui a menor nota entre A1 e A2.'] },
  { prova: 'Antes de clicar em "Iniciar" na prova real', linhas: ['O tempo começa no clique e não volta. Só inicie quando for fazer de verdade.'] },
];

/** Em que prova o estudo deve focar hoje: a A1 até o último dia dela, depois a A2 (tudo) e, passada a A2, a A3 (tudo). */
export type Foco = 'A1' | 'A2' | 'A3';
export const FOCO_AGORA: Record<Foco, { ate: string; meta: string; quer: string }> = {
  A1: { ate: '2026-11-11', meta: '2026-11-09', quer: 'só o que cai na A1 (U1 a U4)' },
  A2: { ate: '2026-11-18', meta: '2026-11-16', quer: 'tudo, para a A2' },
  A3: { ate: '2026-12-02', meta: '2026-11-30', quer: 'tudo, para a A3' },
};
export function focoDoDia(dia = hoje()): Foco {
  if (diasEntre(dia, FOCO_AGORA.A1.ate) >= 0) return 'A1';
  if (diasEntre(dia, FOCO_AGORA.A2.ate) >= 0) return 'A2';
  return 'A3';
}

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
