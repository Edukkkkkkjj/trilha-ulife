// Brinquedos da camada C3 de Exploração Digital:
//  - TreinadorModelo: aprender é ajustar números até o erro diminuir.
//  - AutomacaoIA: um filtro de spam feito com regras escritas × um feito com exemplos rotulados.
//  - GeradorTexto: um "modelo de linguagem" de brinquedo, que escreve escolhendo a próxima palavra.
import { useEffect, useMemo, useState } from 'react';
import { Moldura, useHistorico, useModo } from '../Sandbox';
import { CORPORA, FIM, PALAVRAS, TESTE, TREINO, acertos, bigramas, dados, erro, inicios, melhorReta, passo, pesos, porModelo, porRegra, proximas } from '../../lib/aprendizado';
import { newSeed, rng } from '../../lib/rng';
import { useDesafios, type DesafioBase } from './desafio';
import type { ToyProps } from './tipos';

const n2 = (v: number, casas = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

// =====================================================================================================
// 1. TREINADOR DE MODELO
// =====================================================================================================
export type EstadoTreino = { a: number; b: number; passos: number; estranho: boolean };
const TR0: EstadoTreino = { a: 0.5, b: 3, passos: 0, estranho: false };
const trValido = (x: unknown) => !!x && typeof (x as EstadoTreino).a === 'number' && typeof (x as EstadoTreino).passos === 'number';
export const treinar = (s: EstadoTreino, vezes: number): EstadoTreino => { let { a, b } = s; const pts = dados(s.estranho); for (let i = 0; i < vezes; i++) [a, b] = passo(a, b, pts); return { ...s, a, b, passos: s.passos + vezes }; };
export const DESAFIOS_TREINO: DesafioBase<EstadoTreino>[] = [
  { id: 'tr-mao', texto: 'Você é o "algoritmo": ajuste a inclinação e a altura da reta com os botões até o erro ficar abaixo de 1,00.', ini: TR0, falta: (s) => (s.passos > 0 ? 'Sem usar o botão de treino: só os botões de + e −.' : erro(s.a, s.b, dados(s.estranho)) < 1 ? null : `O erro está em ${n2(erro(s.a, s.b, dados(s.estranho)))}.`), depois: 'Você fez o que o treino faz: mexeu em dois números olhando só para o erro. Em nenhum momento foi preciso "entender" o que são horas ou energia.' },
  { id: 'tr-auto', texto: 'Agora deixe a máquina fazer. Partindo de uma reta ruim, aperte o treino até o erro ficar abaixo de 0,25.', ini: { a: 0, b: 0, passos: 0, estranho: false }, prever: 'Antes: de quantos passos de treino você acha que ela precisa?', falta: (s) => (s.passos === 0 ? 'Aperte "1 passo de treino".' : erro(s.a, s.b, dados(s.estranho)) < 0.25 ? null : `O erro está em ${n2(erro(s.a, s.b, dados(s.estranho)))}. Mais passos.`), depois: 'Cada passo mexe os dois números um pouquinho na direção que diminui o erro. Aprendizado de máquina é isto: minimizar o erro sobre os dados de exemplo.' },
  { id: 'tr-estranho', texto: 'Ligue o "dado estranho" (uma medição muito fora do padrão) e treine de novo, uns 300 passos. Veja o que acontece com a reta.', ini: { a: 2.1, b: 0.6, passos: 0, estranho: false }, falta: (s) => (!s.estranho ? 'Ligue o dado estranho.' : s.passos < 100 ? 'Treine mais (use o botão de 100 passos).' : null), depois: 'Um único dado ruim entortou a reta inteira, e ela agora erra para todo mundo. O modelo não sabe que aquele dado é ruim: ele só minimiza o erro. Por isso o curso diz que dados "incompletos, enviesados ou mal estruturados" comprometem o resultado.' },
];

export function TreinadorModelo({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoTreino>(TR0, chave, trValido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const { painel } = useDesafios(DESAFIOS_TREINO, desafios, modo, h, onProgresso);
  const s = h.estado, pts = dados(s.estranho), e = erro(s.a, s.b, pts), [ma, mb] = melhorReta(pts);
  const W = 360, H = 240, X = (x: number) => 30 + (x / 9) * (W - 44), Y = (y: number) => H - 26 - (Math.max(0, Math.min(20, y)) / 20) * (H - 44);
  const Botao = ({ k, d, rot }: { k: 'a' | 'b'; d: number; rot: string }) => <button className="btn sm" onClick={() => h.mudar({ ...s, [k]: Math.round((s[k] + d) * 100) / 100, passos: 0 })} aria-label={rot}>{d > 0 ? '+' : '−'}</button>;
  return (
    <Moldura titulo="Treinador de modelo" modo={modo} onModo={setModo} h={h}>
      {painel}
      <div className="linha">
        <span className="linha" style={{ gap: 4 }}><span className="mono">inclinação a = {n2(s.a)}</span><Botao k="a" d={-0.25} rot="Diminuir inclinação" /><Botao k="a" d={0.25} rot="Aumentar inclinação" /></span>
        <span className="linha" style={{ gap: 4 }}><span className="mono">altura b = {n2(s.b)}</span><Botao k="b" d={-0.5} rot="Diminuir altura" /><Botao k="b" d={0.5} rot="Aumentar altura" /></span>
      </div>
      <div className="linha">
        <button className="btn sm pri" onClick={() => h.mudar(treinar(s, 1))}>1 passo de treino</button>
        <button className="btn sm" onClick={() => h.mudar(treinar(s, 100))}>100 passos</button>
        <button className="btn sm" aria-pressed={s.estranho} onClick={() => h.mudar({ ...s, estranho: !s.estranho, passos: 0 })}>{s.estranho ? '◉' : '○'} dado estranho</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="palco" role="img" aria-label="Pontos de dados e a reta do modelo">
        <line x1={X(0)} x2={X(9)} y1={Y(0)} y2={Y(0)} stroke="var(--ink-2)" /><line x1={X(0)} x2={X(0)} y1={Y(0)} y2={Y(20)} stroke="var(--ink-2)" />
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize={10}>horas de uso</text><text x={6} y={14} fontSize={10}>energia</text>
        {pts.map(([x, y], i) => <line key={'r' + i} x1={X(x)} x2={X(x)} y1={Y(y)} y2={Y(s.a * x + s.b)} stroke="var(--bad)" strokeWidth={2} opacity={0.6} />)}
        <line x1={X(0)} y1={Y(s.b)} x2={X(9)} y2={Y(s.a * 9 + s.b)} stroke="var(--accent)" strokeWidth={3} />
        {pts.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={i === 8 ? 7 : 5} fill={i === 8 ? 'var(--gold)' : 'var(--ink)'} />)}
      </svg>
      <span className="mini">Pontos: o que foi medido. Reta azul: o que o modelo prevê. Traços vermelhos: quanto ele erra em cada ponto.</span>
      <div className="vivo" aria-live="polite">
        <div className="f">modelo: energia = {n2(s.a)} × horas + {n2(s.b)}</div>
        <div className="f">erro médio (ao quadrado) = <b>{n2(e)}</b> · passos de treino: {s.passos}</div>
        <div className="f">previsão para 10 horas: {n2(s.a * 10 + s.b, 1)}</div>
        <span className="mini">O menor erro possível com esses dados é {n2(erro(ma, mb, pts))} (reta {n2(ma)} × horas + {n2(mb)}). Nunca chega a zero: dado real tem ruído.</span>
      </div>
    </Moldura>
  );
}

// =====================================================================================================
// 2. AUTOMAÇÃO × IA (filtro de spam)
// =====================================================================================================
export type EstadoSpam = { modo: 'regra' | 'ia'; regra: string[]; rotulos: boolean[] };
const SP0: EstadoSpam = { modo: 'regra', regra: [], rotulos: TREINO.map((m) => m.spam) };
const spValido = (x: unknown) => !!x && ['regra', 'ia'].includes((x as EstadoSpam).modo) && Array.isArray((x as EstadoSpam).rotulos) && (x as EstadoSpam).rotulos.length === TREINO.length;
export const classificador = (s: EstadoSpam) => { const w = pesos(TREINO.map((m, i) => ({ m, rotulo: s.rotulos[i] }))); return (m: (typeof TESTE)[number]) => (s.modo === 'regra' ? porRegra(m, s.regra) : porModelo(m, w)); };
export const DESAFIOS_SPAM: DesafioBase<EstadoSpam>[] = [
  { id: 'sp-regra', texto: 'Automação: escreva a regra. Escolha as palavras que marcam uma mensagem como spam até acertar as 4 mensagens de teste.', ini: SP0, falta: (s) => (s.modo !== 'regra' ? 'Fique no modo "Regra escrita".' : acertos(TESTE, classificador(s)) === 4 ? null : `Acertou ${acertos(TESTE, classificador(s))} de 4. Cuidado com palavras que também aparecem em mensagens boas.`), depois: 'A regra é explícita: qualquer pessoa lê e sabe por que uma mensagem foi barrada. É auditável. Mas alguém teve de pensar nela, e ela não muda sozinha.' },
  { id: 'sp-modelo', texto: 'IA: agora não escreva regra nenhuma. Mude para "Modelo aprendido" e veja quantas ele acerta só com os 6 exemplos rotulados.', ini: SP0, prever: 'Antes de mudar: quantas das 4 ele vai acertar?', falta: (s) => (s.modo !== 'ia' ? 'Mude para "Modelo aprendido".' : acertos(TESTE, classificador(s)) === 4 ? null : 'Os rótulos de treino foram alterados. Deixe-os como vieram.'), depois: 'Ninguém disse ao modelo que "clique" é suspeito e "reunião" não é. Ele tirou isso dos exemplos. É a diferença do curso: a automação segue regras predefinidas; a IA aprende e infere a partir de dados.' },
  { id: 'sp-vies', texto: 'Ensine errado: no modo "Modelo aprendido", rotule as duas mensagens de reunião como spam. Depois veja o que ele faz com a mensagem de teste "Reunião urgente amanhã cedo".', ini: { ...SP0, modo: 'ia' }, falta: (s) => (s.modo !== 'ia' ? 'Fique no modo "Modelo aprendido".' : classificador(s)(TESTE[1]) ? null : 'A mensagem de reunião ainda passa. Rotule como spam os dois exemplos que têm "reunião".'), depois: 'O modelo aprendeu exatamente o que os exemplos mostraram, e agora barra reuniões de verdade. Ele não avisa que os rótulos estavam errados. É assim que nasce o viés algorítmico: dados históricos tortos, modelo torto.' },
];

export function AutomacaoIA({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoSpam>(SP0, chave, spValido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const { painel } = useDesafios(DESAFIOS_SPAM, desafios, modo, h, onProgresso);
  const s = h.estado, w = pesos(TREINO.map((m, i) => ({ m, rotulo: s.rotulos[i] }))), f = classificador(s), ok = acertos(TESTE, f);
  return (
    <Moldura titulo="Automação × IA" modo={modo} onModo={setModo} h={h}>
      {painel}
      <div className="seg" role="group" aria-label="Como o filtro decide">
        <button aria-pressed={s.modo === 'regra'} onClick={() => h.mudar({ ...s, modo: 'regra' })}>Regra escrita</button>
        <button aria-pressed={s.modo === 'ia'} onClick={() => h.mudar({ ...s, modo: 'ia' })}>Modelo aprendido</button>
      </div>
      {s.modo === 'regra' ? (
        <div className="vivo">
          <span className="rotulo">A regra (você escreve)</span>
          <div className="f" style={{ whiteSpace: 'normal' }}>É spam SE contém: {s.regra.length ? s.regra.join(' OU ') : '(nenhuma palavra escolhida)'}</div>
          <div className="linha">{PALAVRAS.map((p) => <button key={p} className="btn sm" aria-pressed={s.regra.includes(p)} onClick={() => h.mudar({ ...s, regra: s.regra.includes(p) ? s.regra.filter((x) => x !== p) : [...s.regra, p] })}>{p}</button>)}</div>
        </div>
      ) : (
        <div className="vivo">
          <span className="rotulo">Os exemplos (você rotula; o modelo aprende)</span>
          {TREINO.map((m, i) => <button key={m.id} className="btn sm" style={{ justifyContent: 'space-between', textAlign: 'left', whiteSpace: 'normal' }} onClick={() => h.mudar({ ...s, rotulos: s.rotulos.map((r, k) => (k === i ? !r : r)) })}><span>{m.texto}</span><b style={{ color: s.rotulos[i] ? 'var(--bad)' : 'var(--ok)' }}>{s.rotulos[i] ? 'spam' : 'ok'}</b></button>)}
          <span className="rotulo">O que ele aprendeu (pesos)</span>
          <div className="f" style={{ whiteSpace: 'normal' }}>{PALAVRAS.map((p) => `${p}: ${w[p] > 0 ? '+' : ''}${w[p]}`).join(' · ')}</div>
          <span className="mini">Peso positivo puxa para spam; negativo, para mensagem boa. Aqui são 6 números e dá para ler. Um modelo de verdade tem milhões ou bilhões: por isso se diz que é opaco.</span>
        </div>
      )}
      <div className="vivo" aria-live="polite">
        <span className="rotulo">Mensagens de teste (o filtro nunca viu)</span>
        {TESTE.map((m) => { const d = f(m); return <div key={m.id} className="f" style={{ whiteSpace: 'normal' }}>{d === m.spam ? '✓' : '✗'} "{m.texto}" → <b style={{ color: d ? 'var(--bad)' : 'var(--ok)' }}>{d ? 'barrada' : 'entregue'}</b>{d !== m.spam && <span className="mini"> (era {m.spam ? 'spam' : 'mensagem boa'})</span>}</div>; })}
        <div className="f">Acertos: <b>{ok}</b> de {TESTE.length}</div>
      </div>
    </Moldura>
  );
}

// =====================================================================================================
// 3. GERADOR DE TEXTO DE BRINQUEDO
// =====================================================================================================
export type EstadoGerador = { corpus: number; texto: string[] };
const GE0: EstadoGerador = { corpus: 0, texto: ['o'] };
const geValido = (x: unknown) => !!x && typeof (x as EstadoGerador).corpus === 'number' && Array.isArray((x as EstadoGerador).texto) && (x as EstadoGerador).texto.length > 0;
const frasesDe = (c: number) => (c === 2 ? [...CORPORA[0].frases, ...CORPORA[1].frases] : CORPORA[c].frases);
export const repete = (t: string[]) => t.length >= 6 && t.slice(0, -2).some((p, i) => p === t[t.length - 2] && t[i + 1] === t[t.length - 1]);
export const DESAFIOS_GERADOR: DesafioBase<EstadoGerador>[] = [
  { id: 'ge-frase', texto: 'Escreva uma frase de pelo menos 5 palavras escolhendo, a cada vez, uma das próximas palavras que o modelo oferece.', ini: GE0, falta: (s) => (s.texto.filter((p) => p !== FIM).length >= 5 ? null : `Sua frase tem ${s.texto.filter((p) => p !== FIM).length} palavra(s).`), depois: 'O modelo só sabe uma coisa: depois de cada palavra, quais costumam vir. Repetindo essa escolha, sai um texto. Um GPT faz isso com um pedaço de palavra de cada vez, olhando o texto inteiro que veio antes.' },
  { id: 'ge-prompt', texto: 'O "prompt" é o começo que você dá. Troque para o conjunto "Tecnologia", comece por "a" e complete até 5 palavras. Compare com o que saiu no conjunto "Igreja".', ini: { corpus: 0, texto: ['a'] }, falta: (s) => (s.corpus !== 1 ? 'Troque para o conjunto "Tecnologia".' : s.texto[0] !== 'a' ? 'Comece por "a".' : s.texto.filter((p) => p !== FIM).length >= 5 ? null : 'Continue até 5 palavras.'), depois: 'Mesmo começo, textos diferentes: o que o modelo "sabe" é só o que estava nos dados de treino. E o que você escreve antes muda o que vem depois: é por isso que o contexto no prompt muda a resposta.' },
  { id: 'ge-repete', texto: 'Com os dois conjuntos juntos, use só o botão "a mais provável" a partir de "o" até o texto entrar em círculo.', ini: { corpus: 2, texto: ['o'] }, falta: (s) => (repete(s.texto) ? null : 'Ainda não repetiu. Continue apertando "a mais provável" (e "continuar" quando a frase acabar).'), depois: 'Escolher sempre a mais provável é previsível e pode andar em círculos. Por isso os modelos de verdade sorteiam entre as prováveis. E por isso a mesma pergunta pode dar respostas diferentes, e uma resposta fluente pode estar errada: o modelo prevê o provável, não confere o verdadeiro.' },
];

export function GeradorTexto({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoGerador>(GE0, chave, geValido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const { painel } = useDesafios(DESAFIOS_GERADOR, desafios, modo, h, onProgresso);
  const s = h.estado, frases = frasesDe(s.corpus), tab = useMemo(() => bigramas(frases), [s.corpus]); // eslint-disable-line
  const ultima = s.texto[s.texto.length - 1], acabou = ultima === FIM, ops = acabou ? [] : proximas(tab, ultima);
  const por = (p: string) => h.mudar({ ...s, texto: [...s.texto, p] });
  const sortear = () => { let x = rng(newSeed()).next(); for (const o of ops) { x -= o.prob; if (x <= 0) return por(o.p); } if (ops.length) por(ops[ops.length - 1].p); };
  return (
    <Moldura titulo="Gerador de texto" modo={modo} onModo={setModo} h={h}>
      {painel}
      <div className="linha">
        <span className="mini">Texto de treino:</span>
        <div className="seg" role="group" aria-label="Texto de treino">
          {['Igreja', 'Tecnologia', 'Os dois'].map((n, i) => <button key={n} aria-pressed={s.corpus === i} onClick={() => h.mudar({ corpus: i, texto: [s.texto[0]] })}>{n}</button>)}
        </div>
      </div>
      <div className="linha"><span className="mini">Começar por (o seu prompt):</span>{inicios(frases).map((p) => <button key={p} className="btn sm" aria-pressed={s.texto[0] === p && s.texto.length === 1} onClick={() => h.mudar({ ...s, texto: [p] })}>{p}</button>)}</div>
      <div className="fb neutro" style={{ fontSize: '1.15rem', minHeight: 54 }} aria-live="polite">{s.texto.map((p, i) => <span key={i} style={i === s.texto.length - 1 ? { fontWeight: 800, color: 'var(--accent)' } : undefined}>{p === FIM ? '. ' : p + ' '}</span>)}<span className="mini">▌</span></div>
      <div className="vivo">
        <span className="rotulo">{acabou ? 'A frase terminou' : `Depois de "${ultima}", o que costuma vir?`}</span>
        {ops.map((o) => (
          <button key={o.p} className="btn sm" style={{ justifyContent: 'flex-start', gap: 8 }} onClick={() => por(o.p)}>
            <span style={{ display: 'inline-block', height: 10, width: Math.max(6, o.prob * 120), background: 'var(--accent)', borderRadius: 4 }} />
            <b>{o.p === FIM ? '(fim da frase)' : o.p}</b><span className="mini">{Math.round(o.prob * 100)}%</span>
          </button>
        ))}
        <div className="linha">
          {!acabou && <button className="btn sm pri" onClick={() => ops[0] && por(ops[0].p)}>a mais provável</button>}
          {!acabou && <button className="btn sm" onClick={sortear}>sortear pela chance</button>}
          {acabou && <button className="btn sm pri" onClick={() => por(inicios(frases)[0])}>continuar (nova frase)</button>}
          <button className="btn sm" onClick={() => h.mudar({ ...s, texto: [s.texto[0]] })}>recomeçar</button>
        </div>
        <span className="mini">O modelo foi "treinado" com {frases.length} frases curtas: contou que palavra vem depois de qual. Não há mais nada dentro dele.</span>
      </div>
    </Moldura>
  );
}
