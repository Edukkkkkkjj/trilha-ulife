// VENN VIVO: arraste os elementos para dentro e para fora dos círculos.
// Desenho, símbolos e números ficam ligados: mexeu numa bolinha, a conta muda na hora.
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Moldura, limitar, pontoSvg, useGesto, useHistorico, useModo, usePrevisao, type Pt } from '../Sandbox';
import { countIn, evalSetExpr, regionExpr, regionName, regionOf, regionsOf, universe } from '../../lib/sets';
import { lerNumero } from '../../engine/corrigir';
import type { ToyProps } from './tipos';

const W = 360, H = 310;
type Circ = { cx: number; cy: number; r: number; nome: 'A' | 'B' | 'C'; cor: string };
const CIRC: Record<2 | 3, Circ[]> = {
  2: [
    { cx: 138, cy: 142, r: 96, nome: 'A', cor: 'var(--va)' },
    { cx: 222, cy: 142, r: 96, nome: 'B', cor: 'var(--vb)' },
  ],
  3: [
    { cx: 135, cy: 118, r: 88, nome: 'A', cor: 'var(--va)' },
    { cx: 225, cy: 118, r: 88, nome: 'B', cor: 'var(--vb)' },
    { cx: 180, cy: 194, r: 88, nome: 'C', cor: 'var(--vc)' },
  ],
};

export function regiaoDoPonto(n: 2 | 3, p: Pt): number {
  const c = CIRC[n];
  const dentro = (k: number) => !!c[k] && Math.hypot(p.x - c[k].cx, p.y - c[k].cy) <= c[k].r;
  return regionOf(dentro(0), dentro(1), dentro(2));
}

// Lugares "confortáveis" para pousar bolinhas em cada região (calculado uma vez).
const cacheVagas = new Map<string, Pt[]>();
export function vagas(n: 2 | 3, r: number): Pt[] {
  const k = `${n}-${r}`;
  if (cacheVagas.has(k)) return cacheVagas.get(k)!;
  const pts: Pt[] = [];
  for (let y = 26; y <= H - 22; y += 13) for (let x = 24; x <= W - 24; x += 13) {
    const p = { x, y };
    if (regiaoDoPonto(n, p) !== r) continue;
    if (CIRC[n].some((c) => Math.abs(Math.hypot(x - c.cx, y - c.cy) - c.r) < 16)) continue;
    pts.push(p);
  }
  const cx = pts.reduce((s, p) => s + p.x, 0) / (pts.length || 1), cy = pts.reduce((s, p) => s + p.y, 0) / (pts.length || 1);
  // Escolhe pontos espalhados (pelo menos 27 de distância entre si), do centro da região para fora.
  const ordenados = r === 0 ? pts.sort((a, b) => b.y - a.y || a.x - b.x) : pts.sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
  const esc: Pt[] = [];
  for (const p of ordenados) if (esc.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= 27)) esc.push(p);
  cacheVagas.set(k, esc);
  return esc;
}

export type Item = { id: string; nome: string; x: number; y: number };
export type EstadoVenn = { n: 2 | 3; itens: Item[] };

/** Coloca elementos nas regiões pedidas, sem um em cima do outro. */
export function distribuir(n: 2 | 3, aloc: { nome: string; regiao: number }[]): Item[] {
  const usados = new Map<number, number>();
  return aloc.map((a, i) => {
    const v = vagas(n, a.regiao), k = usados.get(a.regiao) ?? 0;
    usados.set(a.regiao, k + 1);
    const p = v[k % Math.max(1, v.length)] ?? { x: 30 + i * 20, y: H - 26 };
    return { id: `e${i}-${a.nome}`, nome: a.nome, x: p.x, y: p.y };
  });
}

const CLIENTES = (): EstadoVenn => ({
  n: 2,
  itens: distribuir(2, [
    { nome: 'C1', regiao: 1 }, { nome: 'C2', regiao: 1 }, { nome: 'C3', regiao: 1 }, { nome: 'C6', regiao: 1 },
    { nome: 'C4', regiao: 3 }, { nome: 'C5', regiao: 3 }, { nome: 'C7', regiao: 2 }, { nome: 'C8', regiao: 2 },
  ]),
});
const INICIAL = CLIENTES();
const valido = (x: unknown) => !!x && typeof x === 'object' && Array.isArray((x as EstadoVenn).itens) && ((x as EstadoVenn).n === 2 || (x as EstadoVenn).n === 3);

function contagens(s: EstadoVenn): number[] {
  const q = Array(8).fill(0);
  for (const it of s.itens) q[regiaoDoPonto(s.n, it)]++;
  return q;
}

// ---------- desenho de uma região (interseção por recorte, exclusão por máscara) ----------
function Defs({ n, uid }: { n: 2 | 3; uid: string }) {
  const c = CIRC[n];
  return (
    <defs>
      {c.map((x, k) => <clipPath key={k} id={`${uid}c${k}`}><circle cx={x.cx} cy={x.cy} r={x.r} /></clipPath>)}
      {Array.from({ length: n === 3 ? 8 : 4 }, (_, r) => (
        <mask key={r} id={`${uid}m${r}`} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <rect x={6} y={6} width={W - 12} height={H - 12} rx={14} fill="white" />
          {c.map((x, k) => ((r >> k) & 1 ? null : <circle key={k} cx={x.cx} cy={x.cy} r={x.r} fill="black" />))}
        </mask>
      ))}
    </defs>
  );
}
function Forma({ n, r, uid, fill, opacity = 1 }: { n: 2 | 3; r: number; uid: string; fill: string; opacity?: number }) {
  let el = <rect x={0} y={0} width={W} height={H} fill={fill} opacity={opacity} mask={`url(#${uid}m${r})`} />;
  CIRC[n].forEach((_, k) => { if ((r >> k) & 1) el = <g clipPath={`url(#${uid}c${k})`}>{el}</g>; });
  return el;
}
function Circulos({ n }: { n: 2 | 3 }) {
  return (
    <>
      <rect x={6} y={6} width={W - 12} height={H - 12} rx={14} fill="none" stroke="var(--line)" strokeWidth={2} />
      <text x={18} y={26} fontSize={13} fontWeight={700} style={{ fill: 'var(--ink-3)' }}>U</text>
      {CIRC[n].map((c) => <circle key={c.nome} cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke={c.cor} strokeWidth={3} />)}
      {CIRC[n].map((c, k) => {
        const pos = n === 3 ? [{ x: 62, y: 44 }, { x: 298, y: 44 }, { x: 180, y: 300 }][k] : [{ x: 60, y: 62 }, { x: 300, y: 62 }][k];
        return <text key={c.nome} x={pos.x} y={pos.y} textAnchor="middle" fontSize={20} fontWeight={800} style={{ fill: c.cor }}>{c.nome}</text>;
      })}
    </>
  );
}

// ---------- pintar regiões (usado em exercícios e desafios) ----------
export function VennPintar({ n, sel, onToggle, gabarito, travado }: { n: 2 | 3; sel: number[]; onToggle: (r: number) => void; gabarito?: number[]; travado?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const ref = useRef<SVGSVGElement>(null);
  const total = n === 3 ? 8 : 4;
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="palco" role="img" aria-label="Diagrama de Venn para pintar"
      onClick={(e) => { if (!travado && ref.current) onToggle(regiaoDoPonto(n, pontoSvg(ref.current, e))); }} style={{ cursor: travado ? 'default' : 'pointer' }}>
      <Defs n={n} uid={uid} />
      {Array.from({ length: total }, (_, r) => {
        const pintada = sel.includes(r), devia = gabarito?.includes(r);
        if (gabarito) {
          if (pintada && devia) return <Forma key={r} n={n} r={r} uid={uid} fill="var(--ok)" opacity={0.55} />;
          if (pintada && !devia) return <Forma key={r} n={n} r={r} uid={uid} fill="var(--bad)" opacity={0.5} />;
          if (!pintada && devia) return <Forma key={r} n={n} r={r} uid={uid} fill="var(--gold)" opacity={0.45} />;
          return null;
        }
        return pintada ? <Forma key={r} n={n} r={r} uid={uid} fill="var(--accent)" opacity={0.45} /> : null;
      })}
      <Circulos n={n} />
    </svg>
  );
}

// ---------- desafios ----------
type Desafio =
  | { id: string; tipo: 'arrumar'; n: 2 | 3; texto: string; qtd: number; metas: { expr: string; valor: number }[]; prever?: { pergunta: string; expr: string; porque: string } }
  | { id: string; tipo: 'pintar'; n: 2 | 3; texto: string; alvo: string };

export const DESAFIOS_VENN: Desafio[] = [
  { id: 'v-arr-2', tipo: 'arrumar', n: 2, qtd: 9, texto: 'Arraste os elementos até ficar: |A| = 5, |B| = 4 e |A ∩ B| = 2. Os que sobrarem ficam fora.', metas: [{ expr: 'A', valor: 5 }, { expr: 'B', valor: 4 }, { expr: 'A∩B', valor: 2 }], prever: { pergunta: 'Antes de arrastar: quanto vai dar |A ∪ B|?', expr: 'A∪B', porque: '5 + 4 conta os 2 da interseção duas vezes; tirando uma vez: 5 + 4 − 2 = 7.' } },
  { id: 'v-pin-1', tipo: 'pintar', n: 3, texto: 'Pinte a região (B ∩ C) − A: está em B e em C, mas não em A.', alvo: '(B∩C)−A' },
  { id: 'v-pin-2', tipo: 'pintar', n: 3, texto: 'Pinte A − (B ∪ C): "apenas A". É a região que a questão da U1 pedia.', alvo: 'A−(B∪C)' },
  { id: 'v-pin-3', tipo: 'pintar', n: 3, texto: 'Pinte (A ∪ B) − C: quem está em A ou em B, mas não em C.', alvo: '(A∪B)−C' },
  { id: 'v-pin-4', tipo: 'pintar', n: 2, texto: "Pinte A' ∩ B: fora de A e dentro de B.", alvo: "A'∩B" },
  { id: 'v-pin-5', tipo: 'pintar', n: 3, texto: "Pinte (A ∪ B ∪ C)': quem não está em nenhum dos três.", alvo: "(A∪B∪C)'" },
  { id: 'v-pin-6', tipo: 'pintar', n: 3, texto: 'Pinte (A ∩ B) ∪ C. Cuidado com a ordem: primeiro o que está entre parênteses.', alvo: '(A∩B)∪C' },
  { id: 'v-arr-3', tipo: 'arrumar', n: 3, qtd: 10, texto: 'De dentro para fora: |A ∩ B ∩ C| = 1, |A ∩ B| = 3, |A ∩ C| = 2, |A| = 6. Os outros ficam fora de A.', metas: [{ expr: 'A∩B∩C', valor: 1 }, { expr: 'A∩B', valor: 3 }, { expr: 'A∩C', valor: 2 }, { expr: 'A', valor: 6 }], prever: { pergunta: 'Quantos elementos vão ficar "só em A" (em A e em mais nenhum)?', expr: 'A−(B∪C)', porque: 'Em A∩B há 3 e em A∩C há 2, mas 1 está nos dois grupos: 3 + 2 − 1 = 4 estão em A e em mais alguém. 6 − 4 = 2.' } },
];

const TECLAS = ['A', 'B', 'C', '∪', '∩', '−', "'", '(', ')'];

export function VennVivo({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const uid = useId().replace(/:/g, '');
  const svg = useRef<SVGSVGElement>(null);
  const gesto = useGesto(svg);
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoVenn>(INICIAL, chave, valido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const prev = usePrevisao(false);
  const s = h.estado;
  const [selItem, setSelItem] = useState<string | null>(null);
  const [selReg, setSelReg] = useState<number | null>(null);
  const [termo, setTermo] = useState<string | null>(null);
  const [expr, setExpr] = useState('');
  const q = useMemo(() => contagens(s), [s]);
  const conta = (e: string) => countIn(evalSetExpr(e, s.n), q);

  // --- desafios ---
  const lista = useMemo(() => DESAFIOS_VENN.filter((d) => !desafios || desafios.includes(d.id)), [desafios]);
  const [iD, setID] = useState(0);
  const [feitos, setFeitos] = useState<string[]>([]);
  const [pintadas, setPintadas] = useState<number[]>([]);
  const [conferido, setConferido] = useState<null | { ok: boolean; msg: string }>(null);
  const [palpite, setPalpite] = useState('');
  const d = modo === 'desafio' ? lista[iD] : undefined;
  useEffect(() => { onProgresso?.(feitos.length, lista.length); }, [feitos.length, lista.length]); // eslint-disable-line
  useEffect(() => {
    setConferido(null); setPintadas([]); setPalpite(''); setSelReg(null); setTermo(null);
    if (d?.tipo === 'arrumar') h.mudar({ n: d.n, itens: distribuir(d.n, Array.from({ length: d.qtd }, (_, k) => ({ nome: String(k + 1), regiao: 0 }))) });
  }, [d?.id]); // eslint-disable-line

  const conferir = () => {
    if (!d) return;
    if (d.tipo === 'pintar') {
      const alvo = regionsOf(evalSetExpr(d.alvo, d.n), d.n);
      const ok = alvo.length === pintadas.length && alvo.every((r) => pintadas.includes(r));
      setConferido({ ok, msg: ok ? `Certo: ${d.alvo}.` : 'Ainda não. Verde = certo, vermelho = pintou a mais, amarelo = faltou pintar.' });
      if (ok && !feitos.includes(d.id)) setFeitos([...feitos, d.id]);
    } else {
      const erradas = d.metas.filter((m) => conta(m.expr) !== m.valor);
      const ok = erradas.length === 0;
      let msg = ok ? 'Tudo no lugar.' : `Ainda não: |${erradas[0].expr}| está em ${conta(erradas[0].expr)} e precisa ser ${erradas[0].valor}.`;
      if (ok && d.prever) {
        const real = conta(d.prever.expr), g = lerNumero(palpite);
        msg += ` |${d.prever.expr}| = ${real}. ${g === null ? '' : g === real ? 'Seu palpite bateu. ' : `Seu palpite foi ${g}. `}${d.prever.porque}`;
      }
      setConferido({ ok, msg });
      if (ok && !feitos.includes(d.id)) setFeitos([...feitos, d.id]);
    }
  };

  // --- destaque (região tocada, termo da fórmula ou expressão digitada) ---
  let mascara = 0, erroExpr = '';
  if (termo) mascara = evalSetExpr(termo, s.n);
  else if (expr.trim()) { try { mascara = evalSetExpr(expr, s.n); } catch (e) { erroExpr = (e as Error).message; } }
  else if (selReg !== null) mascara = 1 << selReg;

  const mover = (id: string, p: Pt) => h.ajustar((st) => ({ ...st, itens: st.itens.map((it) => (it.id === id ? { ...it, x: limitar(p.x, 20, W - 20), y: limitar(p.y, 20, H - 20) } : it)) }));

  const pegar = (e: React.PointerEvent, it: Item) => {
    const orig = { x: it.x, y: it.y };
    gesto.iniciar(e, {
      comecar: () => { h.marcar(); setSelItem(it.id); },
      mover: (p) => mover(it.id, p),
      soltar: (p) => {
        const destino = { x: limitar(p.x, 20, W - 20), y: limitar(p.y, 20, H - 20) };
        const r0 = regiaoDoPonto(s.n, orig), r1 = regiaoDoPonto(s.n, destino);
        if (!prev.ativa || r0 === r1) return;
        const U = s.n === 3 ? 'A∪B∪C' : 'A∪B';
        const antes = (r0 === 0 ? 0 : 1), depois = (r1 === 0 ? 0 : 1);
        mover(it.id, orig);
        prev.pedir({
          pergunta: `Você quer levar ${it.nome} de "${regionName(r0, s.n)}" para "${regionName(r1, s.n)}". O total |${U}| vai…`,
          opcoes: ['aumentar', 'diminuir', 'ficar igual'],
          real: depois > antes ? 0 : depois < antes ? 1 : 2,
          porque: depois === antes ? 'A união conta cada elemento uma vez só, não importa em quantos círculos ele esteja.' : 'A união só muda quando alguém entra ou sai de TODOS os círculos.',
          aplicar: () => mover(it.id, destino),
        });
      },
      tocar: () => setSelItem((x) => (x === it.id ? null : it.id)),
    });
  };

  const termos = s.n === 2
    ? [['A∪B', '='], ['A', '+'], ['B', '−'], ['A∩B', '']]
    : [['A∪B∪C', '='], ['A', '+'], ['B', '+'], ['C', '−'], ['A∩B', '−'], ['A∩C', '−'], ['B∩C', '+'], ['A∩B∩C', '']];
  const dobro = s.n === 2 ? conta('A') + conta('B') - conta('A∪B') : conta('A') + conta('B') + conta('C') - conta('A∪B∪C');
  const nomes = (m: number) => s.itens.filter((it) => (m >> regiaoDoPonto(s.n, it)) & 1).map((it) => it.nome);
  const proximoNome = () => { const usados = new Set(s.itens.map((i) => i.nome)); let k = 1; while (usados.has(String(k)) || usados.has('C' + k)) k++; return s.itens[0]?.nome.startsWith('C') ? 'C' + k : String(k); };

  const cenarios = modo === 'livre' ? [
    { rotulo: 'E se… ninguém em comum?', acao: () => h.mudar((st) => ({ n: 2, itens: distribuir(2, st.itens.map((it, k) => ({ nome: it.nome, regiao: k % 2 ? 2 : 1 }))) })) },
    { rotulo: 'E se… B inteiro dentro de A?', acao: () => h.mudar((st) => ({ n: 2, itens: distribuir(2, st.itens.map((it, k) => ({ nome: it.nome, regiao: k % 3 === 0 ? 3 : k % 3 === 1 ? 1 : 0 }))) })) },
    { rotulo: 'E se… três conjuntos?', acao: () => h.mudar((st) => ({ n: 3, itens: distribuir(3, st.itens.map((it, k) => ({ nome: it.nome, regiao: [1, 3, 7, 5, 2, 6, 4, 0][k % 8] }))) })) },
    { rotulo: 'E se… clientes X e Y (U1)?', acao: () => h.mudar(CLIENTES()) },
  ] : undefined;

  const pintando = d?.tipo === 'pintar';
  return (
    <Moldura titulo="Venn vivo" modo={modo} onModo={(m) => { setModo(m); prev.limpar(); }} h={h} previsao={modo === 'livre' ? prev : undefined} cenarios={cenarios}>
      {modo === 'desafio' && d && (
        <div className="desafio">
          <div className="entre"><span className="rotulo">Desafio {iD + 1} de {lista.length}</span>{feitos.includes(d.id) && <span className="pilula ok">feito</span>}</div>
          <p>{d.texto}</p>
          {d.tipo === 'arrumar' && d.prever && !conferido?.ok && (
            <label className="linha">{d.prever.pergunta}
              <input className="campo" style={{ width: 90 }} inputMode="numeric" value={palpite} onChange={(e) => setPalpite(e.target.value)} placeholder="palpite" aria-label="Seu palpite" />
            </label>
          )}
          {conferido && <div className={'fb ' + (conferido.ok ? 'ok' : 'bad')} aria-live="polite">{conferido.msg}</div>}
          <div className="linha">
            <button className="btn sm pri" onClick={conferir}>Conferir</button>
            {pintando && <button className="btn sm" onClick={() => { setPintadas([]); setConferido(null); }}>Limpar pintura</button>}
            <button className="btn sm" disabled={iD === 0} onClick={() => setID(iD - 1)}>← anterior</button>
            <button className="btn sm" disabled={iD >= lista.length - 1} onClick={() => setID(iD + 1)}>próximo →</button>
          </div>
        </div>
      )}
      {prev.painel}

      {pintando && d ? (
        <VennPintar n={d.n} sel={pintadas} onToggle={(r) => { setConferido(null); setPintadas((x) => (x.includes(r) ? x.filter((y) => y !== r) : [...x, r])); }}
          gabarito={conferido ? regionsOf(evalSetExpr(d.alvo, d.n), d.n) : undefined} />
      ) : (
        <>
          <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="palco" role="img" aria-label="Diagrama de Venn com elementos arrastáveis"
            onPointerDown={(e) => gesto.iniciar(e, { tocar: (p) => { setTermo(null); setExpr(''); setSelItem(null); const r = regiaoDoPonto(s.n, p); setSelReg((x) => (x === r ? null : r)); } })}>
            <Defs n={s.n} uid={uid} />
            {regionsOf(mascara & universe(s.n), s.n).map((r) => <Forma key={r} n={s.n} r={r} uid={uid} fill="var(--accent)" opacity={0.3} />)}
            <Circulos n={s.n} />
            {s.itens.map((it) => {
              const r = regiaoDoPonto(s.n, it), dest = (mascara >> r) & 1;
              return (
                <g key={it.id} className="pega" onPointerDown={(e) => pegar(e, it)} transform={`translate(${it.x} ${it.y})`}>
                  <circle r={20} fill="transparent" />
                  <circle r={13} fill={dest ? 'var(--accent)' : 'var(--paper)'} stroke={selItem === it.id ? 'var(--gold)' : 'var(--ink-2)'} strokeWidth={selItem === it.id ? 3.5 : 1.5} />
                  <text textAnchor="middle" y={4} fontSize={it.nome.length > 2 ? 9 : 11} fontWeight={700} style={{ fill: dest ? 'var(--accent-ink)' : 'var(--ink)' }}>{it.nome}</text>
                </g>
              );
            })}
          </svg>

          <div className="vivo" aria-live="polite">
            <div className="linha" style={{ gap: 4 }}>
              {termos.map(([t, op]) => (
                <span key={t} className="linha" style={{ gap: 4 }}>
                  <button className="btn sm" aria-pressed={termo === t} onClick={() => { setExpr(''); setSelReg(null); setTermo(termo === t ? null : t); }} style={{ flexDirection: 'column', gap: 0, padding: '4px 8px' }}>
                    <span className="mono" style={{ fontSize: '.78rem' }}>|{t}|</span><span className="num">{conta(t)}</span>
                  </button>
                  <span className="mono">{op}</span>
                </span>
              ))}
            </div>
            <span className="mini">Toque num termo para ver no desenho o que ele conta.{dobro > 0 ? ` Somar os conjuntos sem descontar daria ${conta(s.n === 2 ? 'A∪B' : 'A∪B∪C') + dobro}: ${dobro} a mais, porque quem está em mais de um círculo é contado de novo.` : ' Aqui ninguém está em dois círculos: a soma simples já acerta.'}</span>
            {CIRC[s.n].map((c) => <div key={c.nome} className="f"><b style={{ color: c.cor }}>{c.nome}</b> = {'{'}{nomes(evalSetExpr(c.nome, s.n)).join(', ')}{'}'}</div>)}
            {(mascara !== 0 || selReg !== null) && !erroExpr && (
              <div><b>Destacado:</b> {selReg !== null && !termo && !expr.trim() ? <><span className="mono">{regionExpr(selReg, s.n)}</span> ({regionName(selReg, s.n)})</> : <span className="mono">{termo ?? expr}</span>} = {'{'}{nomes(mascara).join(', ')}{'}'}, <span className="num">{countIn(mascara, q)}</span> elemento(s)</div>
            )}
          </div>

          <div className="linha">
            <div className="seg"><button aria-pressed={s.n === 2} onClick={() => s.n !== 2 && h.mudar({ n: 2, itens: distribuir(2, s.itens.map((it) => ({ nome: it.nome, regiao: regiaoDoPonto(3, it) & 3 }))) })}>2 conjuntos</button><button aria-pressed={s.n === 3} onClick={() => s.n !== 3 && h.mudar({ n: 3, itens: distribuir(3, s.itens.map((it) => ({ nome: it.nome, regiao: regiaoDoPonto(2, it) }))) })}>3 conjuntos</button></div>
            <button className="btn sm" onClick={() => { const nome = proximoNome(); const v = vagas(s.n, 0); const livre = v.find((p) => s.itens.every((it) => Math.hypot(it.x - p.x, it.y - p.y) > 24)) ?? { x: 30, y: H - 26 }; h.mudar({ ...s, itens: [...s.itens, { id: 'n' + Date.now(), nome, ...livre }] }); }} disabled={s.itens.length >= 14}>+ elemento</button>
            <button className="btn sm" disabled={!selItem} onClick={() => { h.mudar({ ...s, itens: s.itens.filter((it) => it.id !== selItem) }); setSelItem(null); }}>Remover selecionado</button>
          </div>

          <div className="pilha" style={{ gap: 6 }}>
            <label className="rotulo" htmlFor={uid + 'x'}>Escreva uma expressão e veja a região</label>
            <input id={uid + 'x'} className="campo mono" value={expr} placeholder="ex.: (B∩C)−A" onChange={(e) => { setTermo(null); setSelReg(null); setExpr(e.target.value); }} autoCapitalize="characters" autoCorrect="off" spellCheck={false} />
            <div className="teclas">{TECLAS.filter((t) => s.n === 3 || t !== 'C').map((t) => <button key={t} className="tecla" onClick={() => { setTermo(null); setSelReg(null); setExpr(expr + t); }}>{t}</button>)}<button className="tecla" onClick={() => setExpr(expr.slice(0, -1))} aria-label="Apagar">⌫</button></div>
            {erroExpr && <span className="mini" style={{ color: 'var(--bad)' }}>{erroExpr}</span>}
          </div>
        </>
      )}
    </Moldura>
  );
}
