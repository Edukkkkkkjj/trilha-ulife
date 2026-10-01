// PAINEL DE INTERRUPTORES: chaves, expressão, linha da tabela-verdade e lâmpada reagem juntas.
import { useEffect, useId, useMemo, useState } from 'react';
import { Moldura, useHistorico, useModo, usePrevisao } from '../Sandbox';
import { type Ast, type Env, classify, envs, equivalent, evalAst, show, subexprs, tryParse, vars } from '../../lib/logic';
import type { ToyProps } from './tipos';

export type EstadoInt = { expr: string; comparar: string; vals: Record<string, boolean> };
const INICIAL: EstadoInt = { expr: 'p ∨ (q ∧ r)', comparar: '', vals: {} };
const valido = (x: unknown) => !!x && typeof (x as EstadoInt).expr === 'string' && typeof (x as EstadoInt).vals === 'object';

export const PRESETS_INT: Record<string, { rotulo: string; expr: string; comparar?: string }> = {
  aegis: { rotulo: 'Aegis-Grid (U8)', expr: 'p ∨ (q ∧ r)' },
  projeto: { rotulo: 'Projeto (U2)', expr: '(B ∧ C ∧ R) ∨ E' },
  cond: { rotulo: 'Condicional', expr: 'p → q', comparar: '¬p ∨ q' },
  demorgan: { rotulo: 'De Morgan', expr: '¬(p ∧ q)', comparar: '¬p ∨ ¬q' },
  alarme: { rotulo: 'Alarme (U2)', expr: "(A·B) + M" },
  erroU3: { rotulo: 'Erro da U3', expr: "(A+B)·(A'+C)", comparar: "A·B + A'·C" },
};

type Ctx = { ast?: Ast; ast2?: Ast; env: Env; vs: string[]; visitadas: Set<string>; s: EstadoInt };
type Desafio = {
  id: string; texto: string; expr: string; comparar?: string; travaExpr?: boolean; editaComparar?: boolean;
  prever?: { pergunta: string; opcoes: string[]; real: number; porque: string };
  falta: (c: Ctx) => string | null; // null = resolvido; texto = o que ainda falta
};
const ligadas = (c: Ctx) => c.vs.filter((v) => c.env[v]).length;
const todas = (c: Ctx) => (c.visitadas.size >= 1 << c.vs.length ? null : `Você passou por ${c.visitadas.size} de ${1 << c.vs.length} linhas. Toque nas linhas da tabela (ou mexa nas chaves) até passar por todas.`);

export const DESAFIOS_INT: Desafio[] = [
  { id: 'i-cond', texto: 'A condicional p → q é a que mais cai. Ache a ÚNICA combinação de chaves que apaga a lâmpada.', expr: 'p → q', travaExpr: true,
    falta: (c) => (c.ast && !evalAst(c.ast, c.env) ? null : 'A lâmpada ainda está acesa. Pense numa promessa: "se p, então q". Quando a promessa é quebrada?') },
  { id: 'i-atalho', texto: 'Regra do projeto (U2): A = (B ∧ C ∧ R) ∨ E. Acenda a lâmpada com UMA chave só ligada.', expr: '(B ∧ C ∧ R) ∨ E', travaExpr: true,
    falta: (c) => (c.ast && evalAst(c.ast, c.env) && ligadas(c) === 1 ? null : ligadas(c) !== 1 ? 'Precisa ser exatamente uma chave ligada.' : 'Com essa chave sozinha não acende. Qual delas funciona como atalho?') },
  { id: 'i-aegis', texto: 'Aegis-Grid: p = servidor falha, q = rota 1 falha, r = rota 2 falha. Faça o sistema falhar (lâmpada acesa) com o servidor funcionando (p desligado).', expr: 'p ∨ (q ∧ r)', travaExpr: true,
    falta: (c) => (c.env.p ? 'O servidor (p) precisa ficar desligado.' : c.ast && evalAst(c.ast, c.env) ? null : 'Sem o servidor falhar, o que mais derruba o sistema?') },
  { id: 'i-aegis5', texto: 'Ainda no Aegis-Grid: passe pelas 8 linhas e conte em quantas o sistema falha.', expr: 'p ∨ (q ∧ r)', travaExpr: true,
    prever: { pergunta: 'Em quantas das 8 combinações a lâmpada acende?', opcoes: ['3', '4', '5', '6'], real: 2, porque: 'As 4 linhas com p = 1, mais a linha p = 0, q = 1, r = 1. O texto de resposta do curso diz "quatro", mas a tabela dele mesmo mostra cinco.' },
    falta: todas },
  { id: 'i-mp', texto: 'Modus ponens: [p ∧ (p → q)] → q. Teste todas as linhas.', expr: '(p ∧ (p → q)) → q', travaExpr: true,
    prever: { pergunta: 'Existe alguma combinação que apaga a lâmpada?', opcoes: ['Sim', 'Não'], real: 1, porque: 'Acende nas 4 linhas: é uma tautologia. Por isso o modus ponens é um argumento válido.' },
    falta: todas },
  { id: 'i-dm', texto: 'Negar um "E" NÃO dá outro "E". Deixe as chaves numa linha em que ¬(p ∧ q) e ¬p ∧ ¬q dão resultados diferentes.', expr: '¬(p ∧ q)', comparar: '¬p ∧ ¬q', travaExpr: true,
    falta: (c) => (c.ast && c.ast2 && evalAst(c.ast, c.env) !== evalAst(c.ast2, c.env) ? null : 'Nesta linha as duas dão o mesmo resultado. Tente ligar só uma das chaves.') },
  { id: 'i-dm2', texto: 'Agora conserte: escreva no segundo campo uma expressão equivalente a ¬(p ∨ q) em que a negação não fica por fora do parêntese.', expr: '¬(p ∨ q)', comparar: '', travaExpr: true, editaComparar: true,
    falta: (c) => (!c.ast2 ? 'Escreva a segunda expressão.' : c.ast2.k === 'not' && c.ast2.a.k === 'bin' ? 'A negação ainda está por fora do parêntese.' : c.ast && equivalent(c.ast, c.ast2).equal ? null : 'Ainda não é equivalente. De Morgan: negue cada parte E troque o conectivo.') },
  { id: 'i-xor', texto: 'Digite uma expressão com p e q que acenda só quando EXATAMENTE uma das chaves está ligada. Sem usar ⊕.', expr: '',
    falta: (c) => {
      if (!c.ast) return 'Digite a expressão no campo.';
      const temXor = (a: Ast): boolean => (a.k === 'bin' ? a.op === 'xor' || a.op === 'xnor' || temXor(a.a) || temXor(a.b) : a.k === 'not' ? temXor(a.a) : false);
      if (temXor(c.ast)) return 'Sem ⊕: monte com ¬, ∧ e ∨.';
      const alvo = tryParse('(p ∧ ¬q) ∨ (¬p ∧ q)').ast!;
      return equivalent(c.ast, alvo).equal ? null : 'Ainda não. Dois casos acendem: p ligado e q desligado, OU p desligado e q ligado.';
    } },
];

const TECLAS = ['¬', '∧', '∨', '→', '↔', '⊕', '(', ')', "'", '·', '+'];
const chaveLinha = (vs: string[], env: Env) => vs.map((v) => (env[v] ? 1 : 0)).join('');

export function Interruptores({ modoInicial = 'livre', desafios, preset, chave, onProgresso }: ToyProps) {
  const uid = useId();
  const ini = useMemo<EstadoInt>(() => (preset && PRESETS_INT[preset] ? { expr: PRESETS_INT[preset].expr, comparar: PRESETS_INT[preset].comparar ?? '', vals: {} } : INICIAL), [preset]);
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoInt>(ini, chave, valido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const prev = usePrevisao(false);
  const s = h.estado;
  const [vf, setVf] = useState(true);       // mostrar V/F ou 1/0
  const [inter, setInter] = useState(false); // colunas intermediárias
  const [alvoTecla, setAlvoTecla] = useState<'expr' | 'comparar'>('expr');

  const p1 = useMemo(() => (s.expr.trim() ? tryParse(s.expr) : {}), [s.expr]);
  const p2 = useMemo(() => (s.comparar.trim() ? tryParse(s.comparar) : {}), [s.comparar]);
  const vs = useMemo(() => [...new Set([...(p1.ast ? vars(p1.ast) : []), ...(p2.ast ? vars(p2.ast) : [])])].sort((a, b) => a.localeCompare(b)).slice(0, 5), [p1.ast, p2.ast]);
  const env: Env = Object.fromEntries(vs.map((v) => [v, !!s.vals[v]]));
  const valor = p1.ast ? evalAst(p1.ast, env) : false;
  const linhas = useMemo(() => envs(vs), [vs]);
  const subs = useMemo(() => (p1.ast ? subexprs(p1.ast) : []), [p1.ast]);
  const B = (b: boolean) => (vf ? (b ? 'V' : 'F') : b ? '1' : '0');

  // --- desafios ---
  const lista = useMemo(() => DESAFIOS_INT.filter((d) => !desafios || desafios.includes(d.id)), [desafios]);
  const [iD, setID] = useState(0);
  const [feitos, setFeitos] = useState<string[]>([]);
  const [visitadas, setVisitadas] = useState<Set<string>>(new Set());
  const [palpite, setPalpite] = useState<number | null>(null);
  const [retorno, setRetorno] = useState<null | { ok: boolean; msg: string }>(null);
  const d = modo === 'desafio' ? lista[iD] : undefined;
  useEffect(() => { onProgresso?.(feitos.length, lista.length); }, [feitos.length, lista.length]); // eslint-disable-line
  useEffect(() => {
    setRetorno(null); setPalpite(null); setVisitadas(new Set());
    if (d) h.mudar({ expr: d.expr, comparar: d.comparar ?? '', vals: {} });
  }, [d?.id]); // eslint-disable-line
  useEffect(() => { if (vs.length) setVisitadas((v) => new Set(v).add(chaveLinha(vs, env))); }, [chaveLinha(vs, env)]); // eslint-disable-line

  const conferir = () => {
    if (!d) return;
    if (d.prever && palpite === null) { setRetorno({ ok: false, msg: 'Primeiro dê o seu palpite. Errar o palpite não tira ponto: é ele que faz a ideia grudar.' }); return; }
    const f = d.falta({ ast: p1.ast, ast2: p2.ast, env, vs, visitadas, s });
    if (f) { setRetorno({ ok: false, msg: f }); return; }
    let msg = 'Resolvido.';
    if (d.prever) msg = `${palpite === d.prever.real ? 'Seu palpite bateu' : `Você apostou "${d.prever.opcoes[palpite!]}"; o certo é "${d.prever.opcoes[d.prever.real]}"`}. ${d.prever.porque}`;
    setRetorno({ ok: true, msg });
    if (!feitos.includes(d.id)) setFeitos([...feitos, d.id]);
  };

  const virar = (v: string) => {
    const novo = { ...s, vals: { ...s.vals, [v]: !s.vals[v] } };
    const depois = p1.ast ? evalAst(p1.ast, { ...env, [v]: !env[v] }) : false;
    prev.pedir({
      pergunta: `Você vai ${env[v] ? 'desligar' : 'ligar'} a chave ${v}. A lâmpada vai ficar…`, opcoes: ['acesa', 'apagada'], real: depois ? 0 : 1,
      porque: depois === valor ? 'Não mudou: nesta situação essa chave não decide o resultado.' : 'Mudou: nesta situação essa chave decide.',
      aplicar: () => h.mudar(novo),
    });
  };
  const digitar = (campo: 'expr' | 'comparar', txt: string) => h.mudar({ ...s, [campo]: txt });
  const carregar = (k: string) => { const p = PRESETS_INT[k]; h.mudar({ expr: p.expr, comparar: p.comparar ?? '', vals: {} }); };

  const eq = p1.ast && p2.ast ? equivalent(p1.ast, p2.ast) : null;
  const acesas = p1.ast ? linhas.filter((e) => evalAst(p1.ast!, e)).length : 0;
  const cenarios = modo === 'livre' ? [
    ...Object.entries(PRESETS_INT).map(([k, p]) => ({ rotulo: p.rotulo, acao: () => carregar(k) })),
    { rotulo: 'E se… eu negar tudo?', acao: () => p1.ast && digitar('expr', show({ k: 'not', a: p1.ast })) },
  ] : undefined;
  const travaExpr = !!d?.travaExpr, mostraComparar = modo === 'livre' || d?.comparar !== undefined;

  return (
    <Moldura titulo="Painel de interruptores" modo={modo} onModo={(m) => { setModo(m); prev.limpar(); }} h={h} previsao={modo === 'livre' ? prev : undefined} cenarios={cenarios}>
      {d && (
        <div className="desafio">
          <div className="entre"><span className="rotulo">Desafio {iD + 1} de {lista.length}</span>{feitos.includes(d.id) && <span className="pilula ok">feito</span>}</div>
          <p>{d.texto}</p>
          {d.prever && (
            <div className="linha"><span>{d.prever.pergunta}</span>{d.prever.opcoes.map((o, i) => <button key={i} className="btn sm" aria-pressed={palpite === i} disabled={retorno?.ok} onClick={() => setPalpite(i)}>{o}</button>)}</div>
          )}
          {retorno && <div className={'fb ' + (retorno.ok ? 'ok' : 'bad')} aria-live="polite">{retorno.msg}</div>}
          <div className="linha">
            <button className="btn sm pri" onClick={conferir}>Conferir</button>
            <button className="btn sm" disabled={iD === 0} onClick={() => setID(iD - 1)}>← anterior</button>
            <button className="btn sm" disabled={iD >= lista.length - 1} onClick={() => setID(iD + 1)}>próximo →</button>
          </div>
        </div>
      )}
      {prev.painel}

      <div className="pilha" style={{ gap: 6 }}>
        <label className="rotulo" htmlFor={uid + 'e'}>Expressão</label>
        <input id={uid + 'e'} className="campo mono" value={s.expr} readOnly={travaExpr} onFocus={() => setAlvoTecla('expr')} onChange={(e) => digitar('expr', e.target.value)} placeholder="ex.: p ∨ (q ∧ r)   ou   A·B + A'·C" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        {p1.error && <span className="mini" style={{ color: 'var(--bad)' }}>{p1.error}</span>}
        {mostraComparar && (
          <>
            <label className="rotulo" htmlFor={uid + 'c'}>Comparar com (opcional)</label>
            <input id={uid + 'c'} className="campo mono" value={s.comparar} readOnly={!!d && !d.editaComparar} onFocus={() => setAlvoTecla('comparar')} onChange={(e) => digitar('comparar', e.target.value)} placeholder="outra expressão: são equivalentes?" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            {p2.error && <span className="mini" style={{ color: 'var(--bad)' }}>{p2.error}</span>}
          </>
        )}
        {(!travaExpr || d?.editaComparar) && (
          <div className="teclas">
            {TECLAS.map((t) => <button key={t} className="tecla" onClick={() => { const c = d?.editaComparar ? 'comparar' : alvoTecla; digitar(c, s[c] + t); }}>{t}</button>)}
            <button className="tecla" aria-label="Apagar" onClick={() => { const c = d?.editaComparar ? 'comparar' : alvoTecla; digitar(c, s[c].slice(0, -1)); }}>⌫</button>
          </div>
        )}
      </div>

      {p1.ast && (
        <>
          <div className="vivo">
            <div className="f"><span className="rotulo">Lógica</span> {show(p1.ast, 'logica')}</div>
            <div className="f"><span className="rotulo">Booleana</span> {show(p1.ast, 'bool')}</div>
          </div>

          <div className="entre">
            <div className="linha" role="group" aria-label="Chaves">
              {vs.map((v) => (
                <button key={v} className="chave" aria-pressed={env[v]} onClick={() => virar(v)} aria-label={`Chave ${v}: ${env[v] ? 'ligada' : 'desligada'}`}>
                  <span className="trilho" /><span className="nome">{v} = {B(env[v])}</span>
                </button>
              ))}
            </div>
            <div className={'lampada' + (valor ? ' acesa' : '')} aria-live="polite">
              <div className="bulbo" /><div><div className="rotulo">Saída</div><b className="mono" style={{ fontSize: '1.3rem' }}>{B(valor)}</b></div>
            </div>
          </div>

          <div className="vivo" aria-live="polite">
            <span className="rotulo">Como o valor é calculado nesta linha</span>
            {subs.map((x, i) => <div key={i} className="f">{show(x, 'logica')} = <b className={evalAst(x, env) ? 'cC' : ''}>{B(evalAst(x, env))}</b></div>)}
            {!subs.length && <div className="f">{show(p1.ast)} = <b>{B(valor)}</b></div>}
          </div>

          <div className="linha">
            <span className={'pilula ' + (classify(p1.ast) === 'contingência' ? '' : 'acc')}>{classify(p1.ast)}</span>
            <span className="mini">acende em {acesas} de {linhas.length} linhas (2<sup>{vs.length}</sup> = {linhas.length})</span>
            {eq && <span className={'pilula ' + (eq.equal ? 'ok' : 'ouro')}>{eq.equal ? 'equivalentes ✓' : `diferem em ${eq.diff.length} linha(s)`}</span>}
          </div>

          <div className="linha">
            <div className="seg"><button aria-pressed={vf} onClick={() => setVf(true)}>V / F</button><button aria-pressed={!vf} onClick={() => setVf(false)}>1 / 0</button></div>
            <button className="btn sm" aria-pressed={inter} onClick={() => setInter(!inter)}>Colunas intermediárias</button>
          </div>
          <div className="rolagem">
            <table className="tv">
              <thead><tr>
                {vs.map((v) => <th key={v}>{v}</th>)}
                {(inter ? subs : subs.slice(-1)).map((x, i) => <th key={i}>{show(x, 'logica')}</th>)}
                {!subs.length && <th>{show(p1.ast)}</th>}
                {p2.ast && <th>{show(p2.ast, 'logica')}</th>}
              </tr></thead>
              <tbody>
                {linhas.map((e, i) => {
                  const atual = chaveLinha(vs, e) === chaveLinha(vs, env);
                  const dif = p2.ast && evalAst(p1.ast!, e) !== evalAst(p2.ast, e);
                  return (
                    <tr key={i} className={atual ? 'atual' : ''} onClick={() => h.mudar({ ...s, vals: { ...s.vals, ...e } })} style={{ cursor: 'pointer' }}>
                      {vs.map((v) => <td key={v} className="var">{B(e[v])}</td>)}
                      {(inter ? subs : subs.slice(-1)).map((x, k) => <td key={k} className={evalAst(x, e) ? 'v1' : 'v0'}><b>{B(evalAst(x, e))}</b></td>)}
                      {!subs.length && <td className={evalAst(p1.ast!, e) ? 'v1' : 'v0'}><b>{B(evalAst(p1.ast!, e))}</b></td>}
                      {p2.ast && <td className={(evalAst(p2.ast, e) ? 'v1' : 'v0') + (dif ? ' x' : '')}><b>{B(evalAst(p2.ast, e))}</b></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <span className="mini">Toque numa linha da tabela para pôr as chaves naquela combinação.{d ? ` Linhas visitadas: ${visitadas.size} de ${linhas.length}.` : ''}</span>
        </>
      )}
    </Moldura>
  );
}
