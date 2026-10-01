import { useMemo, useState } from 'react';
import { REGIOES, nomeTopico, todasFases } from '../content';
import { Exercicio } from '../components/Exercicio';
import { FaseRunner } from '../components/FaseRunner';
import { Rico, Txt } from '../components/Rico';
import { GERADORES } from '../engine/geradores';
import { CAUSAS, type Card, type Causa, type Ex } from '../engine/types';
import { contarPorCaixa } from '../lib/leitner';
import { cardsDisponiveis, proximaFase, revisaoDeHoje, topicoMaisFraco } from '../lib/progresso';
import { newSeed, rng } from '../lib/rng';
import { loja, useEstado, type ErroReg } from '../lib/store';
import { dataBR } from '../lib/datas';
import { link } from '../rota';

// ---------- revisão espaçada ----------
export function RevisaoSessao({ cartoes, onFim }: { cartoes: Card[]; onFim: (lembrou: number) => void }) {
  const [i, setI] = useState(0);
  const [virado, setVirado] = useState(false);
  const [ok, setOk] = useState(0);
  const c = cartoes[i];
  if (!c) return null;
  const responder = (lembrou: boolean) => {
    loja.revisarCard(c.id, lembrou);
    const n = ok + (lembrou ? 1 : 0);
    setOk(n); setVirado(false);
    if (i + 1 >= cartoes.length) onFim(n); else setI(i + 1);
  };
  return (
    <div className="pilha">
      <div className="linha"><div className="barra" style={{ flex: 1 }}><i style={{ width: `${(i / cartoes.length) * 100}%` }} /></div><span className="mini">{i + 1}/{cartoes.length}</span></div>
      <div className="cartao">
        <span className={'pilula ' + (c.mundo === 'mat' ? 'acc' : 'ok')}>{c.mundo === 'mat' ? 'Matemática' : 'Exploração'} · {c.regiao.toUpperCase()}</span>
        <div className="flash"><h2><Txt>{c.frente}</Txt></h2></div>
        {virado && <div className="fb neutro"><Txt>{c.verso}</Txt></div>}
        {!virado ? <button className="btn pri cheio" onClick={() => setVirado(true)}>Tentei lembrar: mostrar resposta</button> : (
          <div className="linha"><button className="btn" style={{ flex: 1 }} onClick={() => responder(false)}>Não lembrei</button><button className="btn pri" style={{ flex: 1 }} onClick={() => responder(true)}>Lembrei</button></div>
        )}
      </div>
      <p className="mini">Responda de cabeça antes de virar. "Não lembrei" só faz o cartão voltar mais cedo; não tira ponto.</p>
    </div>
  );
}

export function Revisao() {
  const s = useEstado((x) => x);
  const lista = useMemo(() => revisaoDeHoje(loja.get()), []); // fixa a lista ao abrir
  const [fim, setFim] = useState<number | null>(null);
  const disp = cardsDisponiveis(s);
  const cx = contarPorCaixa(disp.map((c) => c.id), s.cards);
  const caixas = (
    <div className="cartao">
      <span className="rotulo">Seu baralho · {disp.length} cartões</span>
      <div className="contagem">{['novos', 'caixa 1', 'caixa 2', 'caixa 3', 'caixa 4', 'caixa 5'].map((n, k) => <div className="c" key={n}><span className="mini">{n}</span><b>{cx[k]}</b></div>)}</div>
      <p className="mini">Acertou, o cartão sobe de caixa e demora mais para voltar (1, 2, 4, 8, 16 dias). Errou, volta para a caixa 1.</p>
    </div>
  );
  if (fim !== null || !lista.length) {
    return (
      <div className="pilha g">
        <h1>Revisão do dia</h1>
        <div className="cartao">
          <h2>{lista.length ? `Feito: lembrou ${fim} de ${lista.length}.` : 'Nenhum cartão vence hoje.'}</h2>
          <p className="sub">{lista.length ? 'Os que você não lembrou voltam amanhã.' : 'Novos cartões de Matemática entram conforme você conclui fases.'}</p>
          <a className="btn pri" href={link('')}>Voltar ao início</a>
        </div>
        {caixas}
      </div>
    );
  }
  return <div className="pilha g"><h1>Revisão do dia</h1><RevisaoSessao cartoes={lista} onFim={setFim} /></div>;
}

// ---------- desafio misto ----------
function escolherGeradores(n: number): { gen: string; seed: number; nivel: number }[] {
  const s = loja.get();
  const regioesVistas = REGIOES.filter((r) => r.fases.some((f) => s.fases[f.id]?.feita)).map((r) => r.id);
  const base = regioesVistas.length ? regioesVistas : ['m1'];
  let chaves = Object.keys(GERADORES).filter((g) => base.includes(g.split('.')[0]));
  if (!chaves.length) chaves = Object.keys(GERADORES);
  const fraco = topicoMaisFraco(s);
  const r = rng(newSeed());
  const esc = r.sample(chaves, Math.min(n, chaves.length));
  // Garante pelo menos um exercício da região do tópico mais fraco.
  if (fraco) { const daFraca = chaves.filter((g) => g.split('.')[0] === fraco.topico.split('.')[0]); if (daFraca.length && !esc.some((g) => daFraca.includes(g))) esc[0] = r.pick(daFraca); }
  return esc.map((gen) => ({ gen, seed: newSeed(), nivel: 1 }));
}

export function DesafioMisto({ n = 3, onFim }: { n?: number; onFim: (media: number) => void }) {
  const itens = useMemo(() => escolherGeradores(n).map((g) => ({ g, ex: GERADORES[g.gen](rng(g.seed), g.nivel) })), [n]);
  const [i, setI] = useState(0);
  const [soma, setSoma] = useState(0);
  const it = itens[i];
  return (
    <div className="pilha">
      <span className="rotulo acc">Desafio misto · {i + 1} de {itens.length}</span>
      <div className="cartao"><Exercicio key={it.ex.id} ex={it.ex} faseId="desafio-misto" gen={it.g} onFim={(nota) => { const t = soma + nota; setSoma(t); if (i + 1 >= itens.length) onFim(t / itens.length); else setI(i + 1); }} /></div>
    </div>
  );
}

// ---------- sessão do dia ----------
export function Sessao() {
  const [etapa, setEtapa] = useState(0);
  const cartoes = useMemo(() => revisaoDeHoje(loja.get(), 8), []);
  const fase = useMemo(() => proximaFase(loja.get()), []);
  const [resumo, setResumo] = useState<string[]>([]);
  const avancar = (linha?: string) => { if (linha) setResumo((r) => [...r, linha]); setEtapa((e) => e + 1); window.scrollTo(0, 0); };
  const passos = ['Revisão', 'Fase nova', 'Desafio misto'];
  const topo = (
    <div className="linha">{passos.map((p, k) => <span key={p} className={'pilula ' + (etapa - 1 === k ? 'acc' : etapa - 1 > k ? 'ok' : '')}>{k + 1}. {p}</span>)}</div>
  );
  if (etapa === 0) {
    return (
      <div className="pilha g">
        <h1>Sessão do dia</h1>
        <div className="cartao">
          <p>Três partes, cerca de {Math.max(8, Math.ceil(cartoes.length * 0.4) + (fase?.min ?? 0) + 4)} minutos no total:</p>
          <Rico>{`- **Revisão**: ${cartoes.length ? `${cartoes.length} cartões das duas disciplinas` : 'nada vence hoje'}\n- **Fase nova**: ${fase ? `${fase.regiao.id.toUpperCase()} · ${fase.titulo} (${fase.min} min)` : 'todas as fases prontas já foram feitas'}\n- **Desafio misto**: 3 exercícios gerados do que você já viu`}</Rico>
          <p className="mini">Pode parar em qualquer parte: tudo fica salvo.</p>
          <button className="btn pri" onClick={() => avancar()}>Começar</button>
        </div>
      </div>
    );
  }
  if (etapa === 1) {
    if (!cartoes.length) return <div className="pilha g">{topo}<div className="cartao"><p>Nenhum cartão para hoje.</p><button className="btn pri" onClick={() => avancar('Revisão: em dia.')}>Seguir</button></div></div>;
    return <div className="pilha g">{topo}<RevisaoSessao cartoes={cartoes} onFim={(n) => avancar(`Revisão: lembrou ${n} de ${cartoes.length}.`)} /><button className="btn sm fantasma" onClick={() => avancar('Revisão: pulada.')}>Pular a revisão</button></div>;
  }
  if (etapa === 2) {
    if (!fase) return <div className="pilha g">{topo}<div className="cartao"><p>Você já fez todas as fases prontas. As próximas regiões estão em construção.</p><button className="btn pri" onClick={() => avancar('Fase nova: não havia.')}>Seguir</button></div></div>;
    return <div className="pilha">{topo}<FaseRunner fase={fase} onSair={() => avancar(`Fase "${fase.titulo}": interrompida (fica salva onde parou).`)} onFim={() => avancar(`Fase "${fase.titulo}": concluída.`)} /></div>;
  }
  if (etapa === 3) return <div className="pilha g">{topo}<DesafioMisto onFim={(m) => avancar(`Desafio misto: ${Math.round(m * 100)}%.`)} /><button className="btn sm fantasma" onClick={() => avancar('Desafio misto: pulado.')}>Pular</button></div>;
  return (
    <div className="pilha g">
      <h1>Sessão concluída</h1>
      <div className="cartao">{resumo.map((r, k) => <p key={k}>{r}</p>)}<a className="btn pri" href={link('')}>Voltar ao início</a></div>
    </div>
  );
}

// ---------- caderno de erros ----------
function acharExercicio(e: ErroReg): { ex: Ex; gen?: { gen: string; seed: number; nivel: number } } | null {
  if (e.gen && GERADORES[e.gen.gen]) { const seed = newSeed(), nivel = e.gen.nivel ?? 1; return { ex: GERADORES[e.gen.gen](rng(seed), nivel), gen: { gen: e.gen.gen, seed, nivel } }; }
  for (const f of todasFases()) for (const st of f.steps) if (st.t === 'ex' && st.ex.id === e.exId) return { ex: st.ex };
  return null;
}
const CONSELHO: Record<Causa, string> = {
  conta: 'Erro de conta se resolve desacelerando: escreva cada passo e confira o resultado de outro jeito antes de responder.',
  conceito: 'Erro de conceito pede voltar à lição do tópico e explicar a ideia em voz alta antes de refazer.',
  leitura: 'Erro de leitura: sublinhe o que a pergunta pede (qual operação? qual ordem? qual unidade?) antes de calcular.',
};

function Refazer({ e, onFechar }: { e: ErroReg; onFechar: () => void }) {
  const alvo = useMemo(() => acharExercicio(e), [e.id]); // eslint-disable-line
  if (!alvo) return <p className="sub">Este exercício não existe mais nesta versão do jogo.</p>;
  return (
    <div className="cartao liso">
      <span className="rotulo acc">{alvo.gen ? 'Uma variação nova do mesmo tipo (para não decorar a resposta)' : 'O mesmo exercício'}</span>
      <Exercicio ex={alvo.ex} faseId={e.faseId} gen={alvo.gen} rotuloFim="Fechar" onFim={(nota) => { if (nota >= 0.5) loja.resolverErro(e.id); onFechar(); }} />
    </div>
  );
}

export function Erros() {
  const erros = useEstado((x) => x.erros);
  const [aba, setAba] = useState<'pend' | 'causas' | 'feitos'>('pend');
  const [aberto, setAberto] = useState<string | null>(null);
  const pend = erros.filter((e) => !e.resolvido), feitos = erros.filter((e) => e.resolvido);
  const porCausa = (['conceito', 'conta', 'leitura'] as Causa[]).map((c) => ({ c, n: erros.filter((e) => e.causa === c).length }));
  const semCausa = erros.filter((e) => !e.causa).length;
  const maior = [...porCausa].sort((a, b) => b.n - a.n)[0];
  const porTopico = Object.entries(erros.reduce<Record<string, number>>((a, e) => { a[e.topic] = (a[e.topic] ?? 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const lista = aba === 'pend' ? pend : feitos;

  return (
    <div className="pilha g">
      <h1>Caderno de erros</h1>
      <div className="seg" role="group">
        <button aria-pressed={aba === 'pend'} onClick={() => setAba('pend')}>Para refazer ({pend.length})</button>
        <button aria-pressed={aba === 'causas'} onClick={() => setAba('causas')}>Por que estou errando?</button>
        <button aria-pressed={aba === 'feitos'} onClick={() => setAba('feitos')}>Resolvidos ({feitos.length})</button>
      </div>

      {aba === 'causas' && (
        <div className="pilha">
          <div className="cartao">
            <span className="rotulo">Seus {erros.length} erros, por causa</span>
            {porCausa.map(({ c, n }) => (
              <div key={c}><div className="entre"><span>{CAUSAS[c]}</span><span className="mini">{n}</span></div><div className="barra"><i style={{ width: `${erros.length ? (n / erros.length) * 100 : 0}%` }} /></div></div>
            ))}
            {semCausa > 0 && <p className="mini">{semCausa} ainda sem causa marcada. Abra na aba "Para refazer" e escolha uma.</p>}
            {erros.length === 0 && <p className="sub">Ainda não há erros registrados. Quando houver, aqui aparece o padrão.</p>}
            {maior && maior.n > 0 && <div className="fb neutro"><b>O que mais pesa: {CAUSAS[maior.c].toLowerCase()}.</b><p>{CONSELHO[maior.c]}</p></div>}
          </div>
          {porTopico.length > 0 && (
            <div className="cartao">
              <span className="rotulo">Onde você mais erra</span>
              {porTopico.map(([t, n]) => <div key={t} className="entre"><span>{nomeTopico(t)}</span><span className="pilula">{n}</span></div>)}
            </div>
          )}
        </div>
      )}

      {aba !== 'causas' && lista.length === 0 && <div className="cartao"><p className="sub">{aba === 'pend' ? 'Nada para refazer. Todo exercício que você errar vem para cá sozinho, com a explicação.' : 'Os erros que você refizer e acertar aparecem aqui.'}</p></div>}
      {aba !== 'causas' && lista.map((e) => (
        <div key={e.id} className="cartao">
          <div className="entre"><span className="pilula">{nomeTopico(e.topic)}</span><span className="mini">{dataBR(e.em)}</span></div>
          <Rico>{e.prompt}</Rico>
          <p><span className="mini">Você respondeu:</span> <b>{e.dada}</b> · <span className="mini">Certo:</span> <b><Txt>{e.certa}</Txt></b></p>
          {e.msg && <div className="fb bad"><Txt>{e.msg}</Txt></div>}
          <details><summary className="mini" style={{ cursor: 'pointer' }}>Ver a explicação</summary><Rico>{e.explica}</Rico></details>
          <div className="linha"><span className="mini">Causa:</span>{(Object.keys(CAUSAS) as Causa[]).map((c) => <button key={c} className="btn sm" aria-pressed={e.causa === c} onClick={() => loja.definirCausa(e.id, c)}>{CAUSAS[c]}</button>)}</div>
          {!e.resolvido && aberto !== e.id && <button className="btn pri sm" onClick={() => setAberto(e.id)}>Refazer</button>}
          {aberto === e.id && <Refazer e={e} onFechar={() => setAberto(null)} />}
        </div>
      ))}
    </div>
  );
}
