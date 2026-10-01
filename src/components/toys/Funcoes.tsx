// MÁQUINA DE FUNÇÕES: crie e apague setas entre domínio e contradomínio.
// As etiquetas "é função / injetora / sobrejetora / bijetora" acendem conforme você mexe.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Moldura, useGesto, useHistorico, useModo, usePrevisao } from '../Sandbox';
import { analisar, compor, type FnReport, type Pair } from '../../lib/functions';
import type { ToyProps } from './tipos';

const W = 360, H = 300;
export type EstadoFn = { A: string[]; B: string[]; C: string[]; f: Pair[]; g: Pair[]; comp: boolean };
const INICIAL: EstadoFn = { A: ['1', '2', '3'], B: ['a', 'b', 'c'], C: ['x', 'y'], f: [['1', 'a'], ['2', 'b']], g: [], comp: false };
const valido = (x: unknown) => !!x && Array.isArray((x as EstadoFn).A) && Array.isArray((x as EstadoFn).f) && Array.isArray((x as EstadoFn).g);
const NOMES = { A: ['1', '2', '3', '4', '5'], B: ['a', 'b', 'c', 'd', 'e'], C: ['x', 'y', 'z', 'w'] };

const CENARIOS: { rotulo: string; s: EstadoFn; nota: string }[] = [
  { rotulo: 'CPF: cada pessoa, um número só dela', nota: 'Injetora: ninguém divide número. Sobrou número sem dono, então não é sobrejetora.', s: { ...INICIAL, A: ['Ana', 'Bia', 'Edu'], B: ['111', '222', '333', '444'], f: [['Ana', '111'], ['Bia', '222'], ['Edu', '333']] } },
  { rotulo: 'Setores: duas pessoas no mesmo setor', nota: 'Sobrejetora (todo setor tem alguém), mas não injetora: Ana e Bia caem no mesmo lugar.', s: { ...INICIAL, A: ['Ana', 'Bia', 'Edu'], B: ['TI', 'RH'], f: [['Ana', 'TI'], ['Bia', 'TI'], ['Edu', 'RH']] } },
  { rotulo: 'E se… alguém ficar sem seta?', nota: 'Não é função: todo elemento do domínio precisa de uma saída.', s: { ...INICIAL, f: [['1', 'a'], ['3', 'c']] } },
  { rotulo: 'E se… alguém tiver duas setas?', nota: 'Não é função: a mesma entrada não pode dar duas saídas diferentes.', s: { ...INICIAL, f: [['1', 'a'], ['1', 'b'], ['2', 'b'], ['3', 'c']] } },
  { rotulo: 'Estoque: um produto por prateleira', nota: 'Bijetora: dá para desfazer (existe função inversa).', s: { ...INICIAL, f: [['1', 'a'], ['2', 'b'], ['3', 'c']] } },
  { rotulo: 'Encadear f e g', nota: 'g∘f aplica f primeiro e g depois. As setas tracejadas são o resultado.', s: { A: ['1', '2', '3'], B: ['a', 'b', 'c'], C: ['x', 'y'], f: [['1', 'a'], ['2', 'b'], ['3', 'c']], g: [['a', 'x'], ['b', 'x'], ['c', 'y']], comp: true } },
];

type Desafio = { id: string; texto: string; ini: EstadoFn; falta: (r: FnReport, s: EstadoFn) => string | null; impossivel?: string; depois?: string };
const vazio = (a: number, b: number, comp = false): EstadoFn => ({ A: NOMES.A.slice(0, a), B: NOMES.B.slice(0, b), C: ['x', 'y'], f: [], g: [], comp });
export const DESAFIOS_FN: Desafio[] = [
  { id: 'f-inj', texto: 'Ligue as setas para f ser uma função INJETORA (entradas diferentes, saídas diferentes).', ini: vazio(3, 4), falta: (r) => (!r.isFunction ? 'Ainda não é função: cada elemento do domínio precisa de exatamente uma seta.' : r.injetora ? null : `Há colisão em ${r.colisoes.join(', ')}: duas entradas na mesma saída.`), depois: 'Repare: com 3 entradas e 4 saídas, sempre sobra uma saída sem ninguém. Aqui não dá para ser sobrejetora.' },
  { id: 'f-sob', texto: 'Faça f ser SOBREJETORA (toda saída é atingida), mas NÃO injetora.', ini: vazio(4, 3), falta: (r) => (!r.isFunction ? 'Ainda não é função.' : !r.sobrejetora ? `Falta atingir: ${r.naoAtingidos.join(', ')}.` : r.injetora ? 'Está injetora também. Faça duas entradas caírem na mesma saída.' : null) },
  { id: 'f-bij', texto: 'Faça f ser BIJETORA: cada saída com exatamente uma entrada.', ini: vazio(3, 3), falta: (r) => (r.bijetora ? null : !r.isFunction ? 'Ainda não é função.' : 'Ainda não: precisa ser injetora e sobrejetora ao mesmo tempo.'), depois: 'Bijetora é a única que tem inversa: dá para voltar de cada saída para a sua entrada.' },
  { id: 'f-quebra', texto: 'Esta f é uma função. Mexendo em UMA seta só, faça deixar de ser função.', ini: { ...vazio(3, 3), f: [['1', 'a'], ['2', 'b'], ['3', 'c']] }, falta: (r) => (r.isFunction ? 'Continua sendo função. Apague uma seta, ou dê duas saídas para a mesma entrada.' : null), depois: 'Há dois jeitos de quebrar: deixar uma entrada sem saída, ou dar duas saídas para a mesma entrada.' },
  { id: 'f-imp', texto: 'Com 4 entradas e 3 saídas, tente fazer f ser INJETORA. Se achar que não dá, aperte "É impossível".', ini: vazio(4, 3), falta: (r) => (r.injetora ? null : 'Não está injetora.'), impossivel: 'Certo: é impossível. São 4 entradas para 3 saídas; pelo menos duas entradas têm que dividir uma saída. (É o "princípio da casa dos pombos".)' },
  { id: 'f-comp', texto: 'Composição: monte f (de A em B) e g (de B em C) de modo que (g∘f)(1) = x e (g∘f)(2) = y. As duas precisam ser funções.', ini: { A: ['1', '2'], B: ['a', 'b', 'c'], C: ['x', 'y'], f: [], g: [], comp: true },
    falta: (r, s) => {
      if (!r.isFunction) return 'f ainda não é função.';
      if (!analisar(s.B, s.C, s.g).isFunction) return 'g ainda não é função: cada elemento de B precisa de uma seta para C.';
      const gf = compor(s.f, s.g);
      return gf.some((p) => p[0] === '1' && p[1] === 'x') && gf.some((p) => p[0] === '2' && p[1] === 'y') ? null : 'Siga o caminho do 1: para onde f leva, e de lá para onde g leva? Precisa terminar em x. O do 2, em y.';
    }, depois: 'Lê-se da direita para a esquerda: em g∘f, quem age primeiro é f.' },
];

function Selo({ ok, children }: { ok: boolean; children: string }) {
  return <span className={'pilula ' + (ok ? 'ok' : '')} style={ok ? undefined : { opacity: 0.6, textDecoration: 'line-through' }}>{children}</span>;
}

export function MaquinaFuncoes({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const gesto = useGesto(svg);
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoFn>(INICIAL, chave, valido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const prev = usePrevisao(false);
  const s = h.estado;
  const [sel, setSel] = useState<null | { col: number; el: string }>(null);
  const [nota, setNota] = useState('');

  const lista = useMemo(() => DESAFIOS_FN.filter((d) => !desafios || desafios.includes(d.id)), [desafios]);
  const [iD, setID] = useState(0);
  const [feitos, setFeitos] = useState<string[]>([]);
  const [retorno, setRetorno] = useState<null | { ok: boolean; msg: string }>(null);
  const d = modo === 'desafio' ? lista[iD] : undefined;
  useEffect(() => { onProgresso?.(feitos.length, lista.length); }, [feitos.length, lista.length]); // eslint-disable-line
  useEffect(() => { setRetorno(null); setSel(null); setNota(''); if (d) h.mudar(d.ini); }, [d?.id]); // eslint-disable-line

  const rf = analisar(s.A, s.B, s.f);
  const rg = analisar(s.B, s.C, s.g);
  const gf = s.comp ? compor(s.f, s.g) : [];
  const cols = s.comp ? [s.A, s.B, s.C] : [s.A, s.B];
  const xs = s.comp ? [56, 180, 304] : [84, 276];
  const yDe = (n: number, k: number) => { const passo = Math.min(50, 210 / Math.max(1, n)); return 158 - ((n - 1) * passo) / 2 + k * passo; };
  const pos = (col: number, el: string) => ({ x: xs[col], y: yDe(cols[col].length, cols[col].indexOf(el)) });

  const marcarFeito = (msg: string) => { setRetorno({ ok: true, msg }); if (d && !feitos.includes(d.id)) setFeitos([...feitos, d.id]); };
  const conferir = () => {
    if (!d) return;
    const f = d.falta(rf, s);
    if (f) setRetorno({ ok: false, msg: d.impossivel ? f + ' Continue tentando, ou aperte "É impossível" se tiver certeza.' : f });
    else marcarFeito('Resolvido. ' + (d.depois ?? ''));
  };

  const alternar = (qual: 'f' | 'g', par: Pair) => {
    const lista0 = s[qual], existe = lista0.some((p) => p[0] === par[0] && p[1] === par[1]);
    const novo = { ...s, [qual]: existe ? lista0.filter((p) => !(p[0] === par[0] && p[1] === par[1])) : [...lista0, par] };
    if (qual === 'f' && !s.comp) {
      const depois = analisar(s.A, s.B, novo.f).isFunction;
      prev.pedir({ pergunta: `Você vai ${existe ? 'apagar' : 'criar'} a seta ${par[0]} → ${par[1]}. Depois disso, f é uma função?`, opcoes: ['Sim', 'Não'], real: depois ? 0 : 1, porque: depois ? 'Cada entrada ficou com exatamente uma saída.' : 'Alguma entrada ficou sem saída, ou com mais de uma.', aplicar: () => h.mudar(novo) });
    } else h.mudar(novo);
  };
  const tocar = (col: number, el: string) => {
    if (sel && sel.col === col - 1) { alternar(sel.col === 0 ? 'f' : 'g', [sel.el, el]); setSel(null); return; }
    if (col === cols.length - 1) { setSel(null); return; }
    setSel(sel?.col === col && sel.el === el ? null : { col, el });
  };
  const mudarTam = (k: 'A' | 'B' | 'C', delta: number) => {
    const atual = s[k], n = atual.length + delta;
    if (n < 1 || n > NOMES[k].length) return;
    const base = atual.every((x) => NOMES[k].includes(x)) ? NOMES[k] : [...atual, ...NOMES[k]];
    const novo = delta > 0 ? [...atual, base.find((x) => !atual.includes(x))!] : atual.slice(0, -1);
    const tirado = delta < 0 ? atual[atual.length - 1] : null;
    h.mudar({ ...s, [k]: novo, f: s.f.filter((p) => (k === 'A' ? p[0] !== tirado : k === 'B' ? p[1] !== tirado : true)), g: s.g.filter((p) => (k === 'B' ? p[0] !== tirado : k === 'C' ? p[1] !== tirado : true)) });
  };

  const seta = (qual: 'f' | 'g' | 'gf', par: Pair, i: number) => {
    const a = pos(qual === 'g' ? 1 : 0, par[0]), b = pos(qual === 'f' ? 1 : 2, par[1]);
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const p1 = { x: a.x + ux * 21, y: a.y + uy * 21 }, p2 = { x: b.x - ux * 25, y: b.y - uy * 25 };
    if (qual === 'gf') {
      const my = Math.min(a.y, b.y) - 46;
      return <path key={'gf' + i} d={`M${a.x},${a.y - 20} Q${(a.x + b.x) / 2},${my} ${b.x},${b.y - 20}`} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="6 5" markerEnd="url(#pontaGf)" />;
    }
    const cor = qual === 'f' ? 'var(--va)' : 'var(--vc)';
    return (
      <g key={qual + i} onPointerDown={(e) => gesto.iniciar(e, { tocar: () => alternar(qual, par) })} style={{ cursor: 'pointer' }}>
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={20} />
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={cor} strokeWidth={3} markerEnd={`url(#ponta${qual})`} />
      </g>
    );
  };

  const cenarios = modo === 'livre' ? CENARIOS.map((c) => ({ rotulo: c.rotulo, acao: () => { h.mudar(c.s); setNota(c.nota); setSel(null); } })) : undefined;
  const titulos = s.comp ? ['A', 'B', 'C'] : ['A (domínio)', 'B (contradomínio)'];

  return (
    <Moldura titulo="Máquina de funções" modo={modo} onModo={(m) => { setModo(m); prev.limpar(); }} h={h} previsao={modo === 'livre' ? prev : undefined} cenarios={cenarios}>
      {d && (
        <div className="desafio">
          <div className="entre"><span className="rotulo">Desafio {iD + 1} de {lista.length}</span>{feitos.includes(d.id) && <span className="pilula ok">feito</span>}</div>
          <p>{d.texto}</p>
          {retorno && <div className={'fb ' + (retorno.ok ? 'ok' : 'bad')} aria-live="polite">{retorno.msg}</div>}
          <div className="linha">
            <button className="btn sm pri" onClick={conferir}>Conferir</button>
            {d.impossivel && <button className="btn sm" onClick={() => marcarFeito(d.impossivel!)}>É impossível</button>}
            <button className="btn sm" disabled={iD === 0} onClick={() => setID(iD - 1)}>← anterior</button>
            <button className="btn sm" disabled={iD >= lista.length - 1} onClick={() => setID(iD + 1)}>próximo →</button>
          </div>
        </div>
      )}
      {nota && modo === 'livre' && <div className="fb neutro">{nota}</div>}
      {prev.painel}

      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="palco" role="img" aria-label="Diagrama de setas entre conjuntos" onPointerDown={(e) => gesto.iniciar(e, { tocar: () => setSel(null) })}>
        <defs>
          {(['f', 'g', 'Gf'] as const).map((q) => (
            <marker key={q} id={'ponta' + q} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={q === 'f' ? 'var(--va)' : q === 'g' ? 'var(--vc)' : 'var(--accent)'} />
            </marker>
          ))}
        </defs>
        {cols.map((c, k) => (
          <g key={k}>
            <ellipse cx={xs[k]} cy={158} rx={40} ry={122} fill="var(--paper)" stroke="var(--line)" strokeWidth={2} />
            <text x={xs[k]} y={24} textAnchor="middle" fontSize={12} fontWeight={800}>{titulos[k]}</text>
          </g>
        ))}
        {s.comp && <><text x={(xs[0] + xs[1]) / 2} y={290} textAnchor="middle" fontSize={13} fontWeight={800} style={{ fill: 'var(--va)' }}>f</text><text x={(xs[1] + xs[2]) / 2} y={290} textAnchor="middle" fontSize={13} fontWeight={800} style={{ fill: 'var(--vc)' }}>g</text></>}
        {gf.map((p, i) => seta('gf', p, i))}
        {s.f.map((p, i) => seta('f', p, i))}
        {s.comp && s.g.map((p, i) => seta('g', p, i))}
        {cols.map((c, col) => c.map((el) => {
          const p = pos(col, el), marcado = sel?.col === col && sel.el === el;
          const rep = col === 0 ? rf : col === 1 && s.comp ? rg : null;
          const quebra = rep ? rep.semImagem.includes(el) || rep.comVarias.includes(el) : false;
          const chegada = col === 1 ? rf : col === 2 ? rg : null;
          const colide = chegada?.colisoes.includes(el), vazioEl = chegada?.naoAtingidos.includes(el);
          return (
            <g key={col + el} className="pega" transform={`translate(${p.x} ${p.y})`} onPointerDown={(e) => gesto.iniciar(e, { tocar: () => tocar(col, el) })}>
              <circle r={23} fill="transparent" />
              <circle r={19} fill={marcado ? 'var(--accent)' : 'var(--paper-2)'} stroke={quebra ? 'var(--bad)' : colide ? 'var(--gold)' : 'var(--ink-2)'} strokeWidth={quebra || colide ? 3.5 : 1.5} strokeDasharray={vazioEl ? '4 3' : undefined} className={marcado ? 'pulsa' : ''} />
              <text textAnchor="middle" y={4.5} fontSize={el.length > 2 ? 10.5 : 14} fontWeight={700} style={{ fill: marcado ? 'var(--accent-ink)' : 'var(--ink)' }}>{el}</text>
            </g>
          );
        }))}
      </svg>
      <span className="mini">{sel ? `Agora toque num elemento da coluna seguinte para ligar ${sel.el}.` : 'Toque num elemento e depois em outro da coluna ao lado para criar a seta. Toque na seta para apagar.'} Contorno vermelho = quebra a regra de função. Amarelo = colisão. Tracejado = ninguém chega.</span>

      <div className="vivo" aria-live="polite">
        <div className="linha">
          <b className="cA">f</b>
          <Selo ok={rf.isFunction}>é função</Selo><Selo ok={rf.injetora}>injetora</Selo><Selo ok={rf.sobrejetora}>sobrejetora</Selo><Selo ok={rf.bijetora}>bijetora</Selo>
        </div>
        {!rf.isFunction && <span className="mini">{rf.semImagem.length ? `Sem saída: ${rf.semImagem.join(', ')}. ` : ''}{rf.comVarias.length ? `Com mais de uma saída: ${rf.comVarias.join(', ')}.` : ''}</span>}
        <div className="f">f = {'{'}{s.f.map((p) => `(${p[0]},${p[1]})`).join(', ')}{'}'} <span className="mini">⊂ A × B, que tem {s.A.length} × {s.B.length} = {s.A.length * s.B.length} pares</span></div>
        <div className="f">Imagem = {'{'}{rf.imagem.join(', ')}{'}'} <span className="mini">({rf.imagem.length} de {s.B.length} do contradomínio)</span></div>
        {s.comp && (
          <>
            <div className="linha"><b className="cC">g</b><Selo ok={rg.isFunction}>é função</Selo><Selo ok={rg.injetora}>injetora</Selo><Selo ok={rg.sobrejetora}>sobrejetora</Selo></div>
            <div className="f"><b>g∘f</b> = {'{'}{gf.map((p) => `(${p[0]},${p[1]})`).join(', ')}{'}'}</div>
            {gf.map((p) => { const meio = s.f.find((q) => q[0] === p[0] && s.g.some((r) => r[0] === q[1] && r[1] === p[1])); return <div key={p.join()} className="f mini">(g∘f)({p[0]}) = g(f({p[0]})) = g({meio?.[1]}) = {p[1]}</div>; })}
          </>
        )}
      </div>

      {modo === 'livre' && (
        <div className="linha">
          {(['A', 'B', ...(s.comp ? ['C'] : [])] as ('A' | 'B' | 'C')[]).map((k) => (
            <span key={k} className="linha" style={{ gap: 4 }}><span className="mono">{k}</span><button className="btn sm" onClick={() => mudarTam(k, -1)} aria-label={`Tirar elemento de ${k}`}>−</button><button className="btn sm" onClick={() => mudarTam(k, 1)} aria-label={`Pôr elemento em ${k}`}>+</button></span>
          ))}
          <button className="btn sm" aria-pressed={s.comp} onClick={() => h.mudar({ ...s, comp: !s.comp })}>Composição g∘f</button>
        </div>
      )}
    </Moldura>
  );
}
