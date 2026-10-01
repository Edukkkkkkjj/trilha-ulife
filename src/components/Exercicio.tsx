// Um exercício: responder, pedir dica (3 níveis), conferir, entender o erro, tentar de novo.
import { useMemo, useState } from 'react';
import { CAUSAS, type Causa, type Ex, type Resultado } from '../engine/types';
import { colunasDaTabela, corrigir, corrigirTabela, lerNumero, nota, type Resposta } from '../engine/corrigir';
import { evalSetExpr, regionsOf } from '../lib/sets';
import { show } from '../lib/logic';
import { hashSeed, rng } from '../lib/rng';
import { loja } from '../lib/store';
import { Rico, SeloTag, Txt } from './Rico';
import { VennPintar } from './toys/Venn';

type Props = { ex: Ex; faseId: string; gen?: { gen: string; seed: number; nivel?: number }; onFim: (score: number) => void; rotuloFim?: string };
const NIVEIS = ['Empurrão', 'Pista forte', 'Passo resolvido'];
const TECLAS_EXPR = ["'", '·', '+', '(', ')', '¬', '∧', '∨'];

export function Exercicio({ ex, faseId, gen, onFim, rotuloFim = 'Continuar' }: Props) {
  const ordem = useMemo(() => {
    if (ex.kind !== 'mcq' && ex.kind !== 'multi') return [];
    const idx = ex.options.map((_, i) => i);
    return ex.kind === 'mcq' && ex.fixo ? idx : rng(hashSeed(ex.id + Date.now())).shuffle(idx);
  }, [ex.id]); // eslint-disable-line

  const [texto, setTexto] = useState('');
  const [escolha, setEscolha] = useState<number | null>(null);
  const [marcadas, setMarcadas] = useState<number[]>([]);
  const [regioes, setRegioes] = useState<number[]>([]);
  const [cats, setCats] = useState<number[]>(() => (ex.kind === 'classificar' ? ex.itens.map(() => -1) : []));
  const tab = useMemo(() => (ex.kind === 'tabela' ? colunasDaTabela(ex.expr, ex.ordem) : null), [ex]);
  const [cols, setCols] = useState<number[][]>(() => (tab ? tab.subs.map(() => tab.linhas.map(() => -1)) : []));
  const [errosTab, setErrosTab] = useState<number[][] | null>(null);
  // passos (exemplo resolvido que vai sumindo)
  const pedem = ex.kind === 'passos' ? ex.passos.map((p, i) => (p.pede ? i : -1)).filter((i) => i >= 0) : [];
  const ocultos = ex.kind === 'passos' ? pedem.slice(-ex.ocultos) : [];
  const [respPassos, setRespPassos] = useState<Record<number, { txt: string; ok?: boolean }>>({});

  const [dicas, setDicas] = useState(0);
  const [tentativas, setTentativas] = useState(0);
  const [res, setRes] = useState<Resultado | null>(null);
  const [fim, setFim] = useState<null | { score: number; desistiu: boolean }>(null);
  const [causa, setCausa] = useState<Causa | null>(null);

  const resposta = (): Resposta | null => {
    switch (ex.kind) {
      case 'mcq': return escolha;
      case 'multi': return marcadas;
      case 'num': return texto.trim() ? texto : null;
      case 'set': return texto;
      case 'expr': return texto.trim() ? texto : null;
      case 'venn': return regioes;
      case 'classificar': return cats.includes(-1) ? null : cats;
      case 'tabela': return cols;
      case 'passos': return ocultos.every((i) => respPassos[i]?.ok !== undefined) ? ocultos.map((i) => (respPassos[i].ok ? 1 : 0)) : null;
    }
  };

  const registrarErro = (r: Resultado) => {
    loja.registrarErro({ exId: ex.id, faseId, topic: ex.topic, prompt: ex.prompt, dada: r.given, certa: r.expected, explica: ex.explain, causa: r.diag?.causa, msg: r.diag?.msg, gen });
  };
  const encerrar = (score: number, desistiu: boolean) => {
    loja.registrarExercicio(ex.topic, score);
    if (score > 0 && tentativas === 0) loja.resolverPorExercicio(ex.id);
    setFim({ score, desistiu });
  };

  const conferir = () => {
    const rp = resposta();
    if (rp === null) return;
    const r = corrigir(ex, rp);
    setRes(r);
    if (ex.kind === 'tabela') setErrosTab(corrigirTabela(ex.expr, ex.ordem, cols).erros);
    if (r.ok) encerrar(nota(tentativas === 0, true, dicas), false);
    else {
      if (tentativas === 0) registrarErro(r);
      setCausa(r.diag?.causa ?? null);
      setTentativas(tentativas + 1);
      if (ex.kind === 'passos') encerrar(Math.round((ocultos.filter((i) => respPassos[i]?.ok).length / ocultos.length) * 100) / 100 * [1, 0.85, 0.65, 0.35][dicas], false);
    }
  };
  const marcarCausa = (c: Causa) => {
    setCausa(c);
    const e = loja.get().erros.find((x) => x.exId === ex.id && !x.resolvido);
    if (e) loja.definirCausa(e.id, c);
  };
  const conferirPasso = (i: number) => {
    if (ex.kind !== 'passos') return;
    const p = ex.passos[i].pede!, v = lerNumero(respPassos[i]?.txt ?? '');
    if (v === null) return;
    setRespPassos({ ...respPassos, [i]: { txt: respPassos[i].txt, ok: Math.abs(v - p.resposta) <= (p.tol ?? 0) + 1e-9 } });
  };

  const travado = !!fim;
  const errou = !!res && !res.ok && !fim;
  const B = (v: number) => (v < 0 ? '·' : ex.kind === 'tabela' && ex.notacao === 'bool' ? String(v) : v ? 'V' : 'F');

  return (
    <div className="pilha">
      <div className="linha">
        {ex.fonte && <span className="fonte">{ex.fonte}</span>}
        {ex.selo && <SeloTag tipo={ex.selo} />}
      </div>
      <Rico>{ex.prompt}</Rico>
      {ex.selo && ex.seloNota && fim && <div className={'selo-nota ' + ex.selo}><Txt>{ex.seloNota}</Txt></div>}

      {(ex.kind === 'mcq' || ex.kind === 'multi') && (
        <div className="opcoes" role="group">
          {ordem.map((i, pos) => {
            const sel = ex.kind === 'mcq' ? escolha === i : marcadas.includes(i);
            const certa = ex.kind === 'mcq' ? ex.correct === i : ex.correct.includes(i);
            const cls = fim ? (certa ? ' certa' : sel ? ' errada' : '') : errou && sel && ex.kind === 'mcq' ? ' errada' : '';
            return (
              <button key={i} className={'opcao' + cls} aria-pressed={sel} disabled={travado}
                onClick={() => { setRes(null); if (ex.kind === 'mcq') setEscolha(i); else setMarcadas(sel ? marcadas.filter((x) => x !== i) : [...marcadas, i]); }}>
                <span className="letra">{ex.kind === 'multi' ? (sel ? '☑' : '☐') : 'ABCDE'[pos]}</span><span><Txt>{ex.options[i]}</Txt></span>
              </button>
            );
          })}
          {ex.kind === 'multi' && <span className="mini">Pode haver mais de uma correta: marque todas.</span>}
        </div>
      )}

      {(ex.kind === 'num' || ex.kind === 'set' || ex.kind === 'expr') && (
        <div className="pilha" style={{ gap: 6 }}>
          <input className="campo mono" value={texto} disabled={travado} onChange={(e) => { setTexto(e.target.value); setRes(null); }} onKeyDown={(e) => e.key === 'Enter' && conferir()}
            inputMode={ex.kind === 'num' ? 'decimal' : 'text'} autoCapitalize={ex.kind === 'expr' ? 'characters' : 'off'} autoCorrect="off" spellCheck={false}
            placeholder={ex.kind === 'num' ? 'sua resposta (ex.: 12, 0,62 ou 1/3)' : ex.kind === 'set' ? 'ex.: 1, 2, 3 (vazio = deixe em branco)' : "ex.: A·B + A'·C"} aria-label="Sua resposta" />
          {ex.kind === 'expr' && !travado && <div className="teclas">{TECLAS_EXPR.map((t) => <button key={t} className="tecla" onClick={() => setTexto(texto + t)}>{t}</button>)}<button className="tecla" aria-label="Apagar" onClick={() => setTexto(texto.slice(0, -1))}>⌫</button></div>}
          {ex.kind === 'num' && ex.unidade && <span className="mini">Resposta em {ex.unidade}.</span>}
        </div>
      )}

      {ex.kind === 'venn' && (
        <VennPintar n={ex.n} sel={regioes} travado={travado} onToggle={(r) => { setRes(null); setRegioes((x) => (x.includes(r) ? x.filter((y) => y !== r) : [...x, r])); }}
          gabarito={res ? regionsOf(evalSetExpr(ex.target, ex.n), ex.n) : undefined} />
      )}

      {ex.kind === 'classificar' && (
        <div className="pilha" style={{ gap: 8 }}>
          {ex.itens.map((it, k) => {
            const errado = (res || fim) && cats[k] !== it.cat;
            return (
              <div key={k} className="cartao liso" style={{ padding: 10, borderColor: errado ? 'var(--bad)' : undefined }}>
                <div><Txt>{it.texto}</Txt></div>
                <div className="linha">
                  {ex.categorias.map((c, j) => <button key={j} className="btn sm" aria-pressed={cats[k] === j} disabled={travado} onClick={() => { setRes(null); setCats(cats.map((x, i) => (i === k ? j : x))); }}>{c}</button>)}
                </div>
                {fim && it.porque && <div className="mini">{ex.categorias[it.cat]}: {it.porque}</div>}
              </div>
            );
          })}
        </div>
      )}

      {ex.kind === 'tabela' && tab && (
        <div className="rolagem">
          <table className="tv">
            <thead><tr>{tab.vs.map((v) => <th key={v}>{v}</th>)}{tab.subs.map((sx, c) => <th key={c}>{show(sx, ex.notacao)}</th>)}</tr></thead>
            <tbody>
              {tab.linhas.map((env, l) => (
                <tr key={l}>
                  {tab.vs.map((v) => <td key={v} className="var">{B(env[v] ? 1 : 0)}</td>)}
                  {tab.subs.map((_, c) => (
                    <td key={c} className={(cols[c][l] === 1 ? 'v1' : 'v0') + (errosTab?.[c]?.includes(l) ? ' x' : '')}>
                      <button disabled={travado} aria-label={`linha ${l + 1}, coluna ${c + 1}`} onClick={() => { setRes(null); setErrosTab(null); setCols(cols.map((col, ci) => (ci === c ? col.map((v, li) => (li === l ? (v === 1 ? 0 : 1) : v)) : col))); }}>{B(cols[c][l])}</button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ex.kind === 'passos' && (
        <ol className="pilha" style={{ gap: 8, paddingLeft: '1.2em', margin: 0 }}>
          {ex.passos.map((p, i) => {
            const oculto = ocultos.includes(i), rp = respPassos[i];
            // Só libera um passo depois de responder o anterior (um passo de cada vez).
            const anterior = ocultos[ocultos.indexOf(i) - 1];
            const liberado = !oculto || anterior === undefined || respPassos[anterior]?.ok !== undefined;
            if (!liberado) return <li key={i} className="mini">…</li>;
            return (
              <li key={i}>
                <Txt>{p.texto}</Txt>
                {p.pede && !oculto && <b> = {p.pede.resposta}</b>}
                {p.pede && oculto && (
                  <div className="linha" style={{ marginTop: 4 }}>
                    <input className="campo mono" style={{ width: 110 }} inputMode="decimal" placeholder={p.pede.rotulo} value={rp?.txt ?? ''} disabled={rp?.ok !== undefined}
                      onChange={(e) => setRespPassos({ ...respPassos, [i]: { txt: e.target.value } })} onKeyDown={(e) => e.key === 'Enter' && conferirPasso(i)} aria-label={p.pede.rotulo} />
                    {rp?.ok === undefined ? <button className="btn sm" onClick={() => conferirPasso(i)}>ok</button> : <span className={'pilula ' + (rp.ok ? 'ok' : 'ouro')}>{rp.ok ? 'certo' : `era ${p.pede.resposta}`}</span>}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {dicas > 0 && !fim && ex.hints.slice(0, dicas).map((d, i) => <div key={i} className="dica"><span className="rotulo">{NIVEIS[i]}</span><div><Txt>{d}</Txt></div></div>)}

      {errou && ex.kind !== 'passos' && (
        <div className="fb bad" aria-live="polite">
          <b>Ainda não.</b>
          <div><Txt>{res!.diag?.msg ?? 'Essa não é a resposta. Releia o enunciado com calma ou peça uma dica.'}</Txt></div>
          {!res!.diag?.causa && (
            <div className="linha"><span className="mini">Por que você acha que errou?</span>
              {(Object.keys(CAUSAS) as Causa[]).map((c) => <button key={c} className="btn sm" aria-pressed={causa === c} onClick={() => marcarCausa(c)}>{CAUSAS[c]}</button>)}
            </div>
          )}
        </div>
      )}

      {fim && (
        <div className={'fb ' + (fim.desistiu ? 'neutro' : fim.score >= 0.5 ? 'ok' : 'neutro')} aria-live="polite">
          <b>{fim.desistiu ? 'Resolução' : fim.score === 1 ? 'Certo, de primeira e sem dica.' : fim.score > 0 ? `Certo. Nota ${Math.round(fim.score * 100)}% (${tentativas > 0 ? 'não foi de primeira' : `${dicas} dica(s)`}).` : 'Vamos ver a resolução.'}</b>
          {(fim.desistiu || fim.score < 1) && ex.kind !== 'passos' && <div>Resposta: <b><Txt>{res?.expected ?? ''}</Txt></b></div>}
          <Rico>{ex.explain}</Rico>
          {ex.kind === 'mcq' && ex.heuristica && <div className="mini"><b>Heurística de prova que resolveria:</b> {ex.heuristica}</div>}
        </div>
      )}

      <div className="linha">
        {!fim && <button className="btn pri" onClick={conferir} disabled={resposta() === null}>{errou ? 'Conferir de novo' : 'Conferir'}</button>}
        {!fim && dicas < 3 && <button className="btn" onClick={() => setDicas(dicas + 1)}>Dica {dicas + 1}/3 · {NIVEIS[dicas]}</button>}
        {errou && <button className="btn fantasma" onClick={() => { const r = res ?? corrigir(ex, resposta()!); setRes(r); loja.registrarExercicio(ex.topic, 0); setFim({ score: 0, desistiu: true }); }}>Ver resolução</button>}
        {fim && <button className="btn pri" onClick={() => onFim(fim.score)}>{rotuloFim}</button>}
      </div>
      {!fim && dicas > 0 && <span className="mini">Dicas usadas contam na nota: {['100%', '85%', '65%', '35%'][dicas]} do exercício.</span>}
    </div>
  );
}
