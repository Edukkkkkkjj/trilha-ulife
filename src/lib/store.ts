// Salvamento do progresso.
// - Salva sozinho a cada ação, no armazenamento do navegador (localStorage).
// - O formato tem número de versão; ao abrir um save antigo, ele é convertido (migração)
//   e uma cópia do original fica guardada, para nunca perder nada numa atualização do jogo.
// - Exporta e importa um arquivo JSON (backup e troca PC ↔ celular).
import { useSyncExternalStore } from 'react';
import type { Causa, Mundo } from '../engine/types';
import { type CardState, revisar } from './leitner';
import { hoje } from './datas';

export const VERSAO = 2;
export const CHAVE = 'trilha-ulife';

export type ErroReg = {
  id: string; exId: string; faseId: string; topic: string; em: string;
  prompt: string; dada: string; certa: string; explica: string;
  causa?: Causa; msg?: string; resolvido: boolean; gen?: { gen: string; seed: number; nivel?: number };
};
export type Nota = { id: string; em: string; faseId?: string; tag: 'duvida' | 'erro' | 'estalo' | 'explico' | 'livre'; texto: string };

export type Estado = {
  v: number;
  criadoEm: string;
  fases: Record<string, { feita: boolean; melhor: number; em: string; vezes: number }>;
  andamento: Record<string, number>;                       // fase → passo em que parei
  topicos: Record<string, { ok: number; total: number }>;  // domínio por tópico
  erros: ErroReg[];
  cards: Record<string, CardState>;
  xp: number;
  medalhas: string[];
  diario: Nota[];
  a3: Record<Mundo, Record<string, string>>;
  tema: 'auto' | 'claro' | 'escuro';
  ultima: string;          // última tela (para "continuar de onde parei")
  ultimoBackup: string | null;
  ultimaVisita: string;
  brinquedos: Record<string, unknown>; // estado salvo das ilustrações em modo livre
  liberadas: string[];     // regiões abertas antes da hora, por escolha sua
  dias: string[];          // dias em que você estudou (sem cobrança de sequência)
};

export function estadoInicial(dia = hoje()): Estado {
  return {
    v: VERSAO, criadoEm: dia, fases: {}, andamento: {}, topicos: {}, erros: [], cards: {}, xp: 0, medalhas: [],
    diario: [], a3: { mat: {}, exp: {} }, tema: 'auto', ultima: '', ultimoBackup: null, ultimaVisita: dia,
    brinquedos: {}, liberadas: [], dias: [],
  };
}

// ---------- migrações ----------
// Cada função leva o save de uma versão para a seguinte. Nunca apague uma: saves antigos passam por todas.
type Migracao = (antigo: any) => any;
const MIGRACOES: Record<number, Migracao> = {
  // v0 = formato do "Caderno de Matemática" antigo: { done, ex, diario: "texto", ts }
  0: (a) => {
    const dia = a.ts ? hoje(new Date(a.ts)) : hoje();
    const novo = estadoInicial(dia) as any;
    novo.v = 1;
    if (typeof a.diario === 'string' && a.diario.trim()) {
      novo.diario = [{ id: 'importado-caderno', em: dia, tag: 'livre', texto: a.diario.trim() }];
    }
    delete novo.dias; delete novo.liberadas; // esses campos só nascem na v2
    return novo;
  },
  // v1 → v2: entram "dias estudados" e "regiões liberadas".
  1: (a) => ({ ...a, v: 2, dias: Array.isArray(a.dias) ? a.dias : [], liberadas: Array.isArray(a.liberadas) ? a.liberadas : [] }),
};

/** Converte qualquer save conhecido para a versão atual. Lança erro se for de uma versão do futuro. */
export function migrar(bruto: any): Estado {
  if (!bruto || typeof bruto !== 'object') throw new Error('Arquivo de progresso inválido.');
  let s = bruto;
  let v = typeof s.v === 'number' ? s.v : 0;
  if (v > VERSAO) throw new Error(`Este progresso é de uma versão mais nova do jogo (v${v}). Atualize o jogo antes de importar.`);
  while (v < VERSAO) {
    const m = MIGRACOES[v];
    if (!m) throw new Error(`Não sei converter progresso da versão ${v}.`);
    s = m(s);
    v = s.v;
  }
  // Completa campos que faltem (defesa contra arquivo editado à mão).
  const base = estadoInicial(s.criadoEm ?? hoje());
  return { ...base, ...s, a3: { mat: { ...(s.a3?.mat ?? {}) }, exp: { ...(s.a3?.exp ?? {}) } }, v: VERSAO };
}

// ---------- armazenamento ----------
export type Armazem = { getItem(k: string): string | null; setItem(k: string, v: string): void };

export function memoria(inicial: Record<string, string> = {}): Armazem & { dados: Record<string, string> } {
  const dados = { ...inicial };
  return { dados, getItem: (k) => (k in dados ? dados[k] : null), setItem: (k, v) => { dados[k] = v; } };
}

export type Arquivo = { app: 'trilha-ulife'; v: number; exportadoEm: string; estado: Estado };

export function criarLoja(armazem: Armazem, relogio: () => string = hoje) {
  let aviso: string | null = null;

  function carregar(): Estado {
    let txt: string | null = null;
    try { txt = armazem.getItem(CHAVE); } catch { /* navegador sem armazenamento: segue em memória */ }
    if (!txt) return estadoInicial(relogio());
    try {
      const bruto = JSON.parse(txt);
      const v = typeof bruto.v === 'number' ? bruto.v : 0;
      if (v !== VERSAO) { try { armazem.setItem(`${CHAVE}:antes-da-v${VERSAO}`, txt); } catch { /* sem espaço */ } }
      return migrar(bruto);
    } catch (e) {
      // Nunca descarta em silêncio: guarda o texto original para recuperação manual.
      try { armazem.setItem(`${CHAVE}:nao-lido`, txt); } catch { /* sem espaço */ }
      aviso = 'Não consegui ler o progresso salvo. Guardei uma cópia do original e comecei um novo. Se você tem um backup, importe em Ajustes.';
      return estadoInicial(relogio());
    }
  }

  let estado = carregar();
  const ouvintes = new Set<() => void>();

  function gravar() {
    try { armazem.setItem(CHAVE, JSON.stringify(estado)); }
    catch { aviso = 'O navegador não deixou salvar (armazenamento cheio ou bloqueado). Exporte um backup em Ajustes.'; }
  }
  function mudar(fn: (s: Estado) => void) {
    const novo: Estado = JSON.parse(JSON.stringify(estado));
    fn(novo);
    estado = novo;
    gravar();
    ouvintes.forEach((f) => f());
  }
  const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const marcarDia = (s: Estado) => { const d = relogio(); if (!s.dias.includes(d)) s.dias.push(d); };

  return {
    get: () => estado,
    aviso: () => aviso,
    limparAviso: () => { aviso = null; },
    assinar: (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f); }; },

    registrarExercicio(topic: string, score: number) {
      mudar((s) => {
        const t = (s.topicos[topic] ??= { ok: 0, total: 0 });
        t.total += 1; t.ok += score;
        marcarDia(s);
      });
    },
    registrarErro(e: Omit<ErroReg, 'id' | 'em' | 'resolvido'>) {
      mudar((s) => {
        const ja = s.erros.find((x) => x.exId === e.exId && !x.resolvido);
        if (ja) Object.assign(ja, e, { em: relogio() });
        else s.erros.unshift({ ...e, id: uid(), em: relogio(), resolvido: false });
      });
    },
    definirCausa(id: string, causa: Causa) { mudar((s) => { const e = s.erros.find((x) => x.id === id); if (e) e.causa = causa; }); },
    resolverErro(id: string) { mudar((s) => { const e = s.erros.find((x) => x.id === id); if (e) e.resolvido = true; }); },
    resolverPorExercicio(exId: string) { mudar((s) => { s.erros.forEach((e) => { if (e.exId === exId) e.resolvido = true; }); }); },

    guardarAndamento(faseId: string, passo: number) { mudar((s) => { s.andamento[faseId] = passo; }); },
    concluirFase(faseId: string, score: number, xp: number) {
      mudar((s) => {
        const f = (s.fases[faseId] ??= { feita: false, melhor: 0, em: relogio(), vezes: 0 });
        const primeira = !f.feita;
        f.feita = true; f.vezes += 1; f.em = relogio(); f.melhor = Math.max(f.melhor, score);
        s.xp += primeira ? xp : Math.round(xp / 4);
        delete s.andamento[faseId];
        marcarDia(s);
      });
    },
    darMedalha(id: string) { mudar((s) => { if (!s.medalhas.includes(id)) s.medalhas.push(id); }); },
    liberar(regiao: string) { mudar((s) => { if (!s.liberadas.includes(regiao)) s.liberadas.push(regiao); }); },

    revisarCard(id: string, acertou: boolean) {
      mudar((s) => { s.cards[id] = revisar(s.cards[id], acertou, relogio()); s.xp += acertou ? 2 : 1; marcarDia(s); });
    },

    anotar(n: Omit<Nota, 'id' | 'em'>) { mudar((s) => { s.diario.unshift({ ...n, id: uid(), em: relogio() }); }); },
    editarNota(id: string, texto: string) { mudar((s) => { const n = s.diario.find((x) => x.id === id); if (n) n.texto = texto; }); },
    apagarNota(id: string) { mudar((s) => { s.diario = s.diario.filter((x) => x.id !== id); }); },
    escreverA3(mundo: Mundo, item: string, texto: string) { mudar((s) => { s.a3[mundo][item] = texto; }); },

    definirTema(t: Estado['tema']) { mudar((s) => { s.tema = t; }); },
    lembrarTela(rota: string) { if (estado.ultima !== rota) mudar((s) => { s.ultima = rota; }); },
    registrarVisita() { const d = relogio(); if (estado.ultimaVisita !== d) mudar((s) => { s.ultimaVisita = d; }); },
    guardarBrinquedo(id: string, dados: unknown) { mudar((s) => { s.brinquedos[id] = dados; }); },

    exportar(): string {
      mudar((s) => { s.ultimoBackup = relogio(); });
      const arq: Arquivo = { app: 'trilha-ulife', v: VERSAO, exportadoEm: new Date().toISOString(), estado };
      return JSON.stringify(arq, null, 2);
    },
    /** Lê um arquivo exportado. Lança erro com mensagem clara se não for um backup válido. */
    importar(texto: string) {
      let arq: any;
      try { arq = JSON.parse(texto); } catch { throw new Error('Este arquivo não é um backup da Trilha (não consegui ler o JSON).'); }
      if (!arq || arq.app !== 'trilha-ulife' || !arq.estado) throw new Error('Este arquivo não é um backup da Trilha Ulife.');
      const novo = migrar(arq.estado);
      try { armazem.setItem(`${CHAVE}:antes-de-importar`, JSON.stringify(estado)); } catch { /* sem espaço */ }
      estado = novo;
      gravar();
      ouvintes.forEach((f) => f());
    },
    apagarTudo() { estado = estadoInicial(relogio()); gravar(); ouvintes.forEach((f) => f()); },
  };
}

export type Loja = ReturnType<typeof criarLoja>;

const armazemDoNavegador: Armazem = typeof localStorage !== 'undefined' ? localStorage : memoria();
export const loja = criarLoja(armazemDoNavegador);

export function useEstado<T>(sel: (s: Estado) => T): T {
  return useSyncExternalStore(loja.assinar, () => sel(loja.get()), () => sel(loja.get()));
}
