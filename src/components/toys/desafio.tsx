// Painel de desafios comum às ilustrações: texto do desafio, palpite ("preveja antes"), Conferir, anterior/próximo.
import { useEffect, useMemo, useState } from 'react';
import type { Historico, Modo } from '../Sandbox';

export type DesafioBase<T> = { id: string; texto: string; ini: T; falta: (s: T) => string | null; prever?: string; depois?: string; impossivel?: string };

export function useDesafios<T>(todos: DesafioBase<T>[], ids: string[] | undefined, modo: Modo, h: Historico<T>, onProgresso?: (feitos: number, total: number) => void, aoTrocar?: () => void) {
  const lista = useMemo(() => todos.filter((d) => !ids || ids.includes(d.id)), [todos, ids]);
  const [iD, setID] = useState(0);
  const [feitos, setFeitos] = useState<string[]>([]);
  const [retorno, setRetorno] = useState<null | { ok: boolean; msg: string }>(null);
  const [palpite, setPalpite] = useState('');
  const [palpitou, setPalpitou] = useState(false);
  const d = modo === 'desafio' ? lista[iD] : undefined;
  useEffect(() => { onProgresso?.(feitos.length, lista.length); }, [feitos.length, lista.length]); // eslint-disable-line
  useEffect(() => { setRetorno(null); setPalpite(''); setPalpitou(false); aoTrocar?.(); if (d) h.mudar(d.ini); }, [d?.id]); // eslint-disable-line

  const feito = (msg: string) => { setRetorno({ ok: true, msg }); if (d && !feitos.includes(d.id)) setFeitos([...feitos, d.id]); };
  const conferir = () => {
    if (!d) return;
    const f = d.falta(h.estado);
    if (f) setRetorno({ ok: false, msg: d.impossivel ? f + ' Continue tentando, ou aperte "É impossível" se tiver certeza.' : f });
    else feito('Resolvido. ' + (d.depois ?? ''));
  };

  const painel = d ? (
    <div className="desafio">
      <div className="entre"><span className="rotulo">Desafio {iD + 1} de {lista.length}</span>{feitos.includes(d.id) && <span className="pilula ok">feito</span>}</div>
      <p>{d.texto}</p>
      {d.prever && !palpitou && (
        <div className="linha">
          <span className="mini">{d.prever}</span>
          <input className="campo" style={{ width: 90 }} inputMode="decimal" value={palpite} onChange={(e) => setPalpite(e.target.value)} placeholder="palpite" aria-label="Seu palpite" />
          <button className="btn sm" disabled={!palpite.trim()} onClick={() => setPalpitou(true)}>Guardar palpite</button>
        </div>
      )}
      {d.prever && palpitou && <span className="mini">Seu palpite: {palpite}. Agora mexa e veja.</span>}
      {retorno && <div className={'fb ' + (retorno.ok ? 'ok' : 'bad')} aria-live="polite">{retorno.msg}{retorno.ok && palpitou ? ` (Seu palpite foi ${palpite}.)` : ''}</div>}
      <div className="linha">
        <button className="btn sm pri" onClick={conferir}>Conferir</button>
        {d.impossivel && <button className="btn sm" onClick={() => feito(d.impossivel!)}>É impossível</button>}
        <button className="btn sm" disabled={iD === 0} onClick={() => setID(iD - 1)}>← anterior</button>
        <button className="btn sm" disabled={iD >= lista.length - 1} onClick={() => setID(iD + 1)}>próximo →</button>
      </div>
    </div>
  ) : null;
  return { d, painel };
}
