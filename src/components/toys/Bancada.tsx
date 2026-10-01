// BANCADA DE CIRCUITOS LIVRE: arraste portas, ligue fios, acione as chaves e veja o sinal passar.
// O jogo escreve a expressão e a tabela-verdade do circuito que VOCÊ montou.
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Moldura, limitar, useGesto, useHistorico, useModo, type Pt } from '../Sandbox';
import {
  type Circuit, type CNode, type GateType, type NodeType, GATES, build, describe, exprOf, gates, hasOutput, inputs, matches, nInputs, newId,
  outputs, signal, tableOf, wouldCycle,
} from '../../lib/circuit';
import { type Ast, type Env, equivalent, evalAst, parse, show, tryParse, vars } from '../../lib/logic';
import type { ToyProps } from './tipos';

const W = 360, H = 400;

export const PRESETS_BANCADA: Record<string, { rotulo: string; c: () => Circuit }> = {
  and: { rotulo: 'A·B', c: () => build({ ins: ['A', 'B'], gates: [['g1', 'AND', 'A', 'B']], out: 'g1' }) },
  mux: { rotulo: "Multiplexador AB + A'C", c: () => build({ ins: ['A', 'B', 'C'], gates: [['n', 'NOT', 'A'], ['x', 'AND', 'A', 'B'], ['y', 'AND', 'n', 'C'], ['o', 'OR', 'x', 'y']], out: 'o' }) },
  xor: { rotulo: 'XOR com AND/OR/NOT', c: () => build({ ins: ['A', 'B'], gates: [['na', 'NOT', 'A'], ['nb', 'NOT', 'B'], ['x', 'AND', 'A', 'nb'], ['y', 'AND', 'na', 'B'], ['o', 'OR', 'x', 'y']], out: 'o' }) },
  alarme: { rotulo: 'Alarme (A·B) + M', c: () => build({ ins: ['A', 'B', 'M'], gates: [['x', 'AND', 'A', 'B'], ['o', 'OR', 'x', 'M']], out: 'o' }) },
  aegis: { rotulo: 'Aegis-Grid P + QR', c: () => build({ ins: ['P', 'Q', 'R'], gates: [['x', 'AND', 'Q', 'R'], ['o', 'OR', 'P', 'x']], out: 'o' }) },
  sobra: { rotulo: "AB + AB' (dá para enxugar)", c: () => build({ ins: ['A', 'B'], gates: [['n', 'NOT', 'B'], ['x', 'AND', 'A', 'B'], ['y', 'AND', 'A', 'n'], ['o', 'OR', 'x', 'y']], out: 'o' }) },
  absorcao: { rotulo: 'A + A·B (absorção)', c: () => build({ ins: ['A', 'B'], gates: [['x', 'AND', 'A', 'B'], ['o', 'OR', 'A', 'x']], out: 'o' }) },
};
const soChaves = (nomes: string[]): Circuit => ({
  nodes: [...nomes.map((n, k) => ({ id: n, type: 'IN' as NodeType, name: n, x: 34, y: 60 + k * 80, on: false })), { id: 'S', type: 'OUT' as NodeType, name: 'S', x: 326, y: 60 + ((nomes.length - 1) * 80) / 2 }],
  wires: [],
});
const INICIAL = PRESETS_BANCADA.and.c();
const valido = (x: unknown) => !!x && Array.isArray((x as Circuit).nodes) && Array.isArray((x as Circuit).wires);

type Desafio = { id: string; texto: string; alvo: string; entradas: string[]; permitidas?: GateType[]; maxPortas?: number; preset?: string; dica: string };
export const DESAFIOS_BANCADA: Desafio[] = [
  { id: 'b-and', texto: 'Aquecimento: ligue as chaves A e B a uma porta AND e a porta à lâmpada. S = A·B.', alvo: 'A·B', entradas: ['A', 'B'], dica: 'Toque na bolinha de saída de A e depois numa bolinha de entrada da porta.' },
  { id: 'b-alarme', texto: 'Alarme residencial (U3): dispara se (porta A OU janela B) estiver aberta E o sistema C estiver ativado. Monte S = (A + B)·C.', alvo: '(A+B)·C', entradas: ['A', 'B', 'C'], dica: 'Primeiro o que está entre parênteses: uma OR com A e B. Depois uma AND com o resultado e C.' },
  { id: 'b-mux', texto: "Multiplexador (U3): a chave A escolhe quem passa. Com A = 1 passa B; com A = 0 passa C. Monte S = A·B + A'·C.", alvo: "A·B + A'·C", entradas: ['A', 'B', 'C'], dica: 'Você precisa de uma NOT (para A\'), duas AND e uma OR.' },
  { id: 'b-xor', texto: 'Monte o XOR (acende só quando A e B são diferentes) usando apenas AND, OR e NOT.', alvo: 'A ⊕ B', entradas: ['A', 'B'], permitidas: ['AND', 'OR', 'NOT'], dica: "A ⊕ B = A·B' + A'·B: dois casos, cada um com uma AND, juntos por uma OR." },
  { id: 'b-nand-not', texto: 'NAND é universal. Faça um NOT (S = A\') usando só UMA porta NAND.', alvo: "A'", entradas: ['A'], permitidas: ['NAND'], maxPortas: 1, dica: 'Ligue a mesma chave nas duas entradas da NAND: (A·A)\' = A\'.' },
  { id: 'b-nand-and', texto: 'Agora um AND (S = A·B) usando só portas NAND.', alvo: 'A·B', entradas: ['A', 'B'], permitidas: ['NAND'], maxPortas: 2, dica: 'NAND dá (A·B)\'. Negue de novo com outra NAND fazendo papel de NOT.' },
  { id: 'b-enxugar', texto: "Este circuito calcula A·B + A·B' com 4 portas. Monte um equivalente com NENHUMA porta.", alvo: "A·B + A·B'", entradas: ['A', 'B'], maxPortas: 0, preset: 'sobra', dica: "A·B + A·B' = A·(B + B') = A·1 = A. A lâmpada só depende de A: ligue A direto nela." },
  { id: 'b-absorcao', texto: 'Absorção: A + A·B. Monte um equivalente com nenhuma porta.', alvo: 'A + A·B', entradas: ['A', 'B'], maxPortas: 0, preset: 'absorcao', dica: 'Se A = 1, a saída já é 1. Se A = 0, A·B também é 0. Então a saída é sempre igual a A.' },
  { id: 'b-integrado', texto: 'Exercício integrado da U2: o alarme S dispara quando A e B falham, ou quando o modo de segurança M está ativo. Monte S = (A·B) + M.', alvo: '(A·B) + M', entradas: ['A', 'B', 'M'], dica: 'Uma AND com A e B; uma OR com o resultado e M.' },
  { id: 'b-aegis', texto: 'Aegis-Grid (U8): o sistema falha se o servidor P falha, ou se as rotas Q e R falham juntas. Monte S = P + Q·R.', alvo: 'P + Q·R', entradas: ['P', 'Q', 'R'], dica: 'A precedência manda fazer o · antes do +: primeiro a AND de Q e R.' },
];

// ---------- geometria ----------
const pinoSaida = (n: CNode): Pt => ({ x: n.x + (n.type === 'IN' ? 26 : 30), y: n.y });
const pinoEntrada = (n: CNode, pin: number): Pt => (n.type === 'OUT' ? { x: n.x - 24, y: n.y } : nInputs(n.type) === 1 ? { x: n.x - 28, y: n.y } : { x: n.x - 28, y: n.y + (pin === 0 ? -12 : 12) });
const caminho = (a: Pt, b: Pt) => { const dx = Math.max(24, Math.abs(b.x - a.x) / 2); return `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`; };

function Porta({ tipo, ativa }: { tipo: GateType; ativa: boolean | null }) {
  const cor = ativa ? 'var(--on)' : 'var(--paper)';
  const st = { fill: cor, stroke: 'var(--ink)', strokeWidth: 2 } as const;
  const bolha = tipo === 'NAND' || tipo === 'NOR' || tipo === 'XNOR';
  const base = tipo === 'NAND' ? 'AND' : tipo === 'NOR' ? 'OR' : tipo === 'XNOR' ? 'XOR' : tipo;
  return (
    <>
      {base === 'AND' && <path d="M-18,-17 H2 A17,17 0 0 1 2,17 H-18 Z" {...st} />}
      {(base === 'OR' || base === 'XOR') && <path d="M-18,-17 Q4,-17 20,0 Q4,17 -18,17 Q-9,0 -18,-17 Z" {...st} />}
      {base === 'XOR' && <path d="M-24,-17 Q-15,0 -24,17" fill="none" stroke="var(--ink)" strokeWidth={2} />}
      {base === 'NOT' && <><path d="M-16,-15 L14,0 L-16,15 Z" {...st} /><circle cx={19} cy={0} r={4.5} {...st} /></>}
      {bolha && <circle cx={24} cy={0} r={4.5} {...st} />}
      <text y={31} textAnchor="middle" fontSize={10} fontWeight={700}>{tipo}</text>
    </>
  );
}

type Sel = { t: 'no'; id: string } | { t: 'fio'; i: number } | { t: 'pino'; id: string; lado: 'saida' } | { t: 'pino'; id: string; lado: 'entrada'; pin: number } | null;

export function Bancada({ modoInicial = 'livre', desafios, preset, chave, onProgresso }: ToyProps) {
  const uid = useId();
  const svg = useRef<SVGSVGElement>(null);
  const gesto = useGesto(svg);
  const ini = useMemo(() => (preset && PRESETS_BANCADA[preset] ? PRESETS_BANCADA[preset].c() : INICIAL), [preset]);
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<Circuit>(ini, chave, valido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const c = h.estado;
  const [sel, setSel] = useState<Sel>(null);
  const [elastico, setElastico] = useState<null | { de: Pt; ate: Pt }>(null);
  const [aviso, setAviso] = useState('');
  const [alvoTxt, setAlvoTxt] = useState('');

  // --- desafios ---
  const lista = useMemo(() => DESAFIOS_BANCADA.filter((d) => !desafios || desafios.includes(d.id)), [desafios]);
  const [iD, setID] = useState(0);
  const [feitos, setFeitos] = useState<string[]>([]);
  const [retorno, setRetorno] = useState<null | { ok: boolean; msg: string }>(null);
  const [verDica, setVerDica] = useState(false);
  const d = modo === 'desafio' ? lista[iD] : undefined;
  useEffect(() => { onProgresso?.(feitos.length, lista.length); }, [feitos.length, lista.length]); // eslint-disable-line
  useEffect(() => {
    setRetorno(null); setVerDica(false); setSel(null); setAviso('');
    if (d) h.mudar(d.preset ? PRESETS_BANCADA[d.preset].c() : soChaves(d.entradas));
  }, [d?.id]); // eslint-disable-line

  const no = (id: string) => c.nodes.find((n) => n.id === id);
  const saida = outputs(c)[0];
  const memo = new Map<string, boolean | null>();
  const sinal = (id: string) => signal(c, id, undefined, memo);

  const conferir = () => {
    if (!d || !saida) return;
    const usadas = gates(c);
    const proibida = d.permitidas && usadas.find((g) => !d.permitidas!.includes(g.type as GateType));
    if (proibida) { setRetorno({ ok: false, msg: `Neste desafio só valem portas ${d.permitidas!.join(', ')}. Há uma ${proibida.type} na bancada.` }); return; }
    const alvo = parse(d.alvo);
    const r = matches(c, saida.id, alvo, vars(alvo));
    if (!r.ok) {
      setRetorno({ ok: false, msg: r.reason ?? `Ainda não é equivalente. Teste ${Object.entries(r.counter!).map(([k, v]) => `${k}=${v ? 1 : 0}`).join(', ')}: a lâmpada devia ficar ${evalAlvo(d.alvo, r.counter!) ? 'acesa' : 'apagada'}.` });
      return;
    }
    // Conta só as portas que realmente participam da saída.
    const emUso = new Set<string>();
    const sobe = (id: string) => { if (emUso.has(id)) return; emUso.add(id); c.wires.filter((w) => w.to === id).forEach((w) => sobe(w.from)); };
    sobe(saida.id);
    const nPortas = usadas.filter((g) => emUso.has(g.id)).length;
    if (d.maxPortas !== undefined && nPortas > d.maxPortas) { setRetorno({ ok: false, msg: `Está certo, mas usa ${nPortas} porta(s) no caminho até a lâmpada. O desafio pede no máximo ${d.maxPortas}.` }); return; }
    setRetorno({ ok: true, msg: `Funciona nas ${1 << inputs(c).length} linhas. Seu circuito: S = ${describe(c, saida.id)} (${nPortas} porta${nPortas === 1 ? '' : 's'}).` });
    if (!feitos.includes(d.id)) setFeitos([...feitos, d.id]);
  };

  // --- edição ---
  const ligar = (from: string, to: string, pin: number) => {
    const a = no(from), b = no(to);
    if (!a || !b || !hasOutput(a.type) || pin >= nInputs(b.type)) return;
    if (wouldCycle(c, from, to)) { setAviso('Esse fio faria o sinal voltar para a própria porta (um laço). Aqui só montamos circuitos sem realimentação.'); return; }
    setAviso('');
    h.mudar({ ...c, wires: [...c.wires.filter((w) => !(w.to === to && w.pin === pin)), { from, to, pin }] });
  };
  const pinoPerto = (p: Pt): { id: string; lado: 'entrada'; pin: number } | { id: string; lado: 'saida' } | null => {
    let melhor: ReturnType<typeof pinoPerto> = null, dist = 20;
    for (const n of c.nodes) {
      for (let k = 0; k < nInputs(n.type); k++) { const q = pinoEntrada(n, k), dd = Math.hypot(p.x - q.x, p.y - q.y); if (dd < dist) { dist = dd; melhor = { id: n.id, lado: 'entrada', pin: k }; } }
      if (hasOutput(n.type)) { const q = pinoSaida(n), dd = Math.hypot(p.x - q.x, p.y - q.y); if (dd < dist) { dist = dd; melhor = { id: n.id, lado: 'saida' }; } }
    }
    return melhor;
  };
  const tocarPino = (alvo: NonNullable<ReturnType<typeof pinoPerto>>) => {
    if (sel?.t === 'pino' && sel.lado !== alvo.lado) {
      if (sel.lado === 'saida' && alvo.lado === 'entrada') ligar(sel.id, alvo.id, alvo.pin);
      else if (sel.lado === 'entrada' && alvo.lado === 'saida') ligar(alvo.id, sel.id, sel.pin);
      setSel(null);
    } else setSel(sel?.t === 'pino' && sel.id === alvo.id && sel.lado === alvo.lado ? null : ({ t: 'pino', ...alvo } as Sel));
  };
  const pegarPino = (e: React.PointerEvent, n: CNode, lado: 'saida' | 'entrada', pin = 0) => {
    const de = lado === 'saida' ? pinoSaida(n) : pinoEntrada(n, pin);
    gesto.iniciar(e, {
      mover: (p) => setElastico({ de, ate: p }),
      soltar: (p) => {
        setElastico(null);
        const alvo = pinoPerto(p);
        if (!alvo || alvo.lado === lado) return;
        if (lado === 'saida' && alvo.lado === 'entrada') ligar(n.id, alvo.id, alvo.pin);
        if (lado === 'entrada' && alvo.lado === 'saida') ligar(alvo.id, n.id, pin);
        setSel(null);
      },
      tocar: () => tocarPino(lado === 'saida' ? { id: n.id, lado } : { id: n.id, lado, pin }),
    });
  };
  const pegarNo = (e: React.PointerEvent, n: CNode) => {
    const orig = { x: n.x, y: n.y };
    gesto.iniciar(e, {
      comecar: () => h.marcar(),
      mover: (p, ini0) => h.ajustar((st) => ({ ...st, nodes: st.nodes.map((m) => (m.id === n.id ? { ...m, x: limitar(orig.x + p.x - ini0.x, 30, W - 34), y: limitar(orig.y + p.y - ini0.y, 26, H - 40) } : m)) })),
      tocar: () => {
        if (n.type === 'IN') h.mudar({ ...c, nodes: c.nodes.map((m) => (m.id === n.id ? { ...m, on: !m.on } : m)) });
        else setSel(sel?.t === 'no' && sel.id === n.id ? null : { t: 'no', id: n.id });
      },
    });
  };
  const lugarLivre = (): Pt => {
    for (let y = 60; y < H - 50; y += 66) for (const x of [150, 230]) if (c.nodes.every((n) => Math.hypot(n.x - x, n.y - y) > 50)) return { x, y };
    return { x: 190, y: 200 };
  };
  const addPorta = (t: GateType) => { const p = lugarLivre(); const id = newId('g'); h.mudar({ ...c, nodes: [...c.nodes, { id, type: t, ...p }] }); setSel({ t: 'no', id }); };
  const addChave = () => {
    const usados = inputs(c).map((n) => n.name);
    const nome = ['A', 'B', 'C', 'D'].find((x) => !usados.includes(x));
    if (!nome) return;
    h.mudar({ ...c, nodes: [...c.nodes, { id: newId('i'), type: 'IN', name: nome, x: 34, y: limitar(50 + usados.length * 80, 30, H - 50), on: false }] });
  };
  const remover = () => {
    if (sel?.t === 'fio') h.mudar({ ...c, wires: c.wires.filter((_, i) => i !== sel.i) });
    if (sel?.t === 'no') h.mudar({ nodes: c.nodes.filter((n) => n.id !== sel.id), wires: c.wires.filter((w) => w.from !== sel.id && w.to !== sel.id) });
    setSel(null);
  };
  const noSel = sel?.t === 'no' ? no(sel.id) : undefined;
  const podeRemover = sel?.t === 'fio' || (!!noSel && noSel.type !== 'OUT' && !(d && noSel.type === 'IN'));

  // --- leitura ao vivo ---
  const expr = saida ? exprOf(c, saida.id) : null;
  const tabela = saida ? tableOf(c, saida.id) : { vars: [], rows: [] };
  const atual = inputs(c).map((n) => (n.on ? 1 : 0)).join('');
  const comp = alvoTxt.trim() ? tryParse(alvoTxt) : null;
  const eq = comp?.ast && expr ? equivalent(expr, comp.ast) : null;
  const permit = d?.permitidas ?? GATES;
  const cenarios = modo === 'livre' ? Object.entries(PRESETS_BANCADA).map(([, p]) => ({ rotulo: p.rotulo, acao: () => { h.mudar(p.c()); setSel(null); } })) : undefined;

  return (
    <Moldura titulo="Bancada de circuitos" modo={modo} onModo={setModo} h={h} cenarios={cenarios}>
      {d && (
        <div className="desafio">
          <div className="entre"><span className="rotulo">Desafio {iD + 1} de {lista.length}</span>{feitos.includes(d.id) && <span className="pilula ok">feito</span>}</div>
          <p>{d.texto}</p>
          {verDica && <div className="dica">{d.dica}</div>}
          {retorno && <div className={'fb ' + (retorno.ok ? 'ok' : 'bad')} aria-live="polite">{retorno.msg}</div>}
          <div className="linha">
            <button className="btn sm pri" onClick={conferir}>Conferir</button>
            <button className="btn sm" onClick={() => setVerDica(true)}>Dica</button>
            <button className="btn sm" disabled={iD === 0} onClick={() => setID(iD - 1)}>← anterior</button>
            <button className="btn sm" disabled={iD >= lista.length - 1} onClick={() => setID(iD + 1)}>próximo →</button>
          </div>
        </div>
      )}

      <div className="cenarios" role="group" aria-label="Adicionar peças">
        {!d && <button className="btn sm" onClick={addChave} disabled={inputs(c).length >= 4}>+ chave</button>}
        {GATES.filter((g) => permit.includes(g)).map((g) => <button key={g} className="btn sm" onClick={() => addPorta(g)} disabled={gates(c).length >= 10}>+ {g}</button>)}
      </div>

      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="palco" role="img" aria-label="Bancada de circuitos" onPointerDown={(e) => gesto.iniciar(e, { tocar: () => setSel(null) })}>
        {c.wires.map((w, i) => {
          const a = no(w.from), b = no(w.to);
          if (!a || !b) return null;
          const v = sinal(w.from), pa = caminho(pinoSaida(a), pinoEntrada(b, w.pin)), escolhido = sel?.t === 'fio' && sel.i === i;
          return (
            <g key={i} onPointerDown={(e) => gesto.iniciar(e, { tocar: () => setSel(escolhido ? null : { t: 'fio', i }) })} style={{ cursor: 'pointer' }}>
              <path d={pa} fill="none" stroke="transparent" strokeWidth={18} />
              <path d={pa} fill="none" stroke={escolhido ? 'var(--bad)' : v ? 'var(--on)' : 'var(--fio)'} strokeWidth={v ? 4.5 : 3} strokeDasharray={v === null ? '5 5' : undefined} strokeLinecap="round" />
            </g>
          );
        })}
        {elastico && <path d={caminho(elastico.de, elastico.ate)} fill="none" stroke="var(--accent)" strokeWidth={3} strokeDasharray="6 5" />}

        {c.nodes.map((n) => {
          const v = sinal(n.id), escolhido = sel?.t === 'no' && sel.id === n.id;
          return (
            <g key={n.id}>
              <g className="pega" transform={`translate(${n.x} ${n.y})`} onPointerDown={(e) => pegarNo(e, n)}>
                <rect x={-30} y={-24} width={60} height={60} fill="transparent" />
                {escolhido && <rect x={-30} y={-24} width={62} height={62} rx={10} fill="none" stroke="var(--gold)" strokeWidth={2.5} strokeDasharray="5 4" />}
                {n.type === 'IN' && (
                  <>
                    <rect x={-22} y={-15} width={44} height={30} rx={15} fill={n.on ? 'var(--on)' : 'var(--fio)'} />
                    <circle cx={n.on ? 9 : -9} cy={0} r={11} fill="var(--paper)" />
                    <text y={-21} textAnchor="middle" fontSize={13} fontWeight={800}>{n.name} = {n.on ? 1 : 0}</text>
                  </>
                )}
                {n.type === 'OUT' && (
                  <>
                    <circle r={17} fill={v ? 'var(--on)' : 'var(--paper)'} stroke={v ? 'var(--on)' : 'var(--ink)'} strokeWidth={2.5} />
                    {v && <circle r={24} fill="none" stroke="var(--on)" strokeOpacity={0.35} strokeWidth={6} />}
                    <text y={5} textAnchor="middle" fontSize={13} fontWeight={800}>{v === null ? '?' : v ? 1 : 0}</text>
                    <text y={34} textAnchor="middle" fontSize={11} fontWeight={700}>{n.name}</text>
                  </>
                )}
                {n.type !== 'IN' && n.type !== 'OUT' && (
                  <>
                    <path d={nInputs(n.type) === 1 ? 'M-28,0 H-16' : 'M-28,-12 H-13 M-28,12 H-13'} stroke="var(--ink)" strokeWidth={2} />
                    <path d="M18,0 H30" stroke="var(--ink)" strokeWidth={2} />
                    <Porta tipo={n.type as GateType} ativa={v} />
                  </>
                )}
              </g>
              {Array.from({ length: nInputs(n.type) }, (_, k) => {
                const p = pinoEntrada(n, k), ligado = c.wires.some((w) => w.to === n.id && w.pin === k), marcado = sel?.t === 'pino' && sel.id === n.id && sel.lado === 'entrada' && sel.pin === k;
                return (
                  <g key={k} className="pega" onPointerDown={(e) => pegarPino(e, n, 'entrada', k)}>
                    <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
                    <circle cx={p.x} cy={p.y} r={6.5} fill={marcado ? 'var(--accent)' : ligado ? 'var(--ink-2)' : 'var(--paper)'} stroke={ligado ? 'var(--ink-2)' : 'var(--bad)'} strokeWidth={2} className={marcado ? 'pulsa' : ''} />
                  </g>
                );
              })}
              {hasOutput(n.type) && (() => {
                const p = pinoSaida(n), marcado = sel?.t === 'pino' && sel.id === n.id && sel.lado === 'saida';
                return (
                  <g className="pega" onPointerDown={(e) => pegarPino(e, n, 'saida')}>
                    <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
                    <circle cx={p.x} cy={p.y} r={6.5} fill={marcado ? 'var(--accent)' : v ? 'var(--on)' : 'var(--paper)'} stroke="var(--ink)" strokeWidth={2} className={marcado ? 'pulsa' : ''} />
                  </g>
                );
              })()}
            </g>
          );
        })}
      </svg>

      <div className="linha">
        <button className="btn sm" disabled={!podeRemover} onClick={remover}>Remover {sel?.t === 'fio' ? 'fio' : sel?.t === 'no' ? 'peça' : 'selecionado'}</button>
        <span className="mini">
          {sel?.t === 'pino' ? 'Agora toque no outro pino para ligar o fio.' : 'Toque numa bolinha e depois em outra para ligar. Toque na chave para acionar. Arraste para mover.'}
        </span>
      </div>
      {aviso && <div className="aviso">{aviso}</div>}

      <div className="vivo" aria-live="polite">
        <div className="f"><span className="rotulo">O que o seu circuito calcula</span></div>
        <div className="f"><b>S = {saida ? describe(c, saida.id) : '—'}</b></div>
        {expr && <div className="f mini">em lógica: {show(expr, 'logica')} · {gates(c).length} porta(s) na bancada</div>}
        {!expr && <span className="mini">Bolinha vermelha = entrada sem fio. Fio tracejado = sinal indefinido.</span>}
      </div>

      {expr && tabela.vars.length > 0 && (
        <div className="rolagem">
          <table className="tv">
            <thead><tr>{tabela.vars.map((v) => <th key={v}>{v}</th>)}<th>S</th>{comp?.ast && <th>alvo</th>}</tr></thead>
            <tbody>
              {tabela.rows.map((r, i) => {
                const chaveL = tabela.vars.map((v) => (r.env[v] ? 1 : 0)).join('');
                const alvoV = comp?.ast ? evalAlvoAst(comp.ast, r.env) : null;
                return (
                  <tr key={i} className={chaveL === atual ? 'atual' : ''} style={{ cursor: 'pointer' }} onClick={() => h.mudar({ ...c, nodes: c.nodes.map((n) => (n.type === 'IN' ? { ...n, on: !!r.env[n.name ?? n.id] } : n)) })}>
                    {tabela.vars.map((v) => <td key={v} className="var">{r.env[v] ? 1 : 0}</td>)}
                    <td className={r.value ? 'v1' : 'v0'}><b>{r.value ? 1 : 0}</b></td>
                    {alvoV !== null && <td className={(alvoV ? 'v1' : 'v0') + (alvoV !== r.value ? ' x' : '')}><b>{alvoV ? 1 : 0}</b></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modo === 'livre' && (
        <div className="pilha" style={{ gap: 6 }}>
          <label className="rotulo" htmlFor={uid + 'a'}>É equivalente a…? (digite uma expressão)</label>
          <input id={uid + 'a'} className="campo mono" value={alvoTxt} onChange={(e) => setAlvoTxt(e.target.value)} placeholder="ex.: A·B + A'·C" autoCapitalize="characters" autoCorrect="off" spellCheck={false} />
          {comp?.error && <span className="mini" style={{ color: 'var(--bad)' }}>{comp.error}</span>}
          {eq && <span className={'pilula ' + (eq.equal ? 'ok' : 'ouro')}>{eq.equal ? 'equivalente: mesma saída em todas as linhas ✓' : `não é equivalente: difere em ${eq.diff.length} linha(s), marcadas na tabela`}</span>}
        </div>
      )}
    </Moldura>
  );
}

const evalAlvoAst = (a: Ast, env: Env) => evalAst(a, env);
const evalAlvo = (txt: string, env: Env) => evalAst(parse(txt), env);
