// Três ilustrações da álgebra linear, sobre o mesmo plano quadriculado:
//  - PlanoVetores: arraste as pontas de u e v; soma, múltiplo, produto escalar, norma e ângulo ao vivo.
//  - TransformaMatriz: uma matriz 2×2 deforma o plano; o determinante é o fator de área (zero achata tudo).
//  - RetasSistema: duas equações são duas retas; a solução é onde elas se cruzam (ou não).
import { useEffect, useRef, useState } from 'react';
import { Moldura, limitar, useGesto, useHistorico, useModo, usePrevisao, type Pt } from '../Sandbox';
import { angulo, escalar, fracNum, fracTxt, norma, sistema2, soma, type Vec } from '../../lib/linear';
import { useDesafios, type DesafioBase } from './desafio';
import type { ToyProps } from './tipos';

const T = 340; // lado do desenho
const n2 = (v: number, casas = 2) => (Math.round(v * 10 ** casas) / 10 ** casas).toLocaleString('pt-BR', { maximumFractionDigits: casas });
/** Número negativo entre parênteses, para a conta ficar legível: 3·(−2). */
const pn = (v: number) => (v < 0 ? `(${n2(v)})` : n2(v));
const par = (v: number[]) => `(${v.map((x) => n2(x)).join('; ')})`;

/** Plano quadriculado de lo a hi nos dois eixos. Devolve as funções de conversão e a grade desenhada. */
function plano(lo: number, hi: number, rotulos = true) {
  const m = 14, esc = (T - 2 * m) / (hi - lo);
  const X = (x: number) => m + (x - lo) * esc, Y = (y: number) => T - m - (y - lo) * esc;
  const mundo = (p: Pt): Vec => [(p.x - m) / esc + lo, (T - m - p.y) / esc + lo];
  const linhas = [];
  for (let k = Math.ceil(lo); k <= hi; k++) {
    const eixo = k === 0;
    linhas.push(<line key={'v' + k} x1={X(k)} x2={X(k)} y1={Y(lo)} y2={Y(hi)} stroke={eixo ? 'var(--ink-2)' : 'var(--line)'} strokeWidth={eixo ? 1.4 : 0.7} />);
    linhas.push(<line key={'h' + k} x1={X(lo)} x2={X(hi)} y1={Y(k)} y2={Y(k)} stroke={eixo ? 'var(--ink-2)' : 'var(--line)'} strokeWidth={eixo ? 1.4 : 0.7} />);
    if (rotulos && k !== 0 && k % (hi - lo > 10 ? 2 : 1) === 0) {
      linhas.push(<text key={'tx' + k} x={X(k)} y={Y(0) + 11} textAnchor="middle" fontSize={8} opacity={0.6}>{k}</text>);
      linhas.push(<text key={'ty' + k} x={X(0) - 4} y={Y(k) + 3} textAnchor="end" fontSize={8} opacity={0.6}>{k}</text>);
    }
  }
  return { X, Y, mundo, grade: <g>{linhas}</g>, esc };
}

function Seta({ de, ate, cor, larg = 3, tracejada }: { de: [number, number]; ate: [number, number]; cor: string; larg?: number; tracejada?: boolean }) {
  const dx = ate[0] - de[0], dy = ate[1] - de[1], L = Math.hypot(dx, dy);
  if (L < 1) return <circle cx={de[0]} cy={de[1]} r={3} fill={cor} />;
  const ux = dx / L, uy = dy / L, b: [number, number] = [ate[0] - ux * 9, ate[1] - uy * 9];
  return (
    <g>
      <line x1={de[0]} y1={de[1]} x2={b[0]} y2={b[1]} stroke={cor} strokeWidth={larg} strokeDasharray={tracejada ? '5 4' : undefined} strokeLinecap="round" />
      <path d={`M${ate[0]},${ate[1]} L${b[0] - uy * 5},${b[1] + ux * 5} L${b[0] + uy * 5},${b[1] - ux * 5} Z`} fill={cor} />
    </g>
  );
}

// =====================================================================================================
// 1. PLANO DE VETORES
// =====================================================================================================
export type EstadoVet = { u: Vec; v: Vec; k: number };
const VET0: EstadoVet = { u: [3, 1], v: [1, 2], k: 1 };
const vetValido = (x: unknown) => !!x && Array.isArray((x as EstadoVet).u) && Array.isArray((x as EstadoVet).v) && typeof (x as EstadoVet).k === 'number';
const nulo = (a: Vec) => a[0] === 0 && a[1] === 0;

const CEN_VET: { rotulo: string; s: EstadoVet; nota: string }[] = [
  { rotulo: 'Do curso: (1, 2) e (−2, 1)', s: { u: [1, 2], v: [-2, 1], k: 1 }, nota: 'Produto escalar: 1·(−2) + 2·1 = 0. Quando dá zero, os vetores são perpendiculares (90°).' },
  { rotulo: 'E se… multiplicar por −2?', s: { u: [2, 1], v: [1, 2], k: -2 }, nota: 'Questão do curso: com k = −2 a direção se mantém, o sentido inverte e o tamanho dobra.' },
  { rotulo: 'Mesma direção', s: { u: [2, 1], v: [4, 2], k: 1 }, nota: 'v é o dobro de u: ângulo 0°. O produto escalar é o maior possível para esses tamanhos (|u|·|v|).' },
  { rotulo: 'E se… apontarem para lados opostos?', s: { u: [3, 1], v: [-3, -1], k: 1 }, nota: 'Ângulo de 180°: o produto escalar fica negativo. Sinal negativo = ângulo obtuso.' },
  { rotulo: 'Triângulo 3-4-5', s: { u: [3, 4], v: [1, 0], k: 1 }, nota: 'A norma é Pitágoras: √(3² + 4²) = √25 = 5.' },
];
export const DESAFIOS_VET: DesafioBase<EstadoVet>[] = [
  { id: 'vt-soma', texto: 'u está fixo em (2, 1). Arraste v até que a soma u + v dê (5, 3).', ini: { u: [2, 1], v: [0, 0], k: 1 }, prever: 'Antes de arrastar: qual deve ser a coordenada x de v?',
    falta: (s) => (s.u[0] !== 2 || s.u[1] !== 1 ? 'Deixe u em (2, 1).' : soma(s.u, s.v).join() === '5,3' ? null : `u + v está dando ${par(soma(s.u, s.v))}. Some componente a componente.`), depois: 'v = (3, 2): soma-se x com x e y com y. No desenho, v é "colado" na ponta de u.' },
  { id: 'vt-perp', texto: 'Deixe u em (3, 1) e arraste v até ele ficar perpendicular a u (produto escalar zero), sem ser o vetor nulo.', ini: { u: [3, 1], v: [2, 2], k: 1 },
    falta: (s) => (s.u.join() !== '3,1' ? 'Deixe u em (3, 1).' : nulo(s.v) ? 'O vetor nulo não vale: escolha um v com tamanho.' : escalar(s.u, s.v) === 0 ? null : `u · v = ${escalar(s.u, s.v)}. Precisa dar 0.`), depois: 'Por exemplo v = (−1, 3): 3·(−1) + 1·3 = 0. Truque: troque as coordenadas e inverta o sinal de uma.' },
  { id: 'vt-norma', texto: 'Arraste u até a norma |u| ser exatamente 5, sem deixá-lo em cima de um eixo.', ini: { u: [1, 1], v: [1, 0], k: 1 },
    falta: (s) => (s.u[0] === 0 || s.u[1] === 0 ? 'Fora dos eixos: as duas coordenadas diferentes de zero.' : Math.abs(norma(s.u) - 5) < 1e-9 ? null : `|u| = ${n2(norma(s.u))}. Procure dois números cujos quadrados somem 25.`), depois: '3² + 4² = 9 + 16 = 25, e √25 = 5. A norma é o teorema de Pitágoras.' },
  { id: 'vt-k', texto: 'Use o multiplicador k para fazer k·u apontar para o lado contrário de u, com o DOBRO do tamanho.', ini: { u: [2, 1], v: [1, 2], k: 1 }, prever: 'Antes de mexer: qual valor de k?',
    falta: (s) => (nulo(s.u) ? 'u não pode ser o vetor nulo.' : s.k === -2 ? null : s.k === 2 ? 'Dobrou, mas aponta para o mesmo lado.' : s.k === -1 ? 'Inverteu, mas o tamanho é o mesmo.' : 'Ainda não.'), depois: 'k = −2: o sinal inverte o sentido; o valor 2 dobra o módulo. A direção (a reta) não muda.' },
];

export function PlanoVetores({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const gesto = useGesto(svg);
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoVet>(VET0, chave, vetValido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const [nota, setNota] = useState('');
  const { painel } = useDesafios(DESAFIOS_VET, desafios, modo, h, onProgresso, () => setNota(''));
  const s = h.estado, P = plano(-6, 6);
  const pt = (a: Vec): [number, number] => [P.X(a[0]), P.Y(a[1])];
  const O = pt([0, 0]), su = soma(s.u, s.v), ku: Vec = [s.k * s.u[0], s.k * s.u[1]];
  const pe = escalar(s.u, s.v), ang = nulo(s.u) || nulo(s.v) ? null : angulo(s.u, s.v);
  const pega = (qual: 'u' | 'v', cor: string) => (
    <g className="pega" transform={`translate(${P.X(s[qual][0])} ${P.Y(s[qual][1])})`} onPointerDown={(e) => gesto.iniciar(e, { comecar: h.marcar, mover: (p) => { const w = P.mundo(p); h.ajustar((st) => ({ ...st, [qual]: [limitar(w[0], -6, 6), limitar(w[1], -6, 6)] })); } })}>
      <circle r={22} fill="transparent" /><circle r={9} fill={cor} stroke="var(--paper)" strokeWidth={2} />
      <text x={12} y={-10} fontSize={14} fontWeight={800} style={{ fill: cor }}>{qual}</text>
    </g>
  );
  return (
    <Moldura titulo="Plano de vetores" modo={modo} onModo={setModo} h={h} cenarios={modo === 'livre' ? CEN_VET.map((c) => ({ rotulo: c.rotulo, acao: () => { h.mudar(c.s); setNota(c.nota); } })) : undefined}>
      {painel}
      {nota && <div className="fb neutro">{nota}</div>}
      <div className="linha">
        <span className="mono">k = {n2(s.k)}</span>
        <button className="btn sm" disabled={s.k <= -3} onClick={() => h.mudar({ ...s, k: s.k - 0.5 })} aria-label="Diminuir k">−</button>
        <button className="btn sm" disabled={s.k >= 3} onClick={() => h.mudar({ ...s, k: s.k + 0.5 })} aria-label="Aumentar k">+</button>
        <span className="mini">(multiplica u)</span>
      </div>
      <svg ref={svg} viewBox={`0 0 ${T} ${T}`} className="palco" role="img" aria-label="Plano com os vetores u e v">
        {P.grade}
        <path d={`M${O} L${pt(s.u)} L${pt(su)} L${pt(s.v)} Z`} fill="var(--accent)" opacity={0.1} />
        <Seta de={pt(s.u)} ate={pt(su)} cor="var(--vb)" larg={1.5} tracejada />
        <Seta de={pt(s.v)} ate={pt(su)} cor="var(--va)" larg={1.5} tracejada />
        {s.k !== 1 && <Seta de={O} ate={pt(ku)} cor="var(--gold)" larg={5} />}
        <Seta de={O} ate={pt(su)} cor="var(--vc)" />
        <Seta de={O} ate={pt(s.u)} cor="var(--va)" />
        <Seta de={O} ate={pt(s.v)} cor="var(--vb)" />
        <text x={P.X(su[0]) + 8} y={P.Y(su[1]) - 6} fontSize={12} fontWeight={800} style={{ fill: 'var(--vc)' }}>u+v</text>
        {pega('u', 'var(--va)')}{pega('v', 'var(--vb)')}
      </svg>
      <span className="mini">Arraste as pontas de u e de v. Verde: a soma. {s.k !== 1 ? 'Amarelo: k·u.' : ''}</span>
      <div className="vivo" aria-live="polite">
        <div className="f"><b className="cA">u</b> = {par(s.u)} · |u| = √({pn(s.u[0])}² + {pn(s.u[1])}²) = {n2(norma(s.u))}</div>
        <div className="f"><b className="cB">v</b> = {par(s.v)} · |v| = {n2(norma(s.v))}</div>
        <div className="f"><b className="cC">u + v</b> = ({s.u[0]} + {pn(s.v[0])}; {s.u[1]} + {pn(s.v[1])}) = {par(su)}</div>
        <div className="f">{n2(s.k)}·u = {par(ku)}{s.k < 0 ? ' (sentido invertido)' : ''}</div>
        <div className="f">u · v = {pn(s.u[0])}·{pn(s.v[0])} + {pn(s.u[1])}·{pn(s.v[1])} = <b>{pe}</b></div>
        <span className="mini">{ang === null ? 'Com o vetor nulo não há ângulo.' : `Ângulo entre u e v: ${n2(ang, 1)}°. ${pe === 0 ? 'Produto escalar zero: perpendiculares.' : pe > 0 ? 'Produto positivo: ângulo agudo (menor que 90°).' : 'Produto negativo: ângulo obtuso (maior que 90°).'}`}</span>
      </div>
    </Moldura>
  );
}

// =====================================================================================================
// 2. TRANSFORMAÇÃO POR MATRIZ 2×2
// =====================================================================================================
/** A matriz é [[a, b], [c, d]]: a primeira coluna (a, c) é para onde vai o vetor (1, 0); a segunda (b, d), para onde vai (0, 1). */
export type EstadoMat = { a: number; b: number; c: number; d: number };
const MAT0: EstadoMat = { a: 1, b: 0, c: 0, d: 1 };
const matValida = (x: unknown) => !!x && ['a', 'b', 'c', 'd'].every((k) => typeof (x as Record<string, unknown>)[k] === 'number');
const detM = (s: EstadoMat) => s.a * s.d - s.b * s.c;
const CEN_MAT: { rotulo: string; s: EstadoMat; nota: string }[] = [
  { rotulo: 'Identidade', s: MAT0, nota: 'A matriz identidade não muda nada: é o "1" das matrizes. Determinante 1.' },
  { rotulo: 'Dobrar tudo', s: { a: 2, b: 0, c: 0, d: 2 }, nota: 'Cada lado dobra, então a área fica 4 vezes maior: determinante 4.' },
  { rotulo: 'Girar 90°', s: { a: 0, b: -1, c: 1, d: 0 }, nota: 'Rotação: a figura gira sem mudar de tamanho. Determinante 1.' },
  { rotulo: 'Espelhar', s: { a: -1, b: 0, c: 0, d: 1 }, nota: 'Reflexão: a letra F fica ao contrário. Determinante −1: o sinal negativo avisa que virou do avesso.' },
  { rotulo: 'Entortar (cisalhar)', s: { a: 1, b: 1, c: 0, d: 1 }, nota: 'O quadrado vira paralelogramo, mas a área não muda: determinante 1.' },
  { rotulo: 'E se… o determinante for zero?', s: { a: 2, b: 1, c: 4, d: 2 }, nota: 'A segunda coluna é metade da primeira: o plano inteiro é esmagado numa reta. Área zero, determinante zero. Não há como desfazer: a matriz não tem inversa.' },
];
export const DESAFIOS_MAT: DesafioBase<EstadoMat>[] = [
  { id: 'tm-area', texto: 'Monte uma matriz que deixe a área do quadrado 6 vezes maior (determinante 6).', ini: MAT0, falta: (s) => (detM(s) === 6 ? null : `O determinante está em ${n2(detM(s))}.`), depois: 'O determinante é o fator de área. Uma solução simples: esticar 3 em x e 2 em y, a matriz de diagonal 3 e 2.' },
  { id: 'tm-zero', texto: 'Sem zerar a matriz inteira, faça o quadrado virar um segmento de reta (determinante 0).', ini: { a: 2, b: 0, c: 0, d: 1 }, prever: 'Antes de mexer: dá para desfazer essa transformação depois? (sim ou não)',
    falta: (s) => (s.a === 0 && s.b === 0 && s.c === 0 && s.d === 0 ? 'A matriz toda zerada não vale.' : detM(s) === 0 ? null : `O determinante está em ${n2(detM(s))}. Faça uma coluna ser múltipla da outra.`), depois: 'Quando uma coluna é múltipla da outra, as duas apontam na mesma direção e o plano achata. Não dá para desfazer: muitos pontos diferentes caíram no mesmo lugar. É por isso que det = 0 significa "sem inversa".' },
  { id: 'tm-espelho', texto: 'Monte uma matriz que vire a letra F do avesso sem mudar a área (determinante −1).', ini: MAT0, falta: (s) => (detM(s) === -1 ? null : `O determinante está em ${n2(detM(s))}.`), depois: 'Determinante negativo = a orientação inverteu (como num espelho). O valor absoluto, 1, diz que a área se manteve.' },
  { id: 'tm-gira', texto: 'Monte a matriz que gira tudo 90° no sentido anti-horário: o vetor (1, 0) vai para (0, 1) e o vetor (0, 1) vai para (−1, 0).', ini: MAT0, falta: (s) => (s.a === 0 && s.c === 1 && s.b === -1 && s.d === 0 ? null : 'As colunas da matriz são os destinos dos vetores (1, 0) e (0, 1). A primeira coluna deve ser (0, 1) e a segunda (−1, 0).'), depois: 'As colunas de uma matriz dizem para onde vão os dois vetores da base. É assim que a computação gráfica gira, estica e espelha objetos.' },
];
const F_PTS: Vec[] = [[0.15, 0.1], [0.15, 0.9], [0.75, 0.9], [0.75, 0.72], [0.38, 0.72], [0.38, 0.58], [0.65, 0.58], [0.65, 0.42], [0.38, 0.42], [0.38, 0.1]];

export function TransformaMatriz({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const gesto = useGesto(svg);
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoMat>(MAT0, chave, matValida, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const prev = usePrevisao(false);
  const [nota, setNota] = useState('');
  const { painel } = useDesafios(DESAFIOS_MAT, desafios, modo, h, onProgresso, () => setNota(''));
  const s = h.estado, P = plano(-4, 4), D = detM(s);
  const ap = (p: Vec): [number, number] => [P.X(s.a * p[0] + s.b * p[1]), P.Y(s.c * p[0] + s.d * p[1])];
  const cru = (p: Vec): [number, number] => [P.X(p[0]), P.Y(p[1])];
  const QUAD: Vec[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const meio = (v: number) => Math.round(v * 2) / 2;
  const pega = (col: 0 | 1, cor: string, rot: string) => {
    const x = col === 0 ? s.a : s.b, y = col === 0 ? s.c : s.d;
    return (
      <g className="pega" transform={`translate(${P.X(x)} ${P.Y(y)})`} onPointerDown={(e) => gesto.iniciar(e, { comecar: h.marcar, mover: (p) => { const w = P.mundo(p), nx = meio(Math.max(-4, Math.min(4, w[0]))), ny = meio(Math.max(-4, Math.min(4, w[1]))); h.ajustar((st) => (col === 0 ? { ...st, a: nx, c: ny } : { ...st, b: nx, d: ny })); } })}>
        <circle r={22} fill="transparent" /><circle r={9} fill={cor} stroke="var(--paper)" strokeWidth={2} />
        <text x={12} y={-10} fontSize={12} fontWeight={800} style={{ fill: cor }}>{rot}</text>
      </g>
    );
  };
  const Campo = ({ k }: { k: keyof EstadoMat }) => (
    <span className="linha" style={{ gap: 2, flexWrap: 'nowrap' }}>
      <button className="btn sm" onClick={() => h.mudar({ ...s, [k]: Math.max(-4, s[k] - 0.5) })} aria-label={`Diminuir ${k}`}>−</button>
      <b className="mono" style={{ minWidth: 34, textAlign: 'center' }}>{n2(s[k])}</b>
      <button className="btn sm" onClick={() => h.mudar({ ...s, [k]: Math.min(4, s[k] + 0.5) })} aria-label={`Aumentar ${k}`}>+</button>
    </span>
  );
  const cen = (c: (typeof CEN_MAT)[number]) => {
    const dc = detM(c.s), ops = ['fica maior', 'fica igual', 'fica menor', 'vira zero (achata)'], real = dc === 0 ? 3 : Math.abs(dc) > 1 ? 0 : Math.abs(dc) === 1 ? 1 : 2;
    prev.pedir({ pergunta: `"${c.rotulo}": o que acontece com a ÁREA do quadrado?`, opcoes: ops, real, porque: `O determinante dessa matriz é ${n2(dc)}.`, aplicar: () => { h.mudar(c.s); setNota(c.nota); } });
    if (!prev.ativa) setNota(c.nota);
  };
  return (
    <Moldura titulo="Transformação por matriz" modo={modo} onModo={(m) => { setModo(m); prev.limpar(); }} h={h} previsao={modo === 'livre' ? prev : undefined} cenarios={modo === 'livre' ? CEN_MAT.map((c) => ({ rotulo: c.rotulo, acao: () => cen(c) })) : undefined}>
      {painel}
      {nota && <div className="fb neutro">{nota}</div>}
      {prev.painel}
      <div className="linha" style={{ alignItems: 'center' }}>
        <span className="mono">A =</span>
        <div className="pilha" style={{ gap: 4, borderLeft: '2px solid var(--ink)', borderRight: '2px solid var(--ink)', padding: '2px 8px', borderRadius: 6 }}>
          <div className="linha" style={{ flexWrap: 'nowrap' }}><Campo k="a" /><Campo k="b" /></div>
          <div className="linha" style={{ flexWrap: 'nowrap' }}><Campo k="c" /><Campo k="d" /></div>
        </div>
      </div>
      <svg ref={svg} viewBox={`0 0 ${T} ${T}`} className="palco" role="img" aria-label="Plano transformado pela matriz">
        {P.grade}
        <path d={`M${QUAD.map(cru).join(' L')} Z`} fill="none" stroke="var(--ink-2)" strokeDasharray="4 3" />
        <path d={`M${QUAD.map(ap).join(' L')} Z`} fill={D < 0 ? 'var(--vb)' : 'var(--accent)'} opacity={0.22} stroke={D === 0 ? 'var(--bad)' : 'var(--accent)'} strokeWidth={D === 0 ? 4 : 1.5} />
        <path d={`M${F_PTS.map(ap).join(' L')} Z`} fill={D < 0 ? 'var(--vb)' : 'var(--accent)'} opacity={0.75} />
        <Seta de={cru([0, 0])} ate={ap([1, 0])} cor="var(--va)" />
        <Seta de={cru([0, 0])} ate={ap([0, 1])} cor="var(--vc)" />
        {pega(0, 'var(--va)', '1ª coluna')}{pega(1, 'var(--vc)', '2ª coluna')}
      </svg>
      <span className="mini">Arraste as duas pontas (são as colunas da matriz) ou use os botões. Tracejado: o quadrado original.</span>
      <div className="vivo" aria-live="polite">
        <div className="f">(1, 0) vai para ({n2(s.a)}; {n2(s.c)}) · (0, 1) vai para ({n2(s.b)}; {n2(s.d)})</div>
        <div className="f">det A = {pn(s.a)}·{pn(s.d)} − {pn(s.b)}·{pn(s.c)} = <b>{n2(D)}</b></div>
        <div className="f">Área do quadrado: 1 → {n2(Math.abs(D))}</div>
        <span className="mini">{D === 0 ? 'Determinante zero: o plano foi achatado. A matriz NÃO tem inversa, e um sistema com ela não tem solução única.' : D < 0 ? 'Determinante negativo: a figura virou do avesso (espelhou). A matriz tem inversa.' : 'Determinante diferente de zero: dá para desfazer a transformação. A matriz tem inversa.'}</span>
      </div>
    </Moldura>
  );
}

// =====================================================================================================
// 3. RETAS DO SISTEMA
// =====================================================================================================
export type EstadoRetas = { a1: number; b1: number; c1: number; a2: number; b2: number; c2: number; sel: Vec | null; limites: boolean; nomes?: [string, string] };
const RET0: EstadoRetas = { a1: 1, b1: 1, c1: 10, a2: 2, b2: -1, c2: 2, sel: null, limites: false };
const retValida = (x: unknown) => !!x && ['a1', 'b1', 'c1', 'a2', 'b2', 'c2'].every((k) => typeof (x as Record<string, unknown>)[k] === 'number');
const TELECOM: EstadoRetas = { a1: 2, b1: 5, c1: 40, a2: 3, b2: 2, c2: 25, sel: null, limites: true, nomes: ['horas', 'mil reais'] };
const CEN_RET: { rotulo: string; s: EstadoRetas; nota: string }[] = [
  { rotulo: 'Do curso: x + y = 10 e 2x − y = 2', s: RET0, nota: 'As retas se cruzam em um ponto só, (4, 6): sistema possível e determinado (SPD).' },
  { rotulo: 'Servidores: x + y = 10 e 2x + 5y = 32', s: { a1: 1, b1: 1, c1: 10, a2: 2, b2: 5, c2: 32, sel: null, limites: false }, nota: 'Exemplo do curso: 10 servidores, 32 mil. A solução é 6 do tipo A e 4 do tipo B.' },
  { rotulo: 'E se… as retas forem paralelas?', s: { a1: 1, b1: 1, c1: 10, a2: 1, b2: 1, c2: 6, sel: null, limites: false }, nota: 'x + y não pode ser 10 e 6 ao mesmo tempo. As retas nunca se encontram: sistema impossível (SI). O determinante é zero.' },
  { rotulo: 'E se… forem a mesma reta?', s: { a1: 1, b1: 1, c1: 10, a2: 2, b2: 2, c2: 20, sel: null, limites: false }, nota: 'A segunda equação é a primeira multiplicada por 2: não traz informação nova. Infinitas soluções: sistema possível e indeterminado (SPI). O determinante também é zero.' },
  { rotulo: 'Telecom: 2x + 5y = 40 e 3x + 2y = 25', s: TELECOM, nota: 'O cruzamento fica em (45/11; 70/11) ≈ (4,09; 6,36). Não dá para fazer 4,09 instalações. Toque nos pontos inteiros da área pintada para ver quanto cada plano gasta.' },
];
const usa = (s: EstadoRetas, p: Vec) => [s.a1 * p[0] + s.b1 * p[1], s.a2 * p[0] + s.b2 * p[1]];
const cabe = (s: EstadoRetas, p: Vec) => { const [r1, r2] = usa(s, p); return p[0] >= 0 && p[1] >= 0 && r1 <= s.c1 && r2 <= s.c2; };
export const DESAFIOS_RET: DesafioBase<EstadoRetas>[] = [
  { id: 'rt-cruza', texto: 'Sistema do curso: x + y = 10 e 2x − y = 2. Toque no ponto do plano que é a solução.', ini: RET0, prever: 'Antes de tocar: quanto vale x?',
    falta: (s) => (s.sel && s.sel.join() === '4,6' ? null : s.sel ? `O ponto ${par(s.sel)} dá ${usa(s, s.sel).join(' e ')}; precisa dar 10 e 2.` : 'Toque num ponto do quadriculado.'), depois: 'A solução (4, 6) é o único ponto que está nas duas retas ao mesmo tempo. Conferindo: 4 + 6 = 10 e 2·4 − 6 = 2.' },
  { id: 'rt-si', texto: 'Mude só o lado direito (c) ou os coeficientes da SEGUNDA equação até o sistema ficar impossível (retas paralelas, sem se encostar).', ini: RET0,
    falta: (s) => (s.a1 !== 1 || s.b1 !== 1 || s.c1 !== 10 ? 'Deixe a primeira equação como x + y = 10.' : sistema2(s.a1, s.b1, s.c1, s.a2, s.b2, s.c2).classe === 'SI' ? null : `Agora o sistema é ${sistema2(s.a1, s.b1, s.c1, s.a2, s.b2, s.c2).classe}. Para serem paralelas, as retas precisam ter a mesma inclinação.`), depois: 'Mesmos coeficientes de x e y (ou múltiplos) com lado direito diferente: mesma inclinação, alturas diferentes. Determinante zero.' },
  { id: 'rt-spi', texto: 'Agora faça a segunda equação ser a MESMA reta que x + y = 10, escrita de outro jeito (sistema indeterminado).', ini: { ...RET0, a2: 2, b2: 1, c2: 12 },
    falta: (s) => (s.a1 !== 1 || s.b1 !== 1 || s.c1 !== 10 ? 'Deixe a primeira equação como x + y = 10.' : s.a2 === 1 && s.b2 === 1 && s.c2 === 10 ? 'Essa é idêntica. Escreva-a de outro jeito: multiplique tudo por um número.' : sistema2(s.a1, s.b1, s.c1, s.a2, s.b2, s.c2).classe === 'SPI' ? null : `Agora o sistema é ${sistema2(s.a1, s.b1, s.c1, s.a2, s.b2, s.c2).classe}.`), depois: 'Por exemplo 2x + 2y = 20. Uma equação que é múltipla da outra não acrescenta restrição: sobram infinitas soluções.' },
  { id: 'rt-telecom', texto: 'Telecom (U6): 2x + 5y = 40 horas e 3x + 2y = 25 mil reais. A solução exata não é inteira. Toque no plano com números inteiros que cabe nos dois limites e faz o MAIOR número de instalações (x + y).', ini: TELECOM, prever: 'Antes de tocar: o plano (5, 6) do gabarito do curso cabe no orçamento? (sim ou não)',
    falta: (s) => { if (!s.sel) return 'Toque num ponto do quadriculado.'; const [r1, r2] = usa(s, s.sel); if (!cabe(s, s.sel)) return `${par(s.sel)} gasta ${r1} h e ${r2} mil: estoura ${r1 > 40 ? 'as horas' : 'o orçamento'}.`; return s.sel[0] + s.sel[1] >= 10 ? null : `${par(s.sel)} cabe (${r1} h, ${r2} mil), mas faz só ${s.sel[0] + s.sel[1]} instalações. Dá para fazer mais.`; },
    depois: 'Há dois planos com 10 instalações: (4, 6), que gasta 38 h e 24 mil, e (5, 5), que gasta 35 h e 25 mil. Qual é "melhor" depende do que a empresa valoriza; o sistema de equações sozinho não diz. O (5, 6) do gabarito gasta 27 mil: não cabe.' },
];

export function RetasSistema({ modoInicial = 'livre', desafios, preset, chave, onProgresso }: ToyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoRetas>(preset === 'telecom' ? TELECOM : RET0, chave, retValida, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const [nota, setNota] = useState('');
  const { painel } = useDesafios(DESAFIOS_RET, desafios, modo, h, onProgresso, () => setNota(''));
  const s = h.estado, P = plano(-2, 14), r = sistema2(s.a1, s.b1, s.c1, s.a2, s.b2, s.c2);
  const reta = (a: number, b: number, c: number, cor: string) => {
    if (a === 0 && b === 0) return null;
    const pts: Vec[] = b !== 0 ? [[-2, (c - a * -2) / b], [14, (c - a * 14) / b]] : [[c / a, -2], [c / a, 14]];
    return <line x1={P.X(pts[0][0])} y1={P.Y(pts[0][1])} x2={P.X(pts[1][0])} y2={P.Y(pts[1][1])} stroke={cor} strokeWidth={3} strokeLinecap="round" />;
  };
  const eq = (a: number, b: number, c: number) => `${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}y = ${c}`;
  const Coef = ({ k, rot }: { k: 'a1' | 'b1' | 'c1' | 'a2' | 'b2' | 'c2'; rot: string }) => (
    <span className="linha" style={{ gap: 2, flexWrap: 'nowrap' }}>
      <button className="btn sm" onClick={() => h.mudar({ ...s, [k]: s[k] - 1, sel: null })} aria-label={`Diminuir ${rot}`}>−</button>
      <b className="mono" style={{ minWidth: 26, textAlign: 'center' }}>{s[k]}</b>
      <button className="btn sm" onClick={() => h.mudar({ ...s, [k]: s[k] + 1, sel: null })} aria-label={`Aumentar ${rot}`}>+</button>
    </span>
  );
  const inteiros: Vec[] = [];
  if (s.limites) for (let x = 0; x <= 14; x++) for (let y = 0; y <= 14; y++) if (cabe(s, [x, y])) inteiros.push([x, y]);
  const tocar = (e: React.MouseEvent) => {
    if (!svg.current) return;
    const b = svg.current.getBoundingClientRect(), w = P.mundo({ x: ((e.clientX - b.left) / b.width) * T, y: ((e.clientY - b.top) / b.height) * T });
    const p: Vec = [Math.round(w[0]), Math.round(w[1])];
    if (p[0] < -2 || p[0] > 14 || p[1] < -2 || p[1] > 14) return;
    h.mudar({ ...s, sel: s.sel && s.sel.join() === p.join() ? null : p });
  };
  const uso = s.sel ? usa(s, s.sel) : null, nm = s.nomes ?? ['', ''];
  return (
    <Moldura titulo="Retas do sistema" modo={modo} onModo={setModo} h={h} cenarios={modo === 'livre' ? CEN_RET.map((c) => ({ rotulo: c.rotulo, acao: () => { h.mudar(c.s); setNota(c.nota); } })) : undefined}>
      {painel}
      {nota && <div className="fb neutro">{nota}</div>}
      <div className="pilha" style={{ gap: 6 }}>
        <div className="linha" style={{ alignItems: 'center' }}><b className="cA">①</b><Coef k="a1" rot="a1" /><span className="mono">x +</span><Coef k="b1" rot="b1" /><span className="mono">y =</span><Coef k="c1" rot="c1" /></div>
        <div className="linha" style={{ alignItems: 'center' }}><b className="cB">②</b><Coef k="a2" rot="a2" /><span className="mono">x +</span><Coef k="b2" rot="b2" /><span className="mono">y =</span><Coef k="c2" rot="c2" /></div>
        <div className="linha"><button className="btn sm" aria-pressed={s.limites} onClick={() => h.mudar({ ...s, limites: !s.limites })}>{s.limites ? '◉' : '○'} tratar como limites (≤) e mostrar planos inteiros</button></div>
      </div>
      <svg ref={svg} viewBox={`0 0 ${T} ${T}`} className="palco" role="img" aria-label="Duas retas no plano" onClick={tocar} style={{ cursor: 'pointer' }}>
        {P.grade}
        {inteiros.map((p) => <circle key={p.join()} cx={P.X(p[0])} cy={P.Y(p[1])} r={3.2} fill="var(--ok)" opacity={0.75} />)}
        {reta(s.a1, s.b1, s.c1, 'var(--va)')}{reta(s.a2, s.b2, s.c2, 'var(--vb)')}
        {r.classe === 'SPD' && <circle cx={P.X(fracNum(r.x!))} cy={P.Y(fracNum(r.y!))} r={6} fill="var(--gold)" stroke="var(--ink)" strokeWidth={1.5} />}
        {s.sel && <circle cx={P.X(s.sel[0])} cy={P.Y(s.sel[1])} r={9} fill="none" stroke="var(--accent)" strokeWidth={3} />}
      </svg>
      <span className="mini">Toque num ponto do quadriculado para testá-lo nas duas equações.{s.limites ? ' Pontos verdes: planos inteiros que cabem nos dois limites.' : ''}</span>
      <div className="vivo" aria-live="polite">
        <div className="f"><b className="cA">①</b> {eq(s.a1, s.b1, s.c1)} · <b className="cB">②</b> {eq(s.a2, s.b2, s.c2)}</div>
        <div className="f">D = {s.a1}·{s.b2 < 0 ? `(${s.b2})` : s.b2} − {s.b1 < 0 ? `(${s.b1})` : s.b1}·{s.a2} = <b>{r.D}</b></div>
        {r.classe === 'SPD' ? (
          <>
            <div className="f"><b>SPD</b>: uma solução. x = Dx/D = {r.Dx}/{r.D} = {fracTxt(r.x!)}{r.x!.d !== 1 ? ` ≈ ${n2(fracNum(r.x!))}` : ''}</div>
            <div className="f">y = Dy/D = {r.Dy}/{r.D} = {fracTxt(r.y!)}{r.y!.d !== 1 ? ` ≈ ${n2(fracNum(r.y!))}` : ''}</div>
            {(r.x!.d !== 1 || r.y!.d !== 1) && <span className="mini">A solução exata não é inteira. Se x e y são quantidades de coisas, ela não pode ser executada como está.</span>}
          </>
        ) : r.classe === 'SI' ? <div className="f"><b>SI</b>: impossível. Retas paralelas, nenhum ponto em comum.</div> : <div className="f"><b>SPI</b>: indeterminado. É a mesma reta: infinitas soluções.</div>}
        {s.sel && uso && (
          <div className="f" style={{ whiteSpace: 'normal' }}>Ponto {par(s.sel)}: ① dá {uso[0]}{nm[0] && ' ' + nm[0]} ({s.limites ? (uso[0] <= s.c1 ? `cabe em ${s.c1}` : `ESTOURA ${s.c1}`) : uso[0] === s.c1 ? 'bate' : `não é ${s.c1}`}) · ② dá {uso[1]}{nm[1] && ' ' + nm[1]} ({s.limites ? (uso[1] <= s.c2 ? `cabe em ${s.c2}` : `ESTOURA ${s.c2}`) : uso[1] === s.c2 ? 'bate' : `não é ${s.c2}`}){s.limites ? ` · total x + y = ${s.sel[0] + s.sel[1]}` : ''}</div>
        )}
      </div>
    </Moldura>
  );
}
