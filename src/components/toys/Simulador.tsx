// SIMULADOR DE PROBABILIDADE: quatro bancadas no mesmo brinquedo.
//  - Sorteio: lance moeda ou dado muitas vezes e veja a frequência chegar perto da teoria.
//  - Binomial: n tentativas com chance p; a barra k é a chance de exatamente k sucessos.
//  - Normal: a curva em sino; arraste os dois limites e leia a área (a probabilidade) entre eles.
//  - Médias (TCL): a média de vários dados vira um sino, mesmo o dado não sendo um sino.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Moldura, limitar, useGesto, useHistorico, useModo, usePrevisao } from '../Sandbox';
import { areaEntre, binomCdf, binomPmf, lancar, mediasDeDados, normalPdf, simularBinomial } from '../../lib/prob';
import { comb } from '../../lib/contagem';
import { newSeed, rng } from '../../lib/rng';
import type { ToyProps } from './tipos';

const W = 360, H = 230, X0 = 20, X1 = W - 20, Y0 = 20, Y1 = H - 34;
type Aba = 'sorteio' | 'binomial' | 'normal' | 'tcl';
export type EstadoSim = {
  aba: Aba;
  faces: 2 | 6; evento: number[]; cont: number[];
  n: number; p: number; k: number | null; sim: number[] | null;
  mu: number; sigma: number; za: number; zb: number;
  m: number; hist: number[] | null; mediaObs: number; desvioObs: number;
};
const INICIAL: EstadoSim = { aba: 'sorteio', faces: 6, evento: [4, 5], cont: [0, 0, 0, 0, 0, 0], n: 10, p: 0.5, k: null, sim: null, mu: 150, sigma: 20, za: -1, zb: 1, m: 1, hist: null, mediaObs: 0, desvioObs: 0 };
const valido = (x: unknown) => !!x && ['sorteio', 'binomial', 'normal', 'tcl'].includes((x as EstadoSim).aba) && Array.isArray((x as EstadoSim).cont) && typeof (x as EstadoSim).za === 'number';
const pct = (v: number, casas = 1) => (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + '%';
const dec = (v: number, casas = 3) => v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const nomeFace = (faces: number, i: number) => (faces === 2 ? ['cara', 'coroa'][i] : String(i + 1));

const CENARIOS: { rotulo: string; s: Partial<EstadoSim>; nota: string }[] = [
  { rotulo: 'Dado: sair mais que 4', s: { aba: 'sorteio', faces: 6, evento: [4, 5], cont: [0, 0, 0, 0, 0, 0] }, nota: 'Exercício 4 do curso: casos favoráveis {5, 6}, 2 em 6, P = 1/3. Lance muitas vezes e compare.' },
  { rotulo: 'Moeda honesta', s: { aba: 'sorteio', faces: 2, evento: [0], cont: [0, 0] }, nota: 'P(cara) = 1/2. Com 10 lançamentos pode dar 7 caras; com 1000, dificilmente foge muito de 500.' },
  { rotulo: 'Rede: 10 transmissões, 80% de sucesso', s: { aba: 'binomial', n: 10, p: 0.8, k: null, sim: null }, nota: 'É o exemplo em Python da U5 (n = 10, p = 0,8). O pico fica perto de n·p = 8.' },
  { rotulo: '3 moedas: exatamente 2 caras', s: { aba: 'binomial', n: 3, p: 0.5, k: 2, sim: null }, nota: 'Exemplo do curso: C(3,2) = 3 casos favoráveis em 2³ = 8. P = 3/8 = 0,375.' },
  { rotulo: 'E se… p for muito pequeno?', s: { aba: 'binomial', n: 20, p: 0.05, k: null, sim: null }, nota: 'Com p = 5%, quase todo o peso fica em 0, 1 ou 2 falhas. A binomial deixa de ser simétrica.' },
  { rotulo: 'Tempo de resposta: 150 ms ± 20', s: { aba: 'normal', mu: 150, sigma: 20, za: -1, zb: 1 }, nota: 'Exemplo em Python da U5: média 150 ms, desvio padrão 20 ms. Entre 130 e 170 ms fica cerca de 68% das requisições.' },
  { rotulo: 'E se… o desvio dobrar?', s: { aba: 'normal', mu: 150, sigma: 40, za: -1, zb: 1 }, nota: 'A curva fica mais baixa e mais larga, mas "média ± 1 desvio" continua pegando os mesmos 68%.' },
  { rotulo: 'Média de 30 dados', s: { aba: 'tcl', m: 30, hist: null }, nota: 'Aperte "Sortear 500 médias". Um dado sozinho não tem forma de sino; a média de 30 tem. É o Teorema Central do Limite.' },
];

type Desafio = { id: string; texto: string; ini: Partial<EstadoSim>; falta: (s: EstadoSim) => string | null; prever?: string; depois?: string };
const total = (s: EstadoSim) => s.cont.reduce((a, b) => a + b, 0);
export const DESAFIOS_SIM: Desafio[] = [
  { id: 's-dado', texto: 'Evento: "sair um número maior que 4" num dado. Lance pelo menos 300 vezes e compare a frequência com a teoria.', prever: 'Antes de lançar: qual a probabilidade, em %?', ini: { aba: 'sorteio', faces: 6, evento: [4, 5], cont: [0, 0, 0, 0, 0, 0] },
    falta: (s) => (s.aba !== 'sorteio' || s.faces !== 6 || s.evento.slice().sort().join() !== '4,5' ? 'Mantenha o dado com o evento {5, 6}.' : total(s) >= 300 ? null : `Você lançou ${total(s)} vezes. Lance pelo menos 300.`), depois: 'Teoria: 2/6 = 33,3%. A frequência nunca bate exatamente, mas chega perto, e mais perto quanto mais você lança. Isso é a lei dos grandes números.' },
  { id: 's-evento', texto: 'Monte no dado o evento "sair número par" e deixe a teoria mostrando 50%.', ini: { aba: 'sorteio', faces: 6, evento: [], cont: [0, 0, 0, 0, 0, 0] },
    falta: (s) => (s.aba === 'sorteio' && s.faces === 6 && s.evento.slice().sort().join() === '1,3,5' ? null : 'Toque nas faces 2, 4 e 6 (e só nelas) para marcá-las como favoráveis.'), depois: 'Evento é um subconjunto do espaço amostral: A = {2, 4, 6} dentro de Ω = {1, …, 6}. P(A) = |A| / |Ω| = 3/6.' },
  { id: 's-moedas', texto: 'Probabilidade de exatamente 2 caras em 3 lançamentos de moeda. Ajuste n e p e toque na barra certa.', prever: 'Antes de mexer: qual a probabilidade, em %?', ini: { aba: 'binomial', n: 5, p: 0.3, k: null, sim: null },
    falta: (s) => (s.aba !== 'binomial' ? 'Use a aba Binomial.' : s.n !== 3 ? 'São 3 lançamentos: n = 3.' : Math.abs(s.p - 0.5) > 1e-9 ? 'Moeda honesta: p = 0,5.' : s.k === 2 ? null : 'Toque na barra do k = 2.'), depois: 'C(3,2) · 0,5² · 0,5¹ = 3/8 = 37,5%. É a questão do curso: os casos favoráveis se contam com combinação.' },
  { id: 's-rede', texto: 'Uma rede faz 10 transmissões, cada uma com 80% de chance de sucesso. Ache o número de sucessos MAIS provável e toque na barra dele.', prever: 'Antes de mexer: qual o número de sucessos mais provável?', ini: { aba: 'binomial', n: 10, p: 0.5, k: null, sim: null },
    falta: (s) => (s.aba !== 'binomial' || s.n !== 10 || Math.abs(s.p - 0.8) > 1e-9 ? 'Ajuste n = 10 e p = 0,80.' : s.k === 8 ? null : 'Procure a barra mais alta e toque nela.'), depois: 'O pico fica em n · p = 10 · 0,8 = 8, que é a média da binomial. Mesmo assim, "exatamente 8" só acontece em cerca de 30% das vezes.' },
  { id: 's-68', texto: 'Tempo de resposta com média 150 ms e desvio padrão 20 ms. Arraste os dois limites até a área entre eles ficar em 95% (entre 94% e 96%).', prever: 'Antes de arrastar: mais ou menos entre quais valores (em ms) ficam 95% das respostas? Escreva o limite de cima.', ini: { aba: 'normal', mu: 150, sigma: 20, za: -0.5, zb: 0.5 },
    falta: (s) => { const a = areaEntre(s.za, s.zb); return s.aba !== 'normal' || s.mu !== 150 || s.sigma !== 20 ? 'Mantenha média 150 e desvio 20.' : a >= 0.94 && a <= 0.96 ? null : `A área está em ${pct(a)}. ${a < 0.94 ? 'Afaste os limites.' : 'Aproxime os limites.'}`; }, depois: 'Com os limites simétricos, 95% é média ± 2 desvios: de 110 a 190 ms. É a regra 68-95-99,7.' },
  { id: 's-cauda', texto: 'Mesma aplicação (150 ± 20 ms). O contrato diz que respostas acima de 190 ms são "lentas". Ponha o limite da esquerda em 190 ms e o da direita no fim da curva, e leia a chance de uma resposta lenta.', prever: 'Antes de arrastar: qual a chance, em %?', ini: { aba: 'normal', mu: 150, sigma: 20, za: -1, zb: 1 },
    falta: (s) => (s.aba !== 'normal' || s.mu !== 150 || s.sigma !== 20 ? 'Mantenha média 150 e desvio 20.' : Math.abs(s.za - 2) <= 0.06 && s.zb >= 3.9 ? null : 'O limite da esquerda precisa ficar em 190 ms (2 desvios acima da média) e o da direita, todo à direita.'), depois: '190 = 150 + 2 · 20. Fora de ±2 desvios sobram 5%, metade em cada ponta: cerca de 2,3% a 2,5% das respostas são lentas.' },
  { id: 's-tcl', texto: 'Sorteie 500 médias com 1 dado e veja a forma. Depois aumente para 10 dados ou mais e sorteie de novo.', ini: { aba: 'tcl', m: 1, hist: null },
    falta: (s) => (s.aba !== 'tcl' ? 'Use a aba Médias.' : s.m >= 10 && s.hist ? null : s.m < 10 ? 'Aumente a quantidade de dados para 10 ou mais.' : 'Aperte "Sortear 500 médias".'), depois: 'Com 1 dado, as seis faces empatam (forma chata). Com muitos dados, as médias se amontoam perto de 3,5 em forma de sino. É por isso que latência de rede, que soma muitos atrasos independentes, costuma ser normal.' },
];

export function SimuladorProb({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const gesto = useGesto(svg);
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoSim>(INICIAL, chave, valido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const prev = usePrevisao(false);
  const s = h.estado;
  const [nota, setNota] = useState('');

  const lista = useMemo(() => DESAFIOS_SIM.filter((d) => !desafios || desafios.includes(d.id)), [desafios]);
  const [iD, setID] = useState(0);
  const [feitos, setFeitos] = useState<string[]>([]);
  const [retorno, setRetorno] = useState<null | { ok: boolean; msg: string }>(null);
  const [palpite, setPalpite] = useState('');
  const [palpitou, setPalpitou] = useState(false);
  const d = modo === 'desafio' ? lista[iD] : undefined;
  useEffect(() => { onProgresso?.(feitos.length, lista.length); }, [feitos.length, lista.length]); // eslint-disable-line
  useEffect(() => { setRetorno(null); setNota(''); setPalpite(''); setPalpitou(false); if (d) h.mudar({ ...INICIAL, ...d.ini }); }, [d?.id]); // eslint-disable-line
  const conferir = () => {
    if (!d) return;
    const f = d.falta(s);
    if (f) setRetorno({ ok: false, msg: f });
    else { setRetorno({ ok: true, msg: 'Resolvido. ' + (d.depois ?? '') }); if (!feitos.includes(d.id)) setFeitos([...feitos, d.id]); }
  };
  const set = (parte: Partial<EstadoSim>) => h.mudar({ ...s, ...parte });

  // ---------- desenho de cada bancada ----------
  let palco: React.JSX.Element, vivo: React.JSX.Element, controles: React.JSX.Element;
  const barra = (i: number, n: number, alt: number, cor: string, extra?: React.JSX.Element, rot?: string) => {
    const larg = (X1 - X0) / n, x = X0 + i * larg, hpx = alt * (Y1 - Y0);
    return (
      <g key={i}>
        <rect x={x + larg * 0.12} y={Y1 - hpx} width={larg * 0.76} height={Math.max(0.5, hpx)} rx={2} fill={cor} />
        {extra}
        {rot !== undefined && <text x={x + larg / 2} y={Y1 + 14} textAnchor="middle" fontSize={n > 14 ? 8.5 : 11} fontWeight={700}>{rot}</text>}
      </g>
    );
  };

  if (s.aba === 'sorteio') {
    const t = total(s), teoria = s.evento.length / s.faces, fav = s.evento.reduce((a, i) => a + (s.cont[i] ?? 0), 0);
    const maxF = Math.max(0.5, ...s.cont.map((c) => (t ? c / t : 0)), 1 / s.faces * 1.6);
    const yT = Y1 - (1 / s.faces / maxF) * (Y1 - Y0);
    const joga = (v: number) => { const c = lancar(rng(newSeed()), s.faces, v); set({ cont: s.cont.map((x, i) => x + c[i]) }); };
    palco = (
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="palco" role="img" aria-label="Frequência de cada resultado"
        onClick={(e) => { const r = svg.current!.getBoundingClientRect(); const i = Math.floor((((e.clientX - r.left) / r.width) * W - X0) / ((X1 - X0) / s.faces)); if (i >= 0 && i < s.faces) set({ evento: s.evento.includes(i) ? s.evento.filter((x) => x !== i) : [...s.evento, i] }); }} style={{ cursor: 'pointer' }}>
        {s.cont.map((c, i) => barra(i, s.faces, t ? c / t / maxF : 0, s.evento.includes(i) ? 'var(--accent)' : 'var(--fio)',
          <text x={X0 + (i + 0.5) * ((X1 - X0) / s.faces)} y={Y1 - (t ? c / t / maxF : 0) * (Y1 - Y0) - 5} textAnchor="middle" fontSize={10}>{c}</text>, nomeFace(s.faces, i)))}
        <line x1={X0} x2={X1} y1={yT} y2={yT} stroke="var(--gold)" strokeWidth={2} strokeDasharray="6 4" />
        <text x={X1} y={yT - 5} textAnchor="end" fontSize={10}>teoria: 1/{s.faces} cada</text>
      </svg>
    );
    vivo = (
      <>
        <div>Espaço amostral Ω = {'{'}{Array.from({ length: s.faces }, (_, i) => nomeFace(s.faces, i)).join(', ')}{'}'} · Evento A = {'{'}{s.evento.slice().sort().map((i) => nomeFace(s.faces, i)).join(', ')}{'}'}</div>
        <div className="mono">Teoria: P(A) = {s.evento.length}/{s.faces} = {dec(teoria)} ({pct(teoria)})</div>
        <div className="mono">Simulação: {fav}/{t} = {t ? `${dec(fav / t)} (${pct(fav / t)})` : 'ainda sem lançamentos'}</div>
        {t > 0 && <span className="mini">Diferença para a teoria: {pct(Math.abs(fav / t - teoria))}. Quanto mais lançamentos, menor ela tende a ficar.</span>}
      </>
    );
    controles = (
      <div className="linha">
        <div className="seg" role="group" aria-label="Experimento">
          <button aria-pressed={s.faces === 2} onClick={() => set({ faces: 2, evento: [0], cont: [0, 0] })}>Moeda</button>
          <button aria-pressed={s.faces === 6} onClick={() => set({ faces: 6, evento: [4, 5], cont: [0, 0, 0, 0, 0, 0] })}>Dado</button>
        </div>
        {[1, 10, 100, 1000].map((v) => <button key={v} className="btn sm" onClick={() => joga(v)}>lançar {v}</button>)}
        <button className="btn sm" onClick={() => set({ cont: s.cont.map(() => 0) })}>zerar</button>
      </div>
    );
  } else if (s.aba === 'binomial') {
    const ps = Array.from({ length: s.n + 1 }, (_, k) => binomPmf(s.n, s.p, k));
    const tSim = s.sim ? s.sim.reduce((a, b) => a + b, 0) : 0;
    const maxP = Math.max(...ps, ...(s.sim ? s.sim.map((c) => c / tSim) : [0]));
    const larg = (X1 - X0) / (s.n + 1);
    palco = (
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="palco" role="img" aria-label="Distribuição binomial"
        onClick={(e) => { const r = svg.current!.getBoundingClientRect(); const k = Math.floor((((e.clientX - r.left) / r.width) * W - X0) / larg); if (k >= 0 && k <= s.n) set({ k: s.k === k ? null : k }); }} style={{ cursor: 'pointer' }}>
        {ps.map((p, k) => barra(k, s.n + 1, p / maxP, s.k === k ? 'var(--accent)' : 'var(--va)',
          s.sim ? <circle cx={X0 + (k + 0.5) * larg} cy={Y1 - (s.sim[k] / tSim / maxP) * (Y1 - Y0)} r={3.5} fill="var(--gold)" stroke="var(--ink)" strokeWidth={0.8} /> : undefined, String(k)))}
        <text x={W / 2} y={H - 3} textAnchor="middle" fontSize={10} opacity={0.8}>k = número de sucessos{s.sim ? ' · bolinhas = simulação' : ''}</text>
      </svg>
    );
    const k = s.k;
    vivo = (
      <>
        <div className="mono">n = {s.n} tentativas · p = {dec(s.p, 2)} · média n·p = {dec(s.n * s.p, 2)}</div>
        {k === null ? <span className="mini">Toque numa barra para ver a conta daquele número de sucessos.</span> : (
          <>
            <div className="mono">P(X = {k}) = C({s.n},{k}) · {dec(s.p, 2)}^{k} · {dec(1 - s.p, 2)}^{s.n - k}</div>
            <div className="mono">= {comb(s.n, k)} · {dec(s.p ** k, 4)} · {dec((1 - s.p) ** (s.n - k), 4)} = <b>{dec(ps[k], 4)}</b> ({pct(ps[k])})</div>
            <div className="mono">P(X ≤ {k}) = {pct(binomCdf(s.n, s.p, k))} · P(X ≥ {k}) = {pct(1 - binomCdf(s.n, s.p, k - 1))}</div>
          </>
        )}
        <span className="mini">Vale quando: só há sucesso ou fracasso, as tentativas são independentes, n é fixo e p não muda.</span>
      </>
    );
    controles = (
      <div className="pilha" style={{ gap: 6 }}>
        <label className="linha"><span className="mono" style={{ minWidth: 70 }}>n = {s.n}</span><input type="range" min={1} max={20} value={s.n} onChange={(e) => set({ n: Number(e.target.value), k: null, sim: null })} style={{ flex: 1 }} aria-label="Número de tentativas" /></label>
        <label className="linha"><span className="mono" style={{ minWidth: 70 }}>p = {dec(s.p, 2)}</span><input type="range" min={5} max={95} step={5} value={Math.round(s.p * 100)} onChange={(e) => set({ p: Number(e.target.value) / 100, sim: null })} style={{ flex: 1 }} aria-label="Probabilidade de sucesso" /></label>
        <div className="linha"><button className="btn sm" onClick={() => set({ sim: simularBinomial(rng(newSeed()), s.n, s.p, 1000) })}>Simular 1000 experimentos</button>{s.sim && <button className="btn sm" onClick={() => set({ sim: null })}>tirar simulação</button>}</div>
      </div>
    );
  } else if (s.aba === 'normal') {
    const xDeZ = (z: number) => X0 + ((z + 4) / 8) * (X1 - X0), zDeX = (x: number) => ((x - X0) / (X1 - X0)) * 8 - 4;
    const yDeZ = (z: number) => Y1 - (normalPdf(z) / normalPdf(0)) * (Y1 - Y0 - 6);
    const zs = Array.from({ length: 81 }, (_, i) => -4 + i * 0.1);
    const curva = zs.map((z, i) => `${i ? 'L' : 'M'}${xDeZ(z).toFixed(1)},${yDeZ(z).toFixed(1)}`).join(' ');
    const lo = Math.min(s.za, s.zb), hi = Math.max(s.za, s.zb);
    const dentro = zs.filter((z) => z > lo && z < hi);
    const area = `M${xDeZ(lo)},${Y1} L${xDeZ(lo)},${yDeZ(lo)} ${dentro.map((z) => `L${xDeZ(z).toFixed(1)},${yDeZ(z).toFixed(1)}`).join(' ')} L${xDeZ(hi)},${yDeZ(hi)} L${xDeZ(hi)},${Y1} Z`;
    const a = areaEntre(s.za, s.zb), val = (z: number) => s.mu + z * s.sigma;
    const pega = (qual: 'za' | 'zb') => (
      <g className="pega" transform={`translate(${xDeZ(s[qual])} ${Y1})`} onPointerDown={(e) => gesto.iniciar(e, { comecar: h.marcar, mover: (p) => h.ajustar((st) => ({ ...st, [qual]: Math.round((limitar(zDeX(p.x) * 100, -400, 400) / 100) * 20) / 20 })) })}>
        <line y1={0} y2={-(Y1 - yDeZ(s[qual]))} stroke="var(--ink)" strokeWidth={1.5} />
        <circle r={22} fill="transparent" /><circle r={11} fill="var(--accent)" stroke="var(--paper)" strokeWidth={2} />
        <text y={26} textAnchor="middle" fontSize={11} fontWeight={700}>{dec(val(s[qual]), 0)}</text>
      </g>
    );
    palco = (
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="palco" role="img" aria-label="Curva normal com área entre dois limites">
        <path d={area} fill="var(--accent)" opacity={0.35} />
        <path d={curva} fill="none" stroke="var(--ink)" strokeWidth={2} />
        <line x1={X0} x2={X1} y1={Y1} y2={Y1} stroke="var(--fio)" />
        {[-3, -2, -1, 0, 1, 2, 3].map((z) => <g key={z}><line x1={xDeZ(z)} x2={xDeZ(z)} y1={Y1} y2={Y1 - 4} stroke="var(--fio)" /><text x={xDeZ(z)} y={Y0 - 6} textAnchor="middle" fontSize={9} opacity={0.7}>{z === 0 ? 'μ' : `${z > 0 ? '+' : ''}${z}σ`}</text></g>)}
        <text x={xDeZ((lo + hi) / 2)} y={Y1 - 22} textAnchor="middle" fontSize={15} fontWeight={800}>{pct(a)}</text>
        {pega('za')}{pega('zb')}
      </svg>
    );
    vivo = (
      <>
        <div className="mono">μ (média) = {s.mu} · σ (desvio padrão) = {s.sigma}</div>
        <div className="mono">P({dec(val(lo), 0)} &lt; X &lt; {dec(val(hi), 0)}) = <b>{pct(a)}</b></div>
        <div className="mono">em desvios: de {dec(lo, 2)}σ a {dec(hi, 2)}σ · fora: {pct(1 - a)}</div>
        <span className="mini">Na curva contínua, probabilidade é área. A chance de um valor exato (150,000… ms) é zero; só intervalos têm probabilidade.</span>
      </>
    );
    const faixa = (k: number, real: number) => prev.pedir({ pergunta: `Quanto da área fica entre a média − ${k} desvio${k > 1 ? 's' : ''} e a média + ${k} desvio${k > 1 ? 's' : ''}?`, opcoes: ['cerca de 68%', 'cerca de 95%', 'cerca de 99,7%'], real, porque: 'É a regra 68-95-99,7.', aplicar: () => set({ za: -k, zb: k }) });
    controles = (
      <div className="pilha" style={{ gap: 6 }}>
        <label className="linha"><span className="mono" style={{ minWidth: 70 }}>μ = {s.mu}</span><input type="range" min={50} max={250} step={10} value={s.mu} onChange={(e) => set({ mu: Number(e.target.value) })} style={{ flex: 1 }} aria-label="Média" /></label>
        <label className="linha"><span className="mono" style={{ minWidth: 70 }}>σ = {s.sigma}</span><input type="range" min={5} max={40} step={5} value={s.sigma} onChange={(e) => set({ sigma: Number(e.target.value) })} style={{ flex: 1 }} aria-label="Desvio padrão" /></label>
        <div className="linha">{[1, 2, 3].map((k) => <button key={k} className="btn sm" onClick={() => faixa(k, k - 1)}>μ ± {k}σ</button>)}</div>
      </div>
    );
  } else {
    const caixas = 26, tH = s.hist ? s.hist.reduce((a, b) => a + b, 0) : 0, maxH = s.hist ? Math.max(...s.hist) : 1;
    const sigT = Math.sqrt(35 / 12 / s.m);
    const xDe = (v: number) => X0 + ((v - 1) / 5) * (X1 - X0);
    const pico = tH ? (tH * (5 / (caixas - 1)) * normalPdf(3.5, 3.5, sigT)) / maxH : 0;
    const sino = Array.from({ length: 61 }, (_, i) => 1 + (i * 5) / 60).map((v, i) => `${i ? 'L' : 'M'}${xDe(v).toFixed(1)},${(Y1 - Math.min(1.05, (normalPdf(v, 3.5, sigT) / normalPdf(3.5, 3.5, sigT)) * pico) * (Y1 - Y0)).toFixed(1)}`).join(' ');
    palco = (
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="palco" role="img" aria-label="Histograma das médias">
        {s.hist ? s.hist.map((c, i) => <rect key={i} x={X0 + ((i - 0.5) / (caixas - 1)) * (X1 - X0) + 1} y={Y1 - (c / maxH) * (Y1 - Y0)} width={(X1 - X0) / (caixas - 1) - 2} height={(c / maxH) * (Y1 - Y0)} fill="var(--va)" />) : <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={13}>Aperte "Sortear 500 médias"</text>}
        {s.hist && s.m >= 2 && <path d={sino} fill="none" stroke="var(--gold)" strokeWidth={2} strokeDasharray="6 4" />}
        <line x1={X0} x2={X1} y1={Y1} y2={Y1} stroke="var(--fio)" />
        {[1, 2, 3, 4, 5, 6].map((v) => <text key={v} x={xDe(v)} y={Y1 + 14} textAnchor="middle" fontSize={11} fontWeight={700}>{v}</text>)}
        <text x={W / 2} y={H - 3} textAnchor="middle" fontSize={10} opacity={0.8}>média de {s.m} dado{s.m > 1 ? 's' : ''}{s.hist && s.m >= 2 ? ' · tracejado = curva normal' : ''}</text>
      </svg>
    );
    vivo = (
      <>
        <div className="mono">Cada sorteio: lança {s.m} dado{s.m > 1 ? 's' : ''} e anota a média.</div>
        <div className="mono">Teoria: média 3,5 · desvio {dec(sigT, 2)}</div>
        {s.hist && <div className="mono">Observado em {tH} sorteios: média {dec(s.mediaObs, 2)} · desvio {dec(s.desvioObs, 2)}</div>}
        <span className="mini">Teorema Central do Limite: somar (ou tirar a média de) muitos efeitos independentes dá uma forma de sino, qualquer que seja a forma de cada efeito. Com mais dados, o sino fica mais estreito.</span>
      </>
    );
    const sorteia = (m: number) => { const r = mediasDeDados(rng(newSeed()), m, 500, caixas); set({ m, hist: r.hist, mediaObs: r.media, desvioObs: r.desvio }); };
    controles = (
      <div className="linha">
        <span className="mini">Quantos dados em cada sorteio:</span>
        {[1, 2, 5, 10, 30].map((m) => <button key={m} className="btn sm" aria-pressed={s.m === m} onClick={() => set({ m, hist: null })}>{m}</button>)}
        <button className="btn sm pri" onClick={() => sorteia(s.m)}>Sortear 500 médias</button>
      </div>
    );
  }

  const cenarios = modo === 'livre' ? CENARIOS.map((c) => ({ rotulo: c.rotulo, acao: () => { h.mudar({ ...s, ...c.s }); setNota(c.nota); prev.limpar(); } })) : undefined;
  const ABAS: [Aba, string][] = [['sorteio', 'Sorteio'], ['binomial', 'Binomial'], ['normal', 'Normal'], ['tcl', 'Médias']];

  return (
    <Moldura titulo="Simulador de probabilidade" modo={modo} onModo={(m) => { setModo(m); prev.limpar(); }} h={h} previsao={modo === 'livre' && s.aba === 'normal' ? prev : undefined} cenarios={cenarios}>
      {d && (
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
            <button className="btn sm" disabled={iD === 0} onClick={() => setID(iD - 1)}>← anterior</button>
            <button className="btn sm" disabled={iD >= lista.length - 1} onClick={() => setID(iD + 1)}>próximo →</button>
          </div>
        </div>
      )}
      {nota && <div className="fb neutro">{nota}</div>}
      {prev.painel}
      <div className="seg" role="group" aria-label="Bancada">
        {ABAS.map(([a, rot]) => <button key={a} aria-pressed={s.aba === a} onClick={() => s.aba !== a && set({ aba: a })}>{rot}</button>)}
      </div>
      {controles}
      {palco}
      <span className="mini">{s.aba === 'sorteio' ? 'Toque numa barra para pôr ou tirar aquele resultado do evento A.' : s.aba === 'binomial' ? 'Toque numa barra para escolher k.' : s.aba === 'normal' ? 'Arraste as duas bolinhas para mudar os limites.' : 'A barra mostra quantas das 500 médias caíram em cada valor.'}</span>
      <div className="vivo" aria-live="polite">{vivo}</div>
    </Moldura>
  );
}
