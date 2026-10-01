// Navegação simples pelo "#" do endereço (funciona em qualquer hospedagem estática e offline).
import { useSyncExternalStore } from 'react';

const ler = () => (typeof location === 'undefined' ? '' : location.hash.replace(/^#\/?/, ''));
const assinar = (f: () => void) => { window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); };

export function useRota(): string[] {
  const h = useSyncExternalStore(assinar, ler, () => '');
  return h.split('/').filter(Boolean);
}
export const ir = (caminho: string) => { location.hash = '#/' + caminho.replace(/^\//, ''); window.scrollTo(0, 0); };
export const link = (caminho: string) => '#/' + caminho.replace(/^\//, '');
