// Componente-base de todas as ilustrações vivas ("brinquedos").
// Dá a cada uma, de graça: histórico (desfazer/refazer/resetar), modo livre × desafio,
// botões de cenário "E se...?", "preveja antes de mexer" e arrasto que funciona com dedo e mouse.
import { useCallback, useEffect, useRef, useState, type ReactNode, type PointerEvent as RPE } from 'react';
import { loja } from '../lib/store';

// ---------- histórico ----------
export type Historico<T> = {
  estado: T;
  /** Muda o estado e guarda o anterior (dá para desfazer). */
  mudar: (prox: T | ((atual: T) => T)) => void;
  /** Muda sem registrar: use durante um arrasto, depois de chamar marcar(). */
  ajustar: (prox: T | ((atual: T) => T)) => void;
  /** Guarda o estado atual como ponto de volta (início de um arrasto). */
  marcar: () => void;
  desfazer: () => void;
  refazer: () => void;
  resetar: () => void;
  podeDesfazer: boolean;
  podeRefazer: boolean;
};

export function useHistorico<T>(inicial: T, chave?: string, valido?: (x: unknown) => boolean, salvar = true): Historico<T> {
  const [h, setH] = useState(() => {
    const salvo = chave ? loja.get().brinquedos[chave] : undefined;
    const presente = salvo !== undefined && (!valido || valido(salvo)) ? (salvo as T) : inicial;
    return { passado: [] as T[], presente, futuro: [] as T[] };
  });
  const resolve = (p: T | ((a: T) => T), a: T) => (typeof p === 'function' ? (p as (a: T) => T)(a) : p);
  const mudar = useCallback((p: T | ((a: T) => T)) => setH((x) => ({ passado: [...x.passado.slice(-59), x.presente], presente: resolve(p, x.presente), futuro: [] })), []);
  const ajustar = useCallback((p: T | ((a: T) => T)) => setH((x) => ({ ...x, presente: resolve(p, x.presente) })), []);
  const marcar = useCallback(() => setH((x) => ({ passado: [...x.passado.slice(-59), x.presente], presente: x.presente, futuro: [] })), []);
  const desfazer = useCallback(() => setH((x) => (x.passado.length ? { passado: x.passado.slice(0, -1), presente: x.passado[x.passado.length - 1], futuro: [x.presente, ...x.futuro] } : x)), []);
  const refazer = useCallback(() => setH((x) => (x.futuro.length ? { passado: [...x.passado, x.presente], presente: x.futuro[0], futuro: x.futuro.slice(1) } : x)), []);
  const resetar = useCallback(() => mudar(inicial), [mudar, inicial]);

  // Salva o modo livre sozinho (meio segundo depois da última mexida).
  useEffect(() => {
    if (!chave || !salvar) return;
    const t = setTimeout(() => loja.guardarBrinquedo(chave, h.presente), 500);
    return () => clearTimeout(t);
  }, [chave, salvar, h.presente]);

  return { estado: h.presente, mudar, ajustar, marcar, desfazer, refazer, resetar, podeDesfazer: h.passado.length > 0, podeRefazer: h.futuro.length > 0 };
}

/**
 * Modo livre × desafio. Ao entrar num desafio, guarda o que você tinha montado no modo livre;
 * ao voltar, devolve. Assim um desafio nunca apaga a sua caixa de areia.
 */
export function useModo<T>(h: Historico<T>, inicial: Modo = 'livre') {
  const [modo, setModo] = useState<Modo>(inicial);
  const guardado = useRef<T>(h.estado);
  const trocar = (m: Modo) => {
    if (m === modo) return;
    if (m === 'desafio') guardado.current = h.estado;
    else h.mudar(guardado.current);
    setModo(m);
  };
  return [modo, trocar] as const;
}

// ---------- prever antes de mexer ----------
type Pedido = { pergunta: string; opcoes: string[]; real: number; aplicar: () => void; porque?: string };

export function usePrevisao(inicialAtiva = false) {
  const [ativa, setAtiva] = useState(inicialAtiva);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [retorno, setRetorno] = useState<{ acertou: boolean; texto: string } | null>(null);

  /** Se "prever" estiver ligado, pergunta antes de aplicar a mudança. Senão, aplica direto. */
  const pedir = (p: Pedido) => {
    if (!ativa) { p.aplicar(); return; }
    setRetorno(null);
    setPedido(p);
  };
  const escolher = (i: number) => {
    if (!pedido) return;
    pedido.aplicar();
    const acertou = i === pedido.real;
    setRetorno({ acertou, texto: `${acertou ? 'Isso mesmo' : 'Quase'}: ${pedido.opcoes[pedido.real]}.${pedido.porque ? ' ' + pedido.porque : ''}` });
    setPedido(null);
  };
  const painel = (
    <>
      {pedido && (
        <div className="prever" role="group" aria-label="Preveja antes de mexer">
          <span className="rotulo acc">Preveja antes de mexer</span>
          <p>{pedido.pergunta}</p>
          <div className="linha">
            {pedido.opcoes.map((o, i) => <button key={i} className="btn sm" onClick={() => escolher(i)}>{o}</button>)}
            <button className="btn sm fantasma" onClick={() => setPedido(null)}>cancelar</button>
          </div>
        </div>
      )}
      {retorno && !pedido && <div className={'fb ' + (retorno.acertou ? 'ok' : 'neutro')} aria-live="polite">{retorno.texto}</div>}
    </>
  );
  return { ativa, setAtiva, pedir, painel, pendente: !!pedido, limpar: () => { setPedido(null); setRetorno(null); } };
}

// ---------- moldura ----------
export type Modo = 'livre' | 'desafio';

export function Moldura<T>(p: {
  titulo: string;
  modo: Modo;
  onModo?: (m: Modo) => void;
  h: Historico<T>;
  previsao?: { ativa: boolean; setAtiva: (b: boolean) => void };
  cenarios?: { rotulo: string; acao: () => void }[];
  children: ReactNode;
}) {
  return (
    <section className="toy">
      <div className="toy-topo">
        <span className="titulo">{p.titulo}</span>
        {p.onModo && (
          <div className="seg" role="group" aria-label="Modo">
            <button aria-pressed={p.modo === 'livre'} onClick={() => p.onModo!('livre')}>Livre</button>
            <button aria-pressed={p.modo === 'desafio'} onClick={() => p.onModo!('desafio')}>Desafio</button>
          </div>
        )}
        <button className="btn sm" onClick={p.h.desfazer} disabled={!p.h.podeDesfazer} aria-label="Desfazer">↶ Desfazer</button>
        <button className="btn sm" onClick={p.h.refazer} disabled={!p.h.podeRefazer} aria-label="Refazer">↷</button>
        <button className="btn sm" onClick={p.h.resetar} aria-label="Resetar">⟲ Resetar</button>
      </div>
      <div className="toy-corpo">
        {(p.cenarios?.length || p.previsao) && (
          <div className="cenarios" role="group" aria-label="Cenários">
            {p.previsao && (
              <button className="btn sm" aria-pressed={p.previsao.ativa} onClick={() => p.previsao!.setAtiva(!p.previsao!.ativa)}>
                {p.previsao.ativa ? '◉' : '○'} Prever antes
              </button>
            )}
            {p.cenarios?.map((c) => <button key={c.rotulo} className="btn sm" onClick={c.acao}>{c.rotulo}</button>)}
          </div>
        )}
        {p.children}
      </div>
    </section>
  );
}

// ---------- arrasto no SVG (dedo e mouse) ----------
export type Pt = { x: number; y: number };

export function pontoSvg(svg: SVGSVGElement, e: { clientX: number; clientY: number }): Pt {
  const m = svg.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
}

/**
 * Controla um gesto dentro de um <svg>: distingue toque (sem mover) de arrasto.
 * Uso: const g = useGesto(svgRef); <circle onPointerDown={(e) => g.iniciar(e, { mover, soltar, tocar })} />
 */
export function useGesto(svgRef: React.RefObject<SVGSVGElement | null>) {
  const atual = useRef<null | { id: number; ini: Pt; moveu: boolean; cb: Cb }>(null);
  type Cb = { comecar?: () => void; mover?: (p: Pt, ini: Pt) => void; soltar?: (p: Pt, ini: Pt) => void; tocar?: (p: Pt) => void };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const a = atual.current, svg = svgRef.current;
      if (!a || !svg || e.pointerId !== a.id) return;
      const p = pontoSvg(svg, e);
      if (!a.moveu && Math.hypot(p.x - a.ini.x, p.y - a.ini.y) > 5) { a.moveu = true; a.cb.comecar?.(); }
      if (a.moveu) { e.preventDefault(); a.cb.mover?.(p, a.ini); }
    };
    const up = (e: PointerEvent) => {
      const a = atual.current, svg = svgRef.current;
      if (!a || !svg || e.pointerId !== a.id) return;
      const p = pontoSvg(svg, e);
      atual.current = null;
      if (a.moveu) a.cb.soltar?.(p, a.ini); else a.cb.tocar?.(p);
    };
    const cancel = () => { atual.current = null; };
    // No celular, o navegador tenta transformar um arrasto vertical em rolagem da página e cancela o gesto.
    // O Chrome ignora "touch-action" em elementos de dentro do SVG, então avisamos aqui, no começo do toque:
    // se o dedo pousou numa peça arrastável (.pega), o toque é do brinquedo, não da rolagem.
    // Tocar no fundo do desenho continua rolando a página normalmente.
    const svg0 = svgRef.current;
    const segura = (e: TouchEvent) => { if ((e.target as Element | null)?.closest?.('.pega')) e.preventDefault(); };
    svg0?.addEventListener('touchstart', segura, { passive: false });
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      svg0?.removeEventListener('touchstart', segura);
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel);
    };
  }, [svgRef]);

  const iniciar = (e: RPE, cb: Cb) => {
    const svg = svgRef.current;
    if (!svg || atual.current) return;
    e.stopPropagation();
    atual.current = { id: e.pointerId, ini: pontoSvg(svg, e), moveu: false, cb };
  };
  return { iniciar };
}

/** Prende o valor entre lo e hi, já arredondado (posições com 14 casas decimais só pesam no salvamento). */
export const limitar = (v: number, lo: number, hi: number) => Math.round(Math.max(lo, Math.min(hi, v)));
