import { MUNDOS, REGIOES, fase as acharFase, nomeTopico, regiao as acharRegiao } from '../content';
import { FaseRunner } from '../components/FaseRunner';
import { diasEntre, dataBR, hoje, situacoes } from '../lib/datas';
import { MEDALHAS, cardsDisponiveis, dominio, estrelas, plano, progressoRegiao, proximaFase, recomendada, revisaoDeHoje, topicoMaisFraco, topicosDaRegiao } from '../lib/progresso';
import { useEstado } from '../lib/store';
import { ir, link } from '../rota';

const FOCO = { A1: 'só o que cai na A1: U1 a U4', A2: 'tudo, para a A2', A3: 'tudo, para a A3' } as const;
const TIPO: Record<string, string> = { leitura: 'Leitura', licao: 'Lição', lab: 'Laboratório', desafio: 'Desafio', questoes: 'Questões reais', chefe: 'Chefão' };

export function Painel({ diasFora }: { diasFora: number }) {
  const s = useEstado((x) => x);
  const prox = proximaFase(s);
  const revisar = revisaoDeHoje(s);
  const fraco = topicoMaisFraco(s);
  const pendentes = s.erros.filter((e) => !e.resolvido).length;
  const pl = plano(s);
  const diasBackup = s.ultimoBackup ? diasEntre(s.ultimoBackup, hoje()) : null;
  const temProgresso = Object.keys(s.fases).length > 0 || s.diario.length > 0;

  return (
    <div className="pilha g">
      {diasFora >= 3 && (
        <div className="cartao liso" style={{ borderColor: 'var(--accent)' }}>
          <b>Que bom te ver de volta.</b>
          <p className="sub">Faz {diasFora} dias. Nada foi perdido e nada "zerou". O melhor recomeço é uma revisão curta do que você já viu.</p>
          <a className="btn pri sm" href={link('revisao')}>Revisão de 5 minutos</a>
        </div>
      )}

      <div className="cartao">
        <span className="rotulo acc">Hoje</span>
        <h1>Sessão do dia</h1>
        <p className="sub">15 a 20 minutos: revisão, uma fase nova e um desafio misto. Feita para caber no ônibus.</p>
        <div className="linha">
          <a className="btn pri" href={link('sessao')}>Começar sessão</a>
          {prox && <a className="btn" href={link('fase/' + prox.id)}>{s.andamento[prox.id] !== undefined ? 'Continuar de onde parei' : 'Só a próxima fase'}</a>}
        </div>
        {prox && <p className="mini">Próxima: {prox.regiao.id.toUpperCase()} · {prox.titulo} ({prox.min} min)</p>}
      </div>

      <div className="cartao">
        <span className="rotulo">Contagem até as provas</span>
        <div className="contagem">
          {situacoes().map(({ prova, estado, dias }) => (
            <div className="c" key={prova.id}>
              <span className="mini">{prova.nome} · {prova.pontos} pts</span>
              <b>{estado === 'futura' ? `${dias} d` : estado === 'aberta' ? 'aberta' : 'passou'}</b>
              <span className="mini">{estado === 'aberta' ? `fecha em ${dias} d (${dataBR(prova.fecha).slice(0, 5)})` : `${dataBR(prova.abre).slice(0, 5)} a ${dataBR(prova.fecha).slice(0, 5)}`}</span>
            </div>
          ))}
        </div>
        <p className="sub">
          <b>Foco agora: {pl.foco}</b> ({FOCO[pl.foco]}). {pl.faltam === 0
            ? `Você já fez as ${pl.total} fases deste foco.`
            : <>Faltam <b>{pl.faltam}</b> de {pl.total} fases (cerca de {pl.minutos} min). Até {dataBR(pl.meta).slice(0, 5)}, {pl.dias === 1 ? 'hoje' : `${pl.dias} dias`}: dá <b>{pl.porDia} min por dia</b>, para chegar com folga.</>}
        </p>
        <p className="mini">{pl.foco === 'A1' ? 'A partir de 12/11 o foco passa sozinho para a A2 (tudo).' : 'Nada está bloqueado: o foco só muda o que é sugerido primeiro.'} Aprovação com 70. A A3 vale 40 e não tem segunda oportunidade. <a href={link('regras')}>Regras da prova</a></p>
      </div>

      <div className="grade2">
        <a className="cartao" href={link('revisao')} style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="rotulo">Revisão do dia</span>
          <h2>{revisar.length ? `${revisar.length} cartões` : 'Em dia'}</h2>
          <p className="sub">{revisar.length ? 'Matemática e Exploração misturadas.' : `${cardsDisponiveis(s).length} cartões no baralho; nenhum vence hoje.`}</p>
        </a>
        <a className="cartao" href={link('erros')} style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="rotulo">Caderno de erros</span>
          <h2>{pendentes ? `${pendentes} para refazer` : 'Vazio'}</h2>
          <p className="sub">{fraco ? `Tópico mais fraco: ${nomeTopico(fraco.topico)} (${Math.round(fraco.dom * 100)}%).` : 'Aqui aparece o tópico em que você mais erra.'}</p>
        </a>
      </div>

      {s.medalhas.length > 0 && (
        <div className="cartao">
          <span className="rotulo">Medalhas (por domínio, não por tempo)</span>
          <div className="linha">{s.medalhas.map((m) => <span key={m} className="pilula ouro" title={MEDALHAS[m]?.como}>★ {MEDALHAS[m]?.nome ?? m}</span>)}</div>
        </div>
      )}

      {temProgresso && (
        <p className="mini">
          {diasBackup === null ? 'Ainda sem backup do progresso.' : diasBackup === 0 ? 'Último backup: hoje.' : `Último backup há ${diasBackup} dia${diasBackup === 1 ? '' : 's'}.`}{' '}
          <a href={link('ajustes')}>Fazer backup</a>
        </p>
      )}
    </div>
  );
}

export function Mapa() {
  const s = useEstado((x) => x);
  return (
    <div className="pilha g">
      <h1>Mapa</h1>
      {MUNDOS.map((m) => (
        <section key={m.id} className="mundo">
          <span className="rotulo acc">Mundo {m.id === 'mat' ? 1 : 2}</span>
          <h2>{m.nome}</h2>
          <div className="trilha">
            {REGIOES.filter((r) => r.mundo === m.id).map((r) => {
              const p = progressoRegiao(r, s), sugerida = r.pronto && !p.completa && recomendada(r, s);
              return (
                <a key={r.id} className={'no' + (p.completa ? ' feita' : r.pronto ? ' atual' : ' fechada')} href={link('regiao/' + r.id)}>
                  <div className="eixo"><div className="bola">{p.completa ? '✓' : r.id.toUpperCase()}</div><div className="fio" /></div>
                  <div className="corpo">
                    <div className="entre"><h3>{r.nome}</h3><span className="pilula">{r.unidades}</span></div>
                    <p className="sub">{r.tese}</p>
                    {r.pronto ? (
                      <div className="linha" style={{ marginTop: 6 }}><div className="barra ok" style={{ flex: 1, minWidth: 100 }}><i style={{ width: `${(p.feitas / Math.max(1, p.total)) * 100}%` }} /></div><span className="mini">{p.feitas}/{p.total} fases</span>{sugerida && <span className="pilula acc">recomendado agora</span>}</div>
                    ) : <span className="pilula">em construção{r.cards.length ? ` · ${r.cards.length} cartões já na revisão` : ''}</span>}
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function RegiaoPage({ id }: { id: string }) {
  const s = useEstado((x) => x);
  const r = acharRegiao(id);
  if (!r) return <p>Região não encontrada. <a href={link('mapa')}>Voltar ao mapa</a></p>;
  const p = progressoRegiao(r, s);
  const primeiraAberta = r.fases.find((f) => !s.fases[f.id]?.feita);
  const tops = topicosDaRegiao(s, r.id);
  return (
    <div className="pilha g">
      <a href={link('mapa')} className="mini">← Mapa</a>
      <div>
        <span className="rotulo acc">{r.id.toUpperCase()} · {r.unidades}</span>
        <h1>{r.nome}</h1>
        <p className="sub">{r.tese}</p>
      </div>
      {!r.pronto && (
        <div className="cartao">
          <b>Região em construção.</b>
          <p className="sub">As fases desta região entram nas próximas entregas. {r.cards.length > 0 && `Os ${r.cards.length} cartões dela já aparecem na revisão do dia.`}</p>
        </div>
      )}
      {r.pronto && (
        <div className="trilha">
          {r.fases.map((f, k) => {
            const st = s.fases[f.id], atual = f.id === primeiraAberta?.id;
            return (
              <a key={f.id} className={'no' + (st?.feita ? ' feita' : atual ? ' atual' : '') + (f.tipo === 'chefe' ? ' chefe' : '')} href={link('fase/' + f.id)}>
                <div className="eixo"><div className="bola">{st?.feita ? '✓' : f.tipo === 'chefe' ? '♛' : k + 1}</div><div className="fio" /></div>
                <div className="corpo">
                  <div className="entre"><h3>{f.titulo}{f.unidade && <> <span className="pilula">{f.unidade}</span></>}</h3>{st?.feita && <span className="estrelas">{'★'.repeat(estrelas(st.melhor))}</span>}</div>
                  <p className="sub">{f.resumo}</p>
                  <span className="mini">{TIPO[f.tipo]} · {f.min} min{s.andamento[f.id] !== undefined ? ' · em andamento' : ''}</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
      {tops.length > 0 && (
        <div className="cartao">
          <span className="rotulo">Domínio por tópico</span>
          {tops.map((t) => { const d = dominio(s, t) ?? 0; return (
            <div key={t}><div className="entre"><span>{nomeTopico(t)}</span><span className="mini">{Math.round(d * 100)}% · {s.topicos[t].total} exercícios</span></div><div className={'barra' + (d >= 0.8 ? ' ok' : '')}><i style={{ width: `${d * 100}%` }} /></div></div>
          ); })}
          <p className="mini">Região: {p.feitas}/{p.total} fases{p.feitas ? ` · média ${Math.round(p.media * 100)}%` : ''}.</p>
        </div>
      )}
    </div>
  );
}

export function FasePage({ id }: { id: string }) {
  const f = acharFase(id);
  if (!f) return <p>Fase não encontrada. <a href={link('mapa')}>Voltar ao mapa</a></p>;
  return <FaseRunner key={id} fase={f} onSair={() => ir('regiao/' + f.regiao.id)} />;
}
