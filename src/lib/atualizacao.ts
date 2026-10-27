// Aviso de versão nova. O site é um PWA: o celular guarda uma cópia para funcionar sem internet e,
// sem este aviso, podia ficar preso numa versão antiga depois de uma publicação.
// O progresso fica no armazenamento do navegador e tem versão própria (ver store.ts), então atualizar não apaga nada.
import { useSyncExternalStore } from 'react';

let haNova = false;
let aplicar: ((recarregar?: boolean) => Promise<void>) | null = null;
const ouvintes = new Set<() => void>();
const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f); }; };

export const useNovaVersao = () => useSyncExternalStore(assinar, () => haNova, () => false);

/** Aplica a versão nova e recarrega a página. */
export const atualizarAgora = () => { void aplicar?.(true); };

/** Liga o service worker (só no navegador). Chamada uma vez, em main.tsx. */
export async function registrarAtualizacao() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const { registerSW } = await import('virtual:pwa-register');
    aplicar = registerSW({
      onNeedRefresh() { haNova = true; ouvintes.forEach((f) => f()); },
      onRegisteredSW(_url, reg) {
        if (!reg) return;
        const olhar = () => { reg.update().catch(() => { /* sem internet: tenta de novo depois */ }); };
        setInterval(olhar, 60 * 60 * 1000);
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') olhar(); });
      },
    });
  } catch { /* sem service worker: o site funciona do mesmo jeito, só não avisa */ }
}
