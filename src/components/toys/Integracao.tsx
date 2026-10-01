// Os dois brinquedos da região de integração:
//  - DominosInducao: a indução como fila de dominós (base = empurrar o primeiro; passo = cada um derruba o próximo).
//  - AegisGrid: o caso da U8 inteiro numa tela: chaves, expressão, tabela-verdade, rede (grafo e matriz) e risco.
import { useEffect, useState } from 'react';
import { Moldura, useHistorico, useModo } from '../Sandbox';
import { AFIRMACOES, expressao, falha, risco, rotasCaem, servidorCai, tabela, variaveis, type Aegis } from '../../lib/integracao';
import { useDesafios, type DesafioBase } from './desafio';
import type { ToyProps } from './tipos';

const pct = (v: number, casas = 1) => (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + '%';

// =====================================================================================================
// 1. DOMINÓS DA INDUÇÃO
// =====================================================================================================
/** base: o primeiro foi empurrado? · quebra: o dominó k NÃO derruba o k+1 (null = todos os elos certos) · inicio: de qual n a fila começa · afirmacao e nTeste: a conferência caso a caso */
export type EstadoDom = { base: boolean; quebra: number | null; afirmacao: string; nTeste: number };
const DOM0: EstadoDom = { base: false, quebra: null, afirmacao: 'soma', nTeste: 1 };
const N = 10;
const domValido = (x: unknown) => !!x && typeof (x as EstadoDom).base === 'boolean' && typeof (x as EstadoDom).nTeste === 'number';
export const caidos = (s: EstadoDom) => (!s.base ? 0 : s.quebra === null ? N : Math.min(N, s.quebra));
const CEN_DOM: { rotulo: string; s: EstadoDom; nota: string }[] = [
  { rotulo: 'Indução completa', s: { ...DOM0, base: true }, nota: 'Base (o primeiro cai) + passo (cada um derruba o próximo) = todos caem, por mais longa que seja a fila.' },
  { rotulo: 'E se… ninguém empurrar o primeiro?', s: { ...DOM0, base: false }, nota: 'Todos os elos estão perfeitos, e nada acontece. Sem o caso base, o passo indutivo não prova nada.' },
  { rotulo: 'E se… um elo falhar?', s: { ...DOM0, base: true, quebra: 6 }, nota: 'O 6 cai e não derruba o 7. A afirmação fica provada só até o 6. O passo precisa valer para TODO k.' },
  { rotulo: '2ⁿ > n²: a base não é o 1', s: { ...DOM0, base: true, afirmacao: 'pot', nTeste: 5 }, nota: 'Confira embaixo: falha em n = 2, 3 e 4. A indução começa no 5. O primeiro dominó pode ser qualquer número.' },
  { rotulo: 'E se… só testar muitos casos?', s: { ...DOM0, base: true, afirmacao: 'primos', nTeste: 39 }, nota: 'n² + n + 41 dá primo para n = 1, 2, …, 39. Aumente o n para 40 e veja. Exemplo não é prova.' },
];
export const DESAFIOS_DOM: DesafioBase<EstadoDom>[] = [
  { id: 'd-todos', texto: 'Faça todos os 10 dominós caírem.', ini: DOM0, falta: (s) => (caidos(s) === N ? null : `Caíram ${caidos(s)}. Precisa da base e de todos os elos.`), depois: 'Dois ingredientes: alguém empurra o primeiro (caso base) e cada dominó derruba o seguinte (passo indutivo).' },
  { id: 'd-base', texto: 'Deixe TODOS os elos funcionando e, mesmo assim, faça nenhum dominó cair.', ini: { ...DOM0, base: true }, falta: (s) => (s.quebra !== null ? 'Os elos têm de estar todos certos.' : caidos(s) === 0 ? null : 'Ainda estão caindo.'), depois: 'Sem o caso base não há prova. É o erro mais comum numa demonstração por indução: fazer só o passo.' },
  { id: 'd-elo', texto: 'Faça cair exatamente os 4 primeiros.', ini: { ...DOM0, base: true }, falta: (s) => (caidos(s) === 4 ? null : `Caíram ${caidos(s)}.`), depois: 'Um elo quebrado entre o 4 e o 5: P(4) vale, mas P(4) não leva a P(5). A partir daí nada se pode afirmar.' },
  { id: 'd-primos', texto: 'A afirmação "n² + n + 41 é sempre primo" passa em todos os testes pequenos. Ache um n em que ela FALHA.', ini: { ...DOM0, base: true, afirmacao: 'primos', nTeste: 1 }, prever: 'Antes de procurar: você acha que ela é verdadeira para todo n? (sim ou não)',
    falta: (s) => { const a = AFIRMACOES.find((x) => x.id === 'primos')!; return s.afirmacao !== 'primos' ? 'Mantenha a afirmação dos primos.' : !a.vale(s.nTeste) ? null : `Com n = ${s.nTeste} ainda dá primo. Continue (dica: use o botão +10).`; }, depois: '40² + 40 + 41 = 1681 = 41 × 41. Trinta e nove acertos seguidos não provaram nada. É por isso que a matemática exige demonstração, e a indução é uma.' },
];

export function DominosInducao({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoDom>(DOM0, chave, domValido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const [nota, setNota] = useState('');
  const { painel } = useDesafios(DESAFIOS_DOM, desafios, modo, h, onProgresso, () => setNota(''));
  const s = h.estado, k = caidos(s), af = AFIRMACOES.find((a) => a.id === s.afirmacao) ?? AFIRMACOES[0];
  const W = 360, H = 150, passo = 32, x0 = 26;
  const inicio = af.id === 'pot' ? 5 : 1;
  const casos = Array.from({ length: 6 }, (_, i) => Math.max(1, s.nTeste - 2) + i);
  return (
    <Moldura titulo="Dominós da indução" modo={modo} onModo={setModo} h={h} cenarios={modo === 'livre' ? CEN_DOM.map((c) => ({ rotulo: c.rotulo, acao: () => { h.mudar(c.s); setNota(c.nota); } })) : undefined}>
      {painel}
      {nota && <div className="fb neutro">{nota}</div>}
      <div className="linha">
        <button className="btn sm" aria-pressed={s.base} onClick={() => h.mudar({ ...s, base: !s.base })}>{s.base ? '◉' : '○'} empurrar o primeiro (caso base)</button>
        <button className="btn sm" disabled={s.quebra === null} onClick={() => h.mudar({ ...s, quebra: null })}>consertar os elos</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="palco" role="img" aria-label={`${k} de ${N} dominós caídos`}>
        <line x1={10} x2={W - 10} y1={118} y2={118} stroke="var(--ink-2)" strokeWidth={2} />
        {Array.from({ length: N }, (_, i) => {
          const n = i + 1, caiu = n <= k, x = x0 + i * passo, quebrado = s.quebra === n;
          return (
            <g key={n}>
              <g transform={`translate(${x} 118) rotate(${caiu ? 62 : 0})`}>
                <rect x={-5} y={-62} width={10} height={62} rx={2} fill={caiu ? 'var(--accent)' : 'var(--paper)'} stroke="var(--ink)" strokeWidth={1.5} />
              </g>
              <text x={x} y={136} textAnchor="middle" fontSize={11} fontWeight={700}>{inicio + i}</text>
              {n < N && (
                <g onClick={() => h.mudar({ ...s, quebra: quebrado ? null : n })} style={{ cursor: 'pointer' }}>
                  <rect x={x + 4} y={8} width={passo - 8} height={34} fill="transparent" />
                  <path d={`M${x + 6},30 Q${x + passo / 2},14 ${x + passo - 6},30`} fill="none" stroke={quebrado ? 'var(--bad)' : 'var(--ok)'} strokeWidth={quebrado ? 3 : 2} strokeDasharray={quebrado ? '3 4' : undefined} />
                  <text x={x + passo / 2} y={12} textAnchor="middle" fontSize={11} fontWeight={800} style={{ fill: quebrado ? 'var(--bad)' : 'var(--ok)' }}>{quebrado ? '✕' : '→'}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <span className="mini">Os arcos em cima são os elos "o dominó k derruba o k + 1". Toque num arco para quebrar ou consertar.</span>
      <div className="vivo" aria-live="polite">
        <div className="linha">
          <span className={'pilula ' + (s.base ? 'ok' : '')} style={s.base ? undefined : { opacity: 0.55, textDecoration: 'line-through' }}>caso base: P({inicio})</span>
          <span className={'pilula ' + (s.quebra === null ? 'ok' : '')} style={s.quebra === null ? undefined : { opacity: 0.55, textDecoration: 'line-through' }}>passo: P(k) ⇒ P(k + 1), para todo k</span>
        </div>
        <div className="f">{k === N ? `Caíram todos: P(n) vale para todo n ≥ ${inicio}.` : k === 0 ? 'Nenhum caiu: nada foi provado.' : `Caíram só ${k}: provado até n = ${inicio + k - 1}, e mais nada.`}</div>
        <span className="mini">{!s.base ? 'Falta o caso base: ninguém empurrou o primeiro.' : s.quebra !== null ? `O passo falha em k = ${inicio + s.quebra - 1}: a corrente para ali.` : 'Base + passo: é a prova por indução. Vale para infinitos casos sem testar um por um.'}</span>
      </div>
      <div className="vivo">
        <span className="rotulo">Conferir uma afirmação caso a caso</span>
        <div className="linha">{AFIRMACOES.map((a) => <button key={a.id} className="btn sm" aria-pressed={s.afirmacao === a.id} onClick={() => h.mudar({ ...s, afirmacao: a.id, nTeste: a.id === 'pot' ? 5 : 1 })}>{a.texto}</button>)}</div>
        <div className="linha">
          <span className="mono">n = {s.nTeste}</span>
          <button className="btn sm" disabled={s.nTeste <= 1} onClick={() => h.mudar({ ...s, nTeste: s.nTeste - 1 })} aria-label="Diminuir n">−</button>
          <button className="btn sm" disabled={s.nTeste >= 60} onClick={() => h.mudar({ ...s, nTeste: s.nTeste + 1 })} aria-label="Aumentar n">+</button>
          <button className="btn sm" disabled={s.nTeste >= 51} onClick={() => h.mudar({ ...s, nTeste: Math.min(60, s.nTeste + 10) })}>+10</button>
        </div>
        {casos.map((n) => <div key={n} className="f" style={n === s.nTeste ? { fontWeight: 800 } : { opacity: 0.75 }}>{af.vale(n) ? '✓' : '✗'} n = {n}: {af.mostra(n)}</div>)}
        <span className="mini">{af.nota}</span>
      </div>
    </Moldura>
  );
}

// =====================================================================================================
// 2. AEGIS-GRID INTERATIVO
// =====================================================================================================
const AEG0: Aegis = { P: false, P2: false, Q: false, R: false, T: false, reserva: false, rota3: false, pp: 0.1, pq: 0.2, pr: 0.2 };
const aegValido = (x: unknown) => !!x && typeof (x as Aegis).P === 'boolean' && typeof (x as Aegis).pp === 'number';
const NOME: Record<string, string> = { P: 'Servidor', P2: 'Servidor reserva', Q: 'Rota 1', R: 'Rota 2', T: 'Rota 3' };
const CEN_AEG: { rotulo: string; s: Partial<Aegis>; nota: string }[] = [
  { rotulo: 'Tudo funcionando', s: { P: false, P2: false, Q: false, R: false, T: false }, nota: 'S = 0: sistema operacional.' },
  { rotulo: 'Cai uma rota só', s: { P: false, Q: true, R: false }, nota: 'Uma rota sozinha não derruba o sistema: Q·R = 1·0 = 0. As rotas são redundantes.' },
  { rotulo: 'Caem as duas rotas', s: { P: false, Q: true, R: true }, nota: 'É a linha que o gabarito do curso esquece de contar: servidor funcionando e, mesmo assim, falha.' },
  { rotulo: 'Cai o servidor', s: { P: true, P2: false, Q: false, R: false }, nota: 'Sem reserva, o servidor sozinho derruba tudo: P + qualquer coisa = 1.' },
  { rotulo: 'E se… houver servidor reserva?', s: { reserva: true, P: true, P2: false, Q: false, R: false }, nota: 'A expressão vira S = P·P₂ + Q·R. Agora o servidor principal pode cair sozinho. Veja o risco total despencar.' },
  { rotulo: 'E se… houver uma terceira rota?', s: { rota3: true, reserva: false }, nota: 'S = P + Q·R·T. Ajuda pouco: o gargalo era o servidor, não as rotas. Compare o risco com o do servidor reserva.' },
];
export const DESAFIOS_AEG: DesafioBase<Aegis>[] = [
  { id: 'ag-rotas', texto: 'Deixe o sistema em FALHA com o servidor central funcionando.', ini: AEG0, falta: (s) => (s.reserva || s.rota3 ? 'Use a configuração original (sem reserva e sem rota 3).' : !falha(s) ? 'O sistema está operacional.' : s.P ? 'O servidor está em falha. Tem que ser com ele funcionando.' : null), depois: 'P = 0, Q = 1, R = 1: é a quinta linha com S = 1 da tabela. O gabarito do curso fala em "quatro cenários"; são cinco.' },
  { id: 'ag-conta', texto: 'Olhe a tabela-verdade da configuração original. Em quantas das 8 situações o sistema falha? Guarde o palpite e depois deixe as chaves na ÚNICA situação de falha em que o servidor está bom.', ini: AEG0, prever: 'Em quantas das 8 linhas S = 1?',
    falta: (s) => (!s.P && s.Q && s.R && !s.reserva && !s.rota3 ? null : 'Procure na tabela a linha com P = 0 e S = 1 e ponha as chaves assim.'), depois: 'São 5 de 8: as quatro com P = 1, mais P = 0, Q = 1, R = 1.' },
  { id: 'ag-risco', texto: 'O risco total está em 13,6% (servidor 10%, cada rota 20%). A empresa só pode pagar UMA melhoria: servidor reserva ou terceira rota. Escolha a que deixa o risco abaixo de 5%.', ini: AEG0, prever: 'Antes de testar: qual das duas? (servidor ou rota)',
    falta: (s) => (s.pp !== 0.1 || s.pq !== 0.2 || s.pr !== 0.2 ? 'Não mexa nas probabilidades: só na configuração.' : s.reserva && s.rota3 ? 'Só uma melhoria.' : risco(s).total < 0.05 ? null : `O risco está em ${pct(risco(s).total)}.`), depois: 'O servidor reserva derruba o risco para cerca de 5,0% (4,96%); a terceira rota só para 10,7%. O servidor era o ponto de articulação do grafo: investir no gargalo rende mais. É a "decisão estratégica" que a etapa 3 da atividade pede.' },
  { id: 'ag-reserva', texto: 'Com o servidor reserva ligado, deixe o sistema em FALHA sem que nenhuma rota falhe.', ini: { ...AEG0, reserva: true }, falta: (s) => (!s.reserva ? 'Mantenha o servidor reserva.' : s.Q || s.R ? 'Nenhuma rota pode estar em falha.' : falha(s) ? null : 'O sistema está operacional.'), depois: 'Agora precisam cair os DOIS servidores: P·P₂. Um E no lugar de uma variável sozinha: é assim que a redundância aparece na expressão.' },
];

export function AegisGrid({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<Aegis>(AEG0, chave, aegValido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const [nota, setNota] = useState('');
  const { painel } = useDesafios(DESAFIOS_AEG, desafios, modo, h, onProgresso, () => setNota(''));
  const s = h.estado, vs = variaveis(s), tab = tabela(s), F = falha(s), rk = risco(s), nFalha = tab.filter((l) => l.S).length;
  const atual = vs.map((v) => (s[v] ? 1 : 0)).join('');
  const W = 360, H = 190;
  // rede: Origem → servidor(es) → rotas → Destino
  const servs = s.reserva ? [{ id: 'P', y: 60 }, { id: 'P2', y: 130 }] : [{ id: 'P', y: 95 }];
  const rotas = s.rota3 ? [{ id: 'Q', y: 40 }, { id: 'R', y: 95 }, { id: 'T', y: 150 }] : [{ id: 'Q', y: 55 }, { id: 'R', y: 135 }];
  const cor = (ruim: boolean) => (ruim ? 'var(--bad)' : 'var(--ok)');
  const noRede = (x: number, y: number, rot: string, ruim: boolean, onClick?: () => void) => (
    <g key={rot + y} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <circle cx={x} cy={y} r={24} fill="transparent" />
      <circle cx={x} cy={y} r={17} fill="var(--paper)" stroke={cor(ruim)} strokeWidth={3.5} strokeDasharray={ruim ? '4 3' : undefined} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={800}>{rot}</text>
    </g>
  );
  const nos = ['O', ...servs.map((x) => x.id), ...rotas.map((x) => x.id), 'D'];
  const liga = (a: string, b: string) => (a === 'O' && servs.some((x) => x.id === b)) || (servs.some((x) => x.id === a) && rotas.some((x) => x.id === b)) || (rotas.some((x) => x.id === a) && b === 'D');
  const M: number[][] = nos.map((a) => nos.map((b) => (liga(a, b) || liga(b, a) ? 1 : 0)));
  const Chave = ({ v }: { v: 'P' | 'P2' | 'Q' | 'R' | 'T' }) => <button className="btn sm" aria-pressed={s[v]} onClick={() => h.mudar({ ...s, [v]: !s[v] })}>{s[v] ? '✕' : '✓'} {NOME[v]} {s[v] ? 'FALHA' : 'ok'}</button>;
  const Prob = ({ k, rot }: { k: 'pp' | 'pq' | 'pr'; rot: string }) => <label className="linha"><span className="mono" style={{ minWidth: 150 }}>{rot}: {pct(s[k], 0)}</span><input type="range" min={0} max={50} step={5} value={Math.round(s[k] * 100)} onChange={(e) => h.mudar({ ...s, [k]: Number(e.target.value) / 100 })} style={{ flex: 1 }} aria-label={rot} /></label>;
  return (
    <Moldura titulo="Aegis-Grid" modo={modo} onModo={setModo} h={h} cenarios={modo === 'livre' ? CEN_AEG.map((c) => ({ rotulo: c.rotulo, acao: () => { h.mudar({ ...s, ...c.s }); setNota(c.nota); } })) : undefined}>
      {painel}
      {nota && <div className="fb neutro">{nota}</div>}
      <div className="linha">{vs.map((v) => <Chave key={v} v={v} />)}</div>
      <div className="linha">
        <button className="btn sm" aria-pressed={s.reserva} onClick={() => h.mudar({ ...s, reserva: !s.reserva, P2: false })}>{s.reserva ? '◉' : '○'} servidor reserva</button>
        <button className="btn sm" aria-pressed={s.rota3} onClick={() => h.mudar({ ...s, rota3: !s.rota3, T: false })}>{s.rota3 ? '◉' : '○'} terceira rota</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="palco" role="img" aria-label={F ? 'Sistema em falha' : 'Sistema operacional'}>
        {servs.map((a) => <line key={'o' + a.id} x1={40} y1={95} x2={140} y2={a.y} stroke={cor(s[a.id as 'P'])} strokeWidth={2.5} />)}
        {servs.flatMap((a) => rotas.map((b) => <line key={a.id + b.id} x1={140} y1={a.y} x2={240} y2={b.y} stroke={cor(s[a.id as 'P'] || s[b.id as 'Q'])} strokeWidth={2.5} />))}
        {rotas.map((b) => <line key={'d' + b.id} x1={240} y1={b.y} x2={325} y2={95} stroke={cor(s[b.id as 'Q'])} strokeWidth={2.5} />)}
        {noRede(40, 95, 'origem', false)}
        {servs.map((a) => noRede(140, a.y, a.id === 'P2' ? 'P₂' : 'P', s[a.id as 'P'], () => h.mudar({ ...s, [a.id]: !s[a.id as 'P'] })))}
        {rotas.map((b) => noRede(240, b.y, b.id, s[b.id as 'Q'], () => h.mudar({ ...s, [b.id]: !s[b.id as 'Q'] })))}
        {noRede(325, 95, 'destino', F)}
        <text x={W / 2} y={184} textAnchor="middle" fontSize={13} fontWeight={800} style={{ fill: cor(F) }}>{F ? 'SISTEMA EM FALHA (S = 1)' : 'sistema operacional (S = 0)'}</text>
      </svg>
      <span className="mini">Toque num servidor ou numa rota para derrubar ou consertar. Vermelho tracejado = em falha.</span>

      <div className="vivo" aria-live="polite">
        <span className="rotulo">Lógica e álgebra booleana</span>
        <div className="f">p ∨ (q ∧ r) → <b>{expressao(s)}</b></div>
        <div className="f">agora: {servidorCai(s) ? 1 : 0} + {rotasCaem(s) ? 1 : 0} = <b>{F ? 1 : 0}</b> · falha em <b>{nFalha}</b> de {tab.length} situações</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tv" style={{ fontSize: '.82rem' }}><thead><tr>{vs.map((v) => <th key={v}>{v === 'P2' ? 'P₂' : v}</th>)}<th>S</th></tr></thead>
            <tbody>{tab.map((l) => <tr key={l.ent.join('')} className={l.ent.join('') === atual ? 'atual' : ''}>{l.ent.map((x, i) => <td key={i}>{x}</td>)}<td style={l.S ? { fontWeight: 800, color: 'var(--bad)' } : undefined}>{l.S}</td></tr>)}</tbody></table>
        </div>
      </div>
      <div className="vivo">
        <span className="rotulo">Probabilidade (falhas independentes)</span>
        <Prob k="pp" rot="P(servidor falha)" /><Prob k="pq" rot="P(rota 1 falha)" /><Prob k="pr" rot="P(rota 2 falha)" />
        <div className="f">servidor{s.reserva ? 'es (os dois)' : ''}: {pct(rk.serv, 2)} · todas as rotas: {pct(rk.rotas, 2)}</div>
        <div className="f">risco total = 1 − (1 − {pct(rk.serv, 2)})·(1 − {pct(rk.rotas, 2)}) = <b>{pct(rk.total, 2)}</b></div>
        <span className="mini">Falha se o servidor cai OU as rotas caem: pelo complemento, 1 menos a chance de as duas partes aguentarem. {s.reserva ? 'O reserva tem a mesma chance de falha do principal.' : ''}</span>
      </div>
      <div className="vivo">
        <span className="rotulo">Grafo e matriz de adjacência</span>
        <div style={{ overflowX: 'auto' }}>
          <table className="tv" style={{ fontSize: '.8rem' }}><thead><tr><th></th>{nos.map((n) => <th key={n}>{n === 'P2' ? 'P₂' : n}</th>)}<th>grau</th></tr></thead>
            <tbody>{M.map((l, i) => <tr key={i}><th>{nos[i] === 'P2' ? 'P₂' : nos[i]}</th>{l.map((x, j) => <td key={j} style={x ? { fontWeight: 800 } : { opacity: 0.45 }}>{x}</td>)}<td><b>{l.reduce((a, b) => a + b, 0)}</b></td></tr>)}</tbody></table>
        </div>
        <span className="mini">O = origem, D = destino. A soma da linha é o grau: quanto maior, mais central. {s.reserva ? 'Com o reserva, nenhum vértice sozinho isola a origem do destino.' : 'O servidor P é um ponto de articulação: tirando ele, a origem fica isolada do destino.'}</span>
      </div>
    </Moldura>
  );
}
