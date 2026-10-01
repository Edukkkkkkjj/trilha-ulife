// Executa uma fase, um passo de cada vez. Guarda onde você parou.
import { useMemo, useState } from 'react';
import type { Ex, Phase, Step } from '../engine/types';
import { GERADORES } from '../engine/geradores';
import { newSeed, rng } from '../lib/rng';
import { loja, useEstado } from '../lib/store';
import { estrelas, medalhasMerecidas, MEDALHAS } from '../lib/progresso';
import { Exercicio } from './Exercicio';
import { Rico, SeloTag, Txt } from './Rico';
import { Toy } from './toys';

type Item =
  | { k: 'step'; step: Exclude<Step, { t: 'gen' } | { t: 'ex' }> }
  | { k: 'ex'; ex: Ex; gen?: { gen: string; seed: number; nivel: number } };

function expandir(fase: Phase): Item[] {
  const out: Item[] = [];
  for (const st of fase.steps) {
    if (st.t === 'gen') {
      for (let i = 0; i < st.n; i++) { const seed = newSeed(); out.push({ k: 'ex', ex: GERADORES[st.gen](rng(seed), i), gen: { gen: st.gen, seed, nivel: i } }); }
    } else if (st.t === 'ex') out.push({ k: 'ex', ex: st.ex });
    else out.push({ k: 'step', step: st });
  }
  return out;
}

export function Anotar({ faseId, onFechar }: { faseId?: string; onFechar: () => void }) {
  const [txt, setTxt] = useState('');
  const [tag, setTag] = useState<'duvida' | 'erro' | 'estalo'>('estalo');
  return (
    <div className="cartao">
      <span className="rotulo acc">Diário de pesquisa</span>
      <div className="linha">
        {([['duvida', 'Dúvida'], ['erro', 'Erro que cometi'], ['estalo', 'Estalo']] as const).map(([k, r]) => <button key={k} className="btn sm" aria-pressed={tag === k} onClick={() => setTag(k)}>{r}</button>)}
      </div>
      <textarea className="campo" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Escreva curto, no calor da hora. Ex.: 'Errei porque achei que a diferença era simétrica.'" autoFocus />
      <div className="linha">
        <button className="btn pri sm" disabled={!txt.trim()} onClick={() => { loja.anotar({ tag, texto: txt.trim(), faseId }); onFechar(); }}>Guardar</button>
        <button className="btn sm fantasma" onClick={onFechar}>Cancelar</button>
      </div>
    </div>
  );
}

export function FaseRunner({ fase, onSair, onFim }: { fase: Phase; onSair: () => void; onFim?: () => void }) {
  const itens = useMemo(() => expandir(fase), [fase.id]); // eslint-disable-line
  const salvo = useEstado((s) => s.andamento[fase.id]);
  const [i, setI] = useState(() => Math.min(salvo ?? 0, itens.length - 1));
  const [notas, setNotas] = useState<Record<number, number>>({});
  const [anotando, setAnotando] = useState(false);
  const [fim, setFim] = useState<null | { nota: number; xp: number; novas: string[] }>(null);
  const [revelado, setRevelado] = useState<Record<number, boolean>>({});
  const [palpite, setPalpite] = useState('');
  const [escrita, setEscrita] = useState('');
  const [marcas, setMarcas] = useState<boolean[]>([]);
  const [progToy, setProgToy] = useState<[number, number]>([0, 0]);

  const ir = (j: number, nota?: number) => {
    const n = nota === undefined ? notas : { ...notas, [i]: nota };
    setNotas(n);
    setPalpite(''); setEscrita(''); setMarcas([]); setProgToy([0, 0]); setAnotando(false);
    window.scrollTo(0, 0);
    if (j >= itens.length) {
      const vals = Object.values(n);
      const media = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 1;
      const xp = Math.round(fase.min * 6 + media * 30 + (fase.tipo === 'chefe' ? 60 : 0));
      const antes = loja.get().medalhas;
      loja.concluirFase(fase.id, Math.round(media * 100) / 100, xp);
      const novas = medalhasMerecidas(loja.get()).filter((m) => !antes.includes(m));
      novas.forEach((m) => loja.darMedalha(m));
      setFim({ nota: media, xp, novas });
      return;
    }
    setI(j);
    loja.guardarAndamento(fase.id, j);
  };

  if (fim) {
    const e = estrelas(fim.nota);
    return (
      <div className="pilha g" style={{ paddingTop: 24 }}>
        <div className="cartao" style={{ textAlign: 'center' }}>
          <span className="rotulo acc">{fase.tipo === 'chefe' ? 'Chefão vencido' : 'Fase concluída'}</span>
          <h1>{fase.titulo}</h1>
          <div className="estrelas" style={{ fontSize: '2rem' }} aria-label={`${e} de 3 estrelas`}>{'★'.repeat(e)}<span style={{ opacity: 0.25 }}>{'★'.repeat(3 - e)}</span></div>
          <p>Nota nos exercícios: <b>{Math.round(fim.nota * 100)}%</b> · <span className="pilula ouro">+{fim.xp} XP</span></p>
          {fim.novas.map((m) => <p key={m}><span className="pilula ok">Medalha</span> <b>{MEDALHAS[m]?.nome}</b>: {MEDALHAS[m]?.como}</p>)}
          {fim.nota < 0.7 && <p className="sub">Os exercícios que você errou foram para o caderno de erros, com a explicação. Refazer de lá vale mais do que repetir a fase inteira.</p>}
        </div>
        <div className="linha">
          <button className="btn pri" onClick={onFim ?? onSair}>Continuar</button>
          <button className="btn" onClick={() => setAnotando(true)}>Anotar no diário</button>
        </div>
        {anotando && <Anotar faseId={fase.id} onFechar={() => setAnotando(false)} />}
      </div>
    );
  }

  const it = itens[i];
  const proximo = () => ir(i + 1);
  return (
    <div className="pilha">
      <div className="fase-topo">
        <button className="btn sm" onClick={onSair} aria-label="Sair da fase">✕</button>
        <div className="barra" role="progressbar" aria-valuenow={i} aria-valuemin={0} aria-valuemax={itens.length}><i style={{ width: `${(i / itens.length) * 100}%` }} /></div>
        <span className="mini">{i + 1}/{itens.length}</span>
        <button className="btn sm" onClick={() => setAnotando(!anotando)} aria-label="Anotar no diário">✎</button>
      </div>
      {anotando && <Anotar faseId={fase.id} onFechar={() => setAnotando(false)} />}

      {it.k === 'ex' && <div className="cartao"><Exercicio key={it.ex.id} ex={it.ex} faseId={fase.id} gen={it.gen} onFim={(nota) => ir(i + 1, nota)} /></div>}

      {it.k === 'step' && it.step.t === 'texto' && (
        <div className="cartao">
          {it.step.selo && <SeloTag tipo={it.step.selo} nota={it.step.seloNota} />}
          <Rico>{it.step.md}</Rico>
          <button className="btn pri" onClick={proximo}>Continuar</button>
        </div>
      )}

      {it.k === 'step' && it.step.t === 'licao' && (() => {
        const l = it.step, aberto = !l.pergunta || revelado[i];
        return (
          <div className="cartao">
            <span className="rotulo acc">Lição</span>
            <h2>{l.titulo}</h2>
            {l.pergunta && (
              <div className="prever">
                <span className="rotulo acc">Antes da explicação, tente</span>
                <p><Txt>{l.pergunta.q}</Txt></p>
                {!aberto && <>
                  <input className="campo" value={palpite} onChange={(e) => setPalpite(e.target.value)} placeholder="seu palpite (pode errar à vontade)" aria-label="Seu palpite" />
                  <button className="btn pri sm" onClick={() => setRevelado({ ...revelado, [i]: true })}>Ver a explicação</button>
                </>}
                {aberto && <p><b>Resposta:</b> <Txt>{l.pergunta.a}</Txt></p>}
              </div>
            )}
            {aberto && <>
              <div className="bloco porque"><span className="rotulo">Por que existe</span><Rico>{l.porque}</Rico></div>
              <div className="bloco"><span className="rotulo">A ideia</span><Rico>{l.ideia}</Rico></div>
              <div><span className="rotulo">A regra</span><Rico>{l.regra}</Rico></div>
              <div className="bloco"><span className="rotulo">Exemplo</span><Rico>{l.exemplo}</Rico></div>
              <div className="bloco arm"><span className="rotulo">Armadilha</span><Rico>{l.armadilha}</Rico>{l.selo && <div style={{ marginTop: 6 }}><SeloTag tipo={l.selo} nota={l.seloNota} /></div>}</div>
              <button className="btn pri" onClick={proximo}>Entendi, quero praticar</button>
            </>}
          </div>
        );
      })()}

      {it.k === 'step' && it.step.t === 'toy' && (() => {
        const t = it.step, [feitos, total] = progToy;
        return (
          <>
            <div className="cartao liso"><span className="rotulo acc">{t.modo === 'livre' ? 'Laboratório · modo livre' : 'Laboratório · desafios'}</span><Rico>{t.intro}</Rico></div>
            <Toy key={i} id={t.toy} modoInicial={t.modo} desafios={t.desafios} preset={t.preset} onProgresso={(f, tt) => setProgToy([f, tt])} />
            <div className="linha">
              <button className="btn pri" onClick={() => (t.modo === 'desafio' && total > 0 ? ir(i + 1, feitos / total) : proximo())}>
                {t.modo === 'desafio' && feitos < total ? `Seguir (${feitos} de ${total} feitos)` : 'Continuar'}
              </button>
              {t.modo === 'desafio' && feitos < total && <span className="mini">Pode seguir e voltar depois: os brinquedos ficam todos em "Brincar".</span>}
            </div>
          </>
        );
      })()}

      {it.k === 'step' && it.step.t === 'feynman' && (() => {
        const st = it.step;
        return (
          <div className="cartao">
            <span className="rotulo acc">Explique com suas palavras</span>
            <p><Txt>{st.prompt}</Txt></p>
            <textarea className="campo" value={escrita} onChange={(e) => setEscrita(e.target.value)} placeholder="Ninguém corrige este texto. Ele vai para o seu diário e depois ajuda na A3." />
            <div className="linha">
              <button className="btn pri" onClick={() => { if (escrita.trim()) loja.anotar({ tag: 'explico', faseId: fase.id, texto: `${st.prompt}\n\n${escrita.trim()}` }); proximo(); }}>{escrita.trim() ? 'Guardar no diário e continuar' : 'Pular por agora'}</button>
            </div>
          </div>
        );
      })()}

      {it.k === 'step' && it.step.t === 'escrita' && (() => {
        const st = it.step, visto = !!revelado[i];
        const m = marcas.length ? marcas : st.rubrica.map(() => false);
        return (
          <div className="cartao">
            <div className="linha"><span className="rotulo acc">Treino de escrita · A1</span>{st.fonte && <span className="fonte">{st.fonte}</span>}</div>
            <p><Txt>{st.prompt}</Txt></p>
            <textarea className="campo" style={{ minHeight: 170 }} value={escrita} onChange={(e) => setEscrita(e.target.value)} placeholder="Defino… Monto… Logo…" readOnly={visto} />
            {!visto && <div className="linha"><button className="btn pri" disabled={escrita.trim().length < 40} onClick={() => setRevelado({ ...revelado, [i]: true })}>Comparar com a resolução modelo</button><button className="btn fantasma" onClick={proximo}>Pular</button></div>}
            {visto && <>
              <div className="fb neutro"><span className="rotulo">Resolução modelo</span><Rico>{st.modelo}</Rico></div>
              <span className="rotulo">Autoavaliação: marque o que o SEU texto tem</span>
              {st.rubrica.map((r, k) => (
                <label key={k} className="linha" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                  <input type="checkbox" checked={m[k]} onChange={() => setMarcas(m.map((x, j) => (j === k ? !x : x)))} style={{ width: 22, height: 22, flex: 'none', marginTop: 2 }} /><span>{r}</span>
                </label>
              ))}
              <button className="btn pri" onClick={() => { loja.anotar({ tag: 'explico', faseId: fase.id, texto: `[Treino A1] ${st.prompt}\n\n${escrita.trim()}\n\nRubrica: ${m.filter(Boolean).length}/${m.length}` }); ir(i + 1, m.filter(Boolean).length / m.length); }}>Guardar e continuar</button>
            </>}
          </div>
        );
      })()}

      {i > 0 && <button className="btn sm fantasma" style={{ justifySelf: 'start' }} onClick={() => { setI(i - 1); window.scrollTo(0, 0); }}>← passo anterior</button>}
    </div>
  );
}
