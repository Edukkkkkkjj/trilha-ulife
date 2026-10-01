// ÁRVORE DE CONTAGEM: cada decisão abre galhos; cada folha é um resultado.
// Três modos: etapas (princípio multiplicativo), escolher p de n (arranjo × combinação) e anagramas (letras repetidas).
// Desenho, fórmula e número mudam juntos. Folhas da mesma cor são o MESMO resultado contado mais de uma vez.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Moldura, pontoSvg, useHistorico, useModo, usePrevisao } from '../Sandbox';
import { MAX_FOLHAS, anagramas, arranjo, fat, frequencias, grupos, montar, numFolhas, totalPelaFormula, type EstadoArvore, type No } from '../../lib/contagem';
import type { ToyProps } from './tipos';

const W = 360, H = 300, TOPO = 26, BASE = H - 34;
const INICIAL: EstadoArvore = { tipo: 'etapas', etapas: [{ nome: 'camiseta', n: 3 }, { nome: 'calça', n: 2 }] };
const valido = (x: unknown) => !!x && ['etapas', 'escolha', 'palavra'].includes((x as EstadoArvore).tipo) && numFolhas(x as EstadoArvore) <= MAX_FOLHAS;
const limpaPalavra = (t: string) => [...t.toUpperCase().replace(/[^A-ZÇÃÕÁÉÍÓÚÂÊÔ]/g, '')].slice(0, 4).join('');

const CENARIOS: { rotulo: string; s: EstadoArvore; nota: string }[] = [
  { rotulo: 'Roupas: 3 camisetas e 2 calças', s: INICIAL, nota: 'Para cada camiseta há todas as calças: 3 × 2 = 6. É o princípio multiplicativo.' },
  { rotulo: 'Campanha: 5 produtos, 4 canais, 3 ofertas', s: { tipo: 'etapas', etapas: [{ nome: 'produto', n: 5 }, { nome: 'canal', n: 4 }, { nome: 'oferta', n: 3 }] }, nota: 'É o problema que abre a U4: 5 × 4 × 3 = 60 estratégias. Já não dá para listar de cabeça.' },
  { rotulo: 'Pódio: 3 lugares entre 5 atletas', s: { tipo: 'escolha', n: 5, p: 3, repete: false, ordem: true }, nota: 'A cada lugar preenchido sobra um atleta a menos: 5 × 4 × 3 = 60. Isso é um arranjo.' },
  { rotulo: 'E se… a ordem não importar?', s: { tipo: 'escolha', n: 5, p: 3, repete: false, ordem: false }, nota: 'As 60 folhas continuam lá, mas se juntam em grupos de 6 (as 3! ordens do mesmo trio). 60 ÷ 6 = 10 combinações.' },
  { rotulo: 'E se… puder repetir? (senha)', s: { tipo: 'escolha', n: 4, p: 3, repete: true, ordem: true }, nota: 'Com repetição, toda etapa tem as mesmas 4 opções: 4 × 4 × 4 = 64.' },
  { rotulo: 'E se… p = n? (usar todos)', s: { tipo: 'escolha', n: 4, p: 4, repete: false, ordem: true }, nota: 'Ordenar todos os elementos é uma permutação: 4 × 3 × 2 × 1 = 4! = 24.' },
  { rotulo: 'Anagramas de ANA (letra repetida)', s: { tipo: 'palavra', palavra: 'ANA' }, nota: 'A árvore tem 3! = 6 folhas, mas trocar um A pelo outro não muda a palavra. Cada palavra aparece 2! vezes: 6 ÷ 2 = 3.' },
];

type Desafio = { id: string; texto: string; ini: EstadoArvore; falta: (s: EstadoArvore, total: number) => string | null; prever?: string; depois?: string };
const esc = (n: number, p: number, repete = false, ordem = true): EstadoArvore => ({ tipo: 'escolha', n, p, repete, ordem });
export const DESAFIOS_ARVORE: Desafio[] = [
  { id: 'a-doze', texto: 'Monte uma árvore de 3 etapas com exatamente 12 resultados.', ini: { tipo: 'etapas', etapas: [{ nome: 'etapa 1', n: 1 }, { nome: 'etapa 2', n: 1 }, { nome: 'etapa 3', n: 1 }] },
    falta: (s, t) => (s.tipo !== 'etapas' || s.etapas.length !== 3 ? 'Precisam ser exatamente 3 etapas.' : t === 12 ? null : `Está dando ${t}. O total é o PRODUTO das opções das etapas: procure três números que multiplicados dão 12.`), depois: 'Há mais de um jeito (2 × 2 × 3, 1 × 3 × 4, 1 × 2 × 6…). A ordem das etapas não muda o total.' },
  { id: 'a-campanha', texto: 'O problema da U4: 5 produtos, 4 canais de marketing e 3 tipos de oferta. Ajuste as etapas para representar todas as campanhas possíveis.', prever: 'Antes de mexer: quantas campanhas diferentes existem?', ini: { tipo: 'etapas', etapas: [{ nome: 'produto', n: 1 }, { nome: 'canal', n: 1 }, { nome: 'oferta', n: 1 }] },
    falta: (s) => (s.tipo === 'etapas' && s.etapas.map((e) => e.n).join() === '5,4,3' ? null : 'Ainda não: produto precisa de 5 opções, canal de 4 e oferta de 3.'), depois: '5 × 4 × 3 = 60. O curso chama isso de "mapa de possibilidades": nenhuma estratégia fica esquecida.' },
  { id: 'a-podio', texto: 'Ouro, prata e bronze entre 5 atletas. Ajuste n e p para representar os pódios possíveis.', prever: 'Antes de mexer: quantos pódios diferentes?', ini: esc(3, 2),
    falta: (s) => (s.tipo !== 'escolha' ? 'Use o modo "Escolher p de n".' : s.repete ? 'Um atleta não pode ganhar duas medalhas: desligue "pode repetir".' : !s.ordem ? 'Ouro para Ana e prata para Bia é diferente do contrário: aqui a ordem importa.' : s.n === 5 && s.p === 3 ? null : 'São 5 atletas (n) para 3 lugares (p).'), depois: 'Arranjo: A(5, 3) = 5 × 4 × 3 = 60. Repare nos galhos: 5 opções, depois 4, depois 3.' },
  { id: 'a-comissao', texto: 'Mesmos 5 atletas, mas agora é só escolher 3 para uma comissão, sem cargos. Mude UMA coisa na árvore.', prever: 'Antes de mexer: quantas comissões diferentes?', ini: esc(5, 3),
    falta: (s) => (s.tipo === 'escolha' && s.n === 5 && s.p === 3 && !s.repete && !s.ordem ? null : 'Os números não mudam (5 e 3). O que muda é se a ordem importa.'), depois: 'Combinação: C(5, 3) = 60 ÷ 3! = 10. Toque numa folha para ver as 6 ordens que viram o mesmo grupo.' },
  { id: 'a-espelho', texto: 'Escolher 2 entre 5 sem ordem dá 10 grupos. Ache OUTRO valor de p (com n = 5, sem ordem) que também dá 10.', ini: esc(5, 2, false, false),
    falta: (s, t) => (s.tipo !== 'escolha' || s.n !== 5 || s.ordem || s.repete ? 'Mantenha n = 5, sem ordem e sem repetição.' : s.p === 2 ? 'Esse é o que eu dei. Procure outro p.' : t === 10 ? null : `Com p = ${s.p} dá ${t}.`), depois: 'C(5, 2) = C(5, 3): escolher 2 para ir é o mesmo que escolher 3 para ficar. É a Questão 05 da U4.' },
  { id: 'a-ana', texto: 'A palavra OVO tem 3 letras. Digite OVO no modo "Anagramas" e descubra quantas palavras diferentes saem.', prever: 'Antes de mexer: quantos anagramas distintos tem OVO?', ini: { tipo: 'palavra', palavra: 'SOL' },
    falta: (s) => (s.tipo === 'palavra' && s.palavra === 'OVO' ? null : 'Digite OVO no campo da palavra.'), depois: '3! = 6 folhas, mas os dois O são iguais: 6 ÷ 2! = 3 (OVO, OOV, VOO). É a fórmula n!/(p1!·p2!…).' },
];

/** Cor estável para o k-ésimo grupo. */
const cor = (k: number) => `hsl(${(k * 137.5) % 360} 65% 55%)`;

export function ArvoreContagem({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoArvore>(INICIAL, chave, valido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const prev = usePrevisao(false);
  const s = h.estado;
  const [sel, setSel] = useState<number | null>(null);
  const [nota, setNota] = useState('');

  const lista = useMemo(() => DESAFIOS_ARVORE.filter((d) => !desafios || desafios.includes(d.id)), [desafios]);
  const [iD, setID] = useState(0);
  const [feitos, setFeitos] = useState<string[]>([]);
  const [retorno, setRetorno] = useState<null | { ok: boolean; msg: string }>(null);
  const [palpite, setPalpite] = useState('');
  const [palpitou, setPalpitou] = useState(false);
  const d = modo === 'desafio' ? lista[iD] : undefined;
  useEffect(() => { onProgresso?.(feitos.length, lista.length); }, [feitos.length, lista.length]); // eslint-disable-line
  useEffect(() => { setRetorno(null); setSel(null); setNota(''); setPalpite(''); setPalpitou(false); if (d) h.mudar(d.ini); }, [d?.id]); // eslint-disable-line

  const { raiz, folhas, prof } = useMemo(() => montar(s), [s]);
  const gs = useMemo(() => grupos(folhas), [folhas]);
  const idxGrupo = useMemo(() => new Map(gs.map((g, k) => [g.chave, k])), [gs]);
  const total = gs.length, agrupa = total < folhas.length;

  // posições: folhas espalhadas na largura; cada nó fica no meio dos filhos
  const pos = useMemo(() => {
    const m = new Map<No, { x: number; y: number }>();
    const dy = (BASE - TOPO) / Math.max(1, prof);
    const anda = (no: No): number => {
      const x = no.folha ? (folhas.length === 1 ? W / 2 : 14 + (no.folha.i * (W - 28)) / (folhas.length - 1)) : no.filhos.map(anda).reduce((a, b) => a + b, 0) / Math.max(1, no.filhos.length);
      m.set(no, { x, y: TOPO + no.prof * dy });
      return x;
    };
    anda(raiz);
    return m;
  }, [raiz, folhas.length, prof]);

  const tenta = (novo: EstadoArvore) => {
    if (numFolhas(novo) > MAX_FOLHAS) { setNota(`Isso daria ${numFolhas(novo).toLocaleString('pt-BR')} folhas: não cabe mais no desenho. É por isso que existe a fórmula: ela conta sem listar.`); return; }
    if (numFolhas(novo) < 1) return;
    setNota(''); setSel(null);
    const real = totalPelaFormula(novo);
    if (modo === 'livre' && real !== total) {
      const erradas = [numFolhas(novo) !== real ? numFolhas(novo) : real + (novo.tipo === 'etapas' ? novo.etapas.length : 2), novo.tipo === 'etapas' ? novo.etapas.reduce((a, e) => a + e.n, 0) : Math.max(1, real - 1)].filter((x, i, a) => x !== real && a.indexOf(x) === i);
      const ops = [real, ...erradas].sort((a, b) => a - b);
      prev.pedir({ pergunta: 'Depois dessa mudança, quantos resultados diferentes vão existir?', opcoes: ops.map(String), real: ops.indexOf(real), aplicar: () => h.mudar(novo) });
    } else h.mudar(novo);
  };

  const marcarFeito = (msg: string) => { setRetorno({ ok: true, msg }); if (d && !feitos.includes(d.id)) setFeitos([...feitos, d.id]); };
  const conferir = () => {
    if (!d) return;
    const f = d.falta(s, total);
    if (f) setRetorno({ ok: false, msg: f }); else marcarFeito('Resolvido. ' + (d.depois ?? ''));
  };

  // desenho
  const linhas: React.JSX.Element[] = [], nos: React.JSX.Element[] = [];
  const folhaSel = sel !== null ? folhas[sel] : undefined;
  const porNivel = new Map<number, number>();
  const conta = (no: No) => { porNivel.set(no.prof, (porNivel.get(no.prof) ?? 0) + 1); no.filhos.forEach(conta); };
  conta(raiz);
  const desenha = (no: No, idxs: number[]) => {
    const p = pos.get(no)!;
    const noSel = !!folhaSel && idxsIguais(idxs, sel!, raiz);
    no.filhos.forEach((f, k) => {
      const q = pos.get(f)!;
      const fSel = !!folhaSel && idxsIguais([...idxs, k], sel!, raiz);
      linhas.push(<line key={[...idxs, k].join('.')} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={fSel ? 'var(--accent)' : 'var(--fio)'} strokeWidth={fSel ? 3 : 1.2} opacity={folhaSel && !fSel ? 0.35 : 1} />);
      desenha(f, [...idxs, k]);
    });
    const cabeRotulo = (porNivel.get(no.prof) ?? 0) <= 14;
    if (no.folha) {
      const g = idxGrupo.get(no.folha.chave) ?? 0, mesmo = folhaSel && folhaSel.chave === no.folha.chave;
      const r = folhas.length > 40 ? 3.6 : folhas.length > 20 ? 5 : 7;
      nos.push(<circle key={'f' + no.folha.i} cx={p.x} cy={p.y} r={mesmo ? r + 2 : r} fill={agrupa ? cor(g) : 'var(--accent)'} stroke={mesmo ? 'var(--ink)' : 'none'} strokeWidth={2} opacity={folhaSel && !mesmo ? 0.3 : 1} />);
      if (cabeRotulo && no.rot) nos.push(<text key={'tf' + no.folha.i} x={p.x} y={p.y + r + 13} textAnchor="middle" fontSize={11} fontWeight={700}>{no.rot}</text>);
    } else if (no.prof > 0) {
      nos.push(<circle key={'n' + idxs.join('.')} cx={p.x} cy={p.y} r={cabeRotulo ? 9 : 3} fill="var(--paper)" stroke={noSel ? 'var(--accent)' : 'var(--ink-2)'} strokeWidth={noSel ? 2.5 : 1.2} />);
      if (cabeRotulo) nos.push(<text key={'t' + idxs.join('.')} x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} fontWeight={700}>{no.rot}</text>);
    } else nos.push(<circle key="raiz" cx={p.x} cy={p.y} r={5} fill="var(--ink-2)" />);
  };
  desenha(raiz, []);

  const tocarPalco = (e: React.MouseEvent) => {
    if (!svg.current || !folhas.length) return;
    const p = pontoSvg(svg.current, e);
    const i = folhas.length === 1 ? 0 : Math.round(((p.x - 14) / (W - 28)) * (folhas.length - 1));
    const k = Math.max(0, Math.min(folhas.length - 1, i));
    setSel(sel === k ? null : k);
  };

  // textos ao vivo
  const nomeEtapa = (k: number) => (s.tipo === 'etapas' ? s.etapas[k].nome : s.tipo === 'escolha' ? `${k + 1}ª escolha` : `${k + 1}ª letra`);
  const galhos = s.tipo === 'etapas' ? s.etapas.map((e) => e.n) : s.tipo === 'palavra' ? Array.from({ length: prof }, (_, k) => prof - k) : Array.from({ length: s.p }, (_, k) => (s.repete ? s.n : s.n - k));
  const produto = `${galhos.join(' × ') || '1'} = ${folhas.length}`;
  let formula: string, explica: string;
  if (s.tipo === 'etapas') { formula = `N = ${produto}`; explica = 'Princípio multiplicativo: para cada opção de uma etapa, existem todas as opções da etapa seguinte.'; }
  else if (s.tipo === 'palavra') {
    const reps = Object.entries(frequencias(s.palavra)).filter(([, k]) => k > 1);
    formula = reps.length ? `${prof}! ÷ (${reps.map(([, k]) => k + '!').join(' · ')}) = ${fat(prof)} ÷ ${reps.reduce((a, [, k]) => a * fat(k), 1)} = ${anagramas(s.palavra)}` : `P(${prof}) = ${prof}! = ${produto}`;
    explica = reps.length ? `Letras repetidas (${reps.map(([l, k]) => `${l}: ${k} vezes`).join(', ')}): trocar uma pela outra não muda a palavra, então cada palavra aparece em várias folhas. Divide-se pelas trocas que não mudam nada.` : 'Todas as letras são diferentes: cada folha é uma palavra nova. Permutação simples.';
  } else if (s.ordem && !s.repete) { formula = s.p === s.n ? `P(${s.n}) = ${s.n}! = ${produto}` : `A(${s.n}, ${s.p}) = ${s.n}! ÷ (${s.n} − ${s.p})! = ${produto}`; explica = s.p === s.n ? 'Usar todos os elementos, com ordem: permutação.' : 'A ordem importa e não pode repetir: arranjo. A cada escolha sobra uma opção a menos.'; }
  else if (!s.ordem && !s.repete) { formula = `C(${s.n}, ${s.p}) = A(${s.n}, ${s.p}) ÷ ${s.p}! = ${arranjo(s.n, s.p)} ÷ ${fat(s.p)} = ${total}`; explica = `A ordem não importa: combinação. Cada grupo aparece ${fat(s.p)} vezes na árvore (as ${s.p}! ordens dele), por isso se divide por ${s.p}!.`; }
  else if (s.ordem) { formula = `${s.n}^${s.p} = ${produto}`; explica = 'Pode repetir e a ordem importa: toda etapa tem as mesmas opções (é o caso das senhas).'; }
  else { formula = `${total} grupos (contados nas folhas)`; explica = 'Sem ordem e com repetição: os grupos têm tamanhos diferentes, então não basta dividir. O curso só cita esse caso; aqui o jogo conta para você.'; }

  const cenarios = modo === 'livre' ? CENARIOS.map((c) => ({ rotulo: c.rotulo, acao: () => { h.mudar(c.s); setNota(c.nota); setSel(null); prev.limpar(); } })) : undefined;
  const Mais = ({ rot, v, set, min, max }: { rot: string; v: number; set: (n: number) => void; min: number; max: number }) => (
    <span className="linha" style={{ gap: 4 }}>
      <span className="mono">{rot} = {v}</span>
      <button className="btn sm" disabled={v <= min} onClick={() => set(v - 1)} aria-label={`Diminuir ${rot}`}>−</button>
      <button className="btn sm" disabled={v >= max} onClick={() => set(v + 1)} aria-label={`Aumentar ${rot}`}>+</button>
    </span>
  );
  const mostraGrupo = folhaSel ? gs[idxGrupo.get(folhaSel.chave)!] : undefined;
  const texto = (c: string[]) => (s.tipo === 'etapas' ? c.map((r, k) => `${s.etapas[k].nome} ${r}`).join(', ') : c.join(''));

  return (
    <Moldura titulo="Árvore de contagem" modo={modo} onModo={(m) => { setModo(m); prev.limpar(); }} h={h} previsao={modo === 'livre' ? prev : undefined} cenarios={cenarios}>
      {d && (
        <div className="desafio">
          <div className="entre"><span className="rotulo">Desafio {iD + 1} de {lista.length}</span>{feitos.includes(d.id) && <span className="pilula ok">feito</span>}</div>
          <p>{d.texto}</p>
          {d.prever && !palpitou && (
            <div className="linha">
              <span className="mini">{d.prever}</span>
              <input className="campo" style={{ width: 90 }} inputMode="numeric" value={palpite} onChange={(e) => setPalpite(e.target.value)} placeholder="palpite" aria-label="Seu palpite" />
              <button className="btn sm" disabled={!palpite.trim()} onClick={() => setPalpitou(true)}>Guardar palpite</button>
            </div>
          )}
          {d.prever && palpitou && <span className="mini">Seu palpite: {palpite}. Agora monte e veja.</span>}
          {retorno && <div className={'fb ' + (retorno.ok ? 'ok' : 'bad')} aria-live="polite">{retorno.msg}{retorno.ok && palpitou ? ` Seu palpite foi ${palpite}; deu ${total}.` : ''}</div>}
          <div className="linha">
            <button className="btn sm pri" onClick={conferir}>Conferir</button>
            <button className="btn sm" disabled={iD === 0} onClick={() => setID(iD - 1)}>← anterior</button>
            <button className="btn sm" disabled={iD >= lista.length - 1} onClick={() => setID(iD + 1)}>próximo →</button>
          </div>
        </div>
      )}
      {nota && <div className="fb neutro">{nota}</div>}
      {prev.painel}

      <div className="seg" role="group" aria-label="Tipo de contagem">
        <button aria-pressed={s.tipo === 'etapas'} onClick={() => s.tipo !== 'etapas' && tenta(INICIAL)}>Etapas</button>
        <button aria-pressed={s.tipo === 'escolha'} onClick={() => s.tipo !== 'escolha' && tenta(esc(4, 2))}>Escolher p de n</button>
        <button aria-pressed={s.tipo === 'palavra'} onClick={() => s.tipo !== 'palavra' && tenta({ tipo: 'palavra', palavra: 'SOL' })}>Anagramas</button>
      </div>

      {s.tipo === 'etapas' && (
        <div className="linha">
          {s.etapas.map((e, k) => <Mais key={k} rot={e.nome} v={e.n} min={1} max={6} set={(n) => tenta({ ...s, etapas: s.etapas.map((x, j) => (j === k ? { ...x, n } : x)) })} />)}
          <button className="btn sm" disabled={s.etapas.length >= 4} onClick={() => tenta({ ...s, etapas: [...s.etapas, { nome: `etapa ${s.etapas.length + 1}`, n: 2 }] })}>+ etapa</button>
          <button className="btn sm" disabled={s.etapas.length <= 1} onClick={() => tenta({ ...s, etapas: s.etapas.slice(0, -1) })}>− etapa</button>
        </div>
      )}
      {s.tipo === 'escolha' && (
        <div className="linha">
          <Mais rot="n" v={s.n} min={1} max={6} set={(n) => tenta({ ...s, n, p: s.repete ? s.p : Math.min(s.p, n) })} />
          <Mais rot="p" v={s.p} min={1} max={s.repete ? 4 : s.n} set={(p) => tenta({ ...s, p })} />
          <button className="btn sm" aria-pressed={s.ordem} onClick={() => tenta({ ...s, ordem: !s.ordem })}>{s.ordem ? '◉' : '○'} a ordem importa</button>
          <button className="btn sm" aria-pressed={s.repete} onClick={() => tenta({ ...s, repete: !s.repete })}>{s.repete ? '◉' : '○'} pode repetir</button>
        </div>
      )}
      {s.tipo === 'palavra' && (
        <div className="linha">
          <label className="mini" htmlFor="arv-palavra">Palavra (até 4 letras):</label>
          <input id="arv-palavra" className="campo mono" style={{ width: 110 }} value={s.palavra} maxLength={4} autoCapitalize="characters" autoCorrect="off" spellCheck={false} onChange={(e) => { const p = limpaPalavra(e.target.value); if (p) { setSel(null); h.mudar({ tipo: 'palavra', palavra: p }); } }} />
          {['SOL', 'OVO', 'CASA', 'ARAR'].map((p) => <button key={p} className="btn sm" onClick={() => tenta({ tipo: 'palavra', palavra: p })}>{p}</button>)}
        </div>
      )}

      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="palco" role="img" aria-label={`Árvore com ${folhas.length} folhas e ${total} resultados diferentes`} onClick={tocarPalco} style={{ cursor: 'pointer' }}>
        {Array.from({ length: prof }, (_, k) => <text key={k} x={6} y={TOPO + ((k + 0.5) * (BASE - TOPO)) / prof} fontSize={10} opacity={0.75}>{nomeEtapa(k)} ({galhos[k]})</text>)}
        {linhas}{nos}
      </svg>
      <span className="mini">Toque perto de uma folha para ver o caminho até ela.{agrupa ? ' Folhas da mesma cor são o mesmo resultado.' : ''}</span>

      <div className="vivo" aria-live="polite">
        <div className="f" style={{ whiteSpace: 'normal' }}><b>{total}</b> {total === 1 ? 'resultado diferente' : 'resultados diferentes'}{agrupa && <span className="mini"> (em {folhas.length} folhas)</span>}</div>
        <div className="f mono">{formula}</div>
        <span className="mini">{explica}</span>
        {folhaSel && mostraGrupo && (
          <div className="f" style={{ whiteSpace: 'normal' }}>Folha escolhida: <b>{texto(folhaSel.caminho)}</b>{mostraGrupo.folhas.length > 1 && <span className="mini"> · mesmo resultado que: {mostraGrupo.folhas.filter((f) => f.i !== folhaSel.i).slice(0, 8).map((f) => texto(f.caminho)).join(', ')}{mostraGrupo.folhas.length > 9 ? '…' : ''}</span>}</div>
        )}
        {s.tipo !== 'etapas' && <div className="mini">Resultados: {gs.slice(0, 24).map((g) => (s.tipo === 'escolha' && !s.ordem ? `{${g.folhas[0].caminho.slice().sort().join(',')}}` : g.folhas[0].caminho.join(''))).join(' ')}{gs.length > 24 ? ` … e mais ${gs.length - 24}` : ''}</div>}
      </div>
    </Moldura>
  );
}

// O caminho até a folha selecionada: compara índices de filho a filho.
function idxsIguais(idxs: number[], folha: number, raiz: No): boolean {
  let no = raiz;
  for (const k of idxs) { no = no.filhos[k]; if (!no) return false; }
  return contem(no, folha);
}
function contem(no: No, folha: number): boolean { return no.folha ? no.folha.i === folha : no.filhos.some((f) => contem(f, folha)); }
