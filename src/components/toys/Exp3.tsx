// Brinquedos da camada C4 de Exploração Digital:
//  - FeedAlgoritmo: o mesmo conjunto de posts em três ordens (tempo, engajamento, personalizado).
//  - EscalaNegocio: custo por cliente de um negócio físico × um digital, conforme os clientes crescem.
//  - LabVies: uma nota de corte, dois grupos, e duas ideias de "justo" que não cabem juntas.
//  - ChecklistLgpd: um cadastro para montar, avaliado pelos seis princípios da LGPD citados na U8.
// Os números de todos eles são inventados para ilustrar; não vêm do material.
import { useEffect, useState } from 'react';
import { Moldura, useHistorico, useModo } from '../Sandbox';
import { useDesafios, type DesafioBase } from './desafio';
import type { ToyProps } from './tipos';

const reais = (v: number, casas = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const inteiro = (v: number) => v.toLocaleString('pt-BR');

// =====================================================================================================
// 1. FEED
// =====================================================================================================
export type Post = { id: number; texto: string; tema: string; engaj: number; hora: number; falso: boolean };
export const POSTS: Post[] = [
  { id: 0, texto: 'Prefeitura divulga calendário de vacinação', tema: 'saúde', engaj: 12, hora: 9, falso: false },
  { id: 1, texto: 'URGENTE: vacina deixa o braço magnético!!!', tema: 'saúde', engaj: 95, hora: 3, falso: true },
  { id: 2, texto: 'Foto do ensaio de quinta', tema: 'igreja', engaj: 30, hora: 8, falso: false },
  { id: 3, texto: 'Você não vai acreditar no que este político fez', tema: 'política', engaj: 88, hora: 2, falso: true },
  { id: 4, texto: 'Câmara aprova o orçamento do ano que vem', tema: 'política', engaj: 15, hora: 7, falso: false },
  { id: 5, texto: 'Vídeo: gato toca teclado', tema: 'humor', engaj: 70, hora: 5, falso: false },
  { id: 6, texto: 'Você ganhou um prêmio! Clique e informe seus dados', tema: 'compras', engaj: 60, hora: 4, falso: true },
  { id: 7, texto: 'Culto especial domingo às 18h', tema: 'igreja', engaj: 20, hora: 6, falso: false },
];
export type EstadoFeed = { ordem: 'tempo' | 'engaj' | 'pessoal'; curtidas: number[] };
const FD0: EstadoFeed = { ordem: 'tempo', curtidas: [] };
const fdValido = (x: unknown) => !!x && ['tempo', 'engaj', 'pessoal'].includes((x as EstadoFeed).ordem) && Array.isArray((x as EstadoFeed).curtidas);
export const pontos = (p: Post, s: EstadoFeed) => (s.ordem === 'tempo' ? p.hora : s.ordem === 'engaj' ? p.engaj : p.engaj + 50 * s.curtidas.filter((c) => POSTS[c].tema === p.tema).length);
export const feed = (s: EstadoFeed) => [...POSTS].sort((a, b) => pontos(b, s) - pontos(a, s));
export const falsosNoTopo = (s: EstadoFeed) => feed(s).slice(0, 3).filter((p) => p.falso).length;
export const DESAFIOS_FEED: DesafioBase<EstadoFeed>[] = [
  { id: 'fd-engaja', texto: 'O feed está em ordem de chegada (o mais novo em cima). Troque para "Por engajamento": sobe o que recebe mais cliques e comentários.', ini: FD0, prever: 'Antes de trocar: dos 3 primeiros, quantos serão boato ou golpe?', falta: (s) => (s.ordem === 'engaj' ? null : 'Troque para "Por engajamento".'), depois: 'Dois dos três primeiros são falsos. O algoritmo não escolheu mentira: ele escolheu o que prende atenção, e o exagero prende. É o que a unidade chama de mediação por algoritmos: quem decide o que você vê primeiro é um critério, e esse critério foi escolhido por alguém.' },
  { id: 'fd-bolha', texto: 'Modo "Personalizado": cada curtida sua faz subir os posts do mesmo assunto. Curta os dois posts de um mesmo assunto (por exemplo, os dois de política) e olhe o topo.', ini: { ordem: 'pessoal', curtidas: [] }, falta: (s) => { const f = feed(s); return s.ordem !== 'pessoal' ? 'Fique no modo "Personalizado".' : s.curtidas.length >= 2 && f[0].tema === f[1].tema ? null : 'O topo ainda tem assuntos diferentes. Curta dois posts do mesmo assunto.'; }, depois: 'O feed passou a devolver mais do mesmo, e os outros assuntos afundaram. Isso se chama bolha: o sistema aprende o que você clica e estreita o que você vê. A U8 descreve o risco: sistemas de recomendação podem "limitar a pluralidade informacional" e "reforçar estereótipos".' },
];

export function FeedAlgoritmo({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoFeed>(FD0, chave, fdValido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const { painel } = useDesafios(DESAFIOS_FEED, desafios, modo, h, onProgresso);
  const s = h.estado, lista = feed(s);
  const curtir = (id: number) => h.mudar({ ...s, curtidas: s.curtidas.includes(id) ? s.curtidas.filter((c) => c !== id) : [...s.curtidas, id] });
  return (
    <Moldura titulo="O feed e o algoritmo" modo={modo} onModo={setModo} h={h}>
      {painel}
      <div className="seg" role="group" aria-label="Critério de ordenação">
        <button aria-pressed={s.ordem === 'tempo'} onClick={() => h.mudar({ ...s, ordem: 'tempo' })}>Ordem de chegada</button>
        <button aria-pressed={s.ordem === 'engaj'} onClick={() => h.mudar({ ...s, ordem: 'engaj' })}>Por engajamento</button>
        <button aria-pressed={s.ordem === 'pessoal'} onClick={() => h.mudar({ ...s, ordem: 'pessoal' })}>Personalizado</button>
      </div>
      <div className="vivo" aria-live="polite">
        <span className="rotulo">O que aparece, de cima para baixo (os mesmos 8 posts, sempre)</span>
        {lista.map((p, i) => (
          <div key={p.id} className="entre" style={{ gap: 8, flexWrap: 'nowrap', alignItems: 'flex-start', opacity: i < 3 ? 1 : 0.6 }}>
            <span style={{ whiteSpace: 'normal' }}><b>{i + 1}.</b> {p.texto} <span className="mini">· {p.tema} · {p.engaj} reações{p.falso ? ' · FALSO' : ''}</span></span>
            <button className="btn sm" aria-pressed={s.curtidas.includes(p.id)} aria-label={'Curtir: ' + p.texto} onClick={() => curtir(p.id)}>{s.curtidas.includes(p.id) ? '♥' : '♡'}</button>
          </div>
        ))}
      </div>
      <div className="vivo" aria-live="polite">
        <div className="f">Falsos entre os 3 primeiros: <b>{falsosNoTopo(s)}</b></div>
        <div className="f">Assuntos diferentes entre os 4 primeiros: <b>{new Set(lista.slice(0, 4).map((p) => p.tema)).size}</b></div>
        <span className="mini">Os três de cima são os que a maioria das pessoas chega a ler. As curtidas só mudam a ordem no modo "Personalizado".</span>
      </div>
    </Moldura>
  );
}

// =====================================================================================================
// 2. ESCALA
// =====================================================================================================
export const NIVEIS = [10, 100, 500, 1000, 2000, 5000, 10000, 100000, 1000000];
export type EstadoEscala = { i: number; mvp: boolean };
const ES0: EstadoEscala = { i: 0, mvp: false };
const esValido = (x: unknown) => !!x && typeof (x as EstadoEscala).i === 'number' && (x as EstadoEscala).i >= 0 && (x as EstadoEscala).i < NIVEIS.length && typeof (x as EstadoEscala).mvp === 'boolean';
/** Loja física: cada loja custa 5.000 por mês e atende até 1.000 clientes; cada cliente custa 8 em produto. */
export const custoLoja = (n: number) => 5000 * Math.ceil(n / 1000) + 8 * n;
/** Aplicativo: equipe e desenvolvimento custam 20.000 por mês (2.000 na versão mínima); cada cliente custa 0,20 de nuvem. */
export const custoApp = (n: number, mvp = false) => (mvp ? 2000 : 20000) + 0.2 * n;
export const DESAFIOS_ESCALA: DesafioBase<EstadoEscala>[] = [
  { id: 'es-vira', texto: 'Com 10 clientes, o aplicativo sai caríssimo por cliente. Aumente os clientes até o aplicativo ficar mais barato, por cliente, que a loja.', ini: ES0, prever: 'Antes: com quantos clientes isso acontece?', falta: (s) => (s.mvp ? 'Deixe o MVP desligado neste desafio.' : custoApp(NIVEIS[s.i]) < custoLoja(NIVEIS[s.i]) ? null : 'A loja ainda é mais barata por cliente. Mais clientes.'), depois: 'A loja precisa abrir outra loja a cada mil clientes: o custo cresce junto com o público. O aplicativo paga a equipe uma vez e depois quase só a nuvem. Crescer sem que o custo cresça na mesma proporção: é isso que o curso chama de escalabilidade.' },
  { id: 'es-milhao', texto: 'Leve os dois negócios a 1 milhão de clientes.', ini: { i: 4, mvp: false }, prever: 'Antes: quanto vai custar cada cliente do aplicativo, em reais?', falta: (s) => (NIVEIS[s.i] === 1000000 ? null : 'Ainda não chegou a 1 milhão.'), depois: 'Vinte e dois centavos por cliente, contra 13 reais da loja (que precisaria de mil lojas). Por isso a escalabilidade é, nas palavras da U7, "um dos principais atrativos para investidores". O outro lado, que a unidade também registra: crescer rápido exige governança, segurança e cuidado com os dados de toda essa gente.' },
  { id: 'es-mvp', texto: 'Volte ao começo da história. Antes de gastar 20.000 por mês numa equipe completa, dá para testar a ideia. Ligue o MVP (a versão mínima do produto) e veja o custo total com 100 clientes.', ini: { i: 6, mvp: false }, falta: (s) => (!s.mvp ? 'Ligue o MVP.' : NIVEIS[s.i] === 100 ? null : 'Ajuste para 100 clientes.'), depois: 'Com a versão mínima, descobrir se alguém quer o produto custa 2.020 em vez de 20.020. Se ninguém quiser, perdeu-se pouco. É o estágio de validação: testar com usuários reais antes de construir tudo.' },
];

export function EscalaNegocio({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoEscala>(ES0, chave, esValido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const { painel } = useDesafios(DESAFIOS_ESCALA, desafios, modo, h, onProgresso);
  const s = h.estado, n = NIVEIS[s.i], cl = custoLoja(n), ca = custoApp(n, s.mvp), ml = cl / n, ma = ca / n, teto = Math.max(ml, ma);
  const W = 340, barra = (v: number) => Math.max(4, (v / teto) * (W - 120));
  return (
    <Moldura titulo="Escala: loja × aplicativo" modo={modo} onModo={setModo} h={h}>
      {painel}
      <div className="linha">
        <span className="mono">clientes por mês = {inteiro(n)}</span>
        <button className="btn sm" disabled={s.i === 0} onClick={() => h.mudar({ ...s, i: s.i - 1 })} aria-label="Menos clientes">−</button>
        <button className="btn sm pri" disabled={s.i === NIVEIS.length - 1} onClick={() => h.mudar({ ...s, i: s.i + 1 })} aria-label="Mais clientes">+</button>
        <button className="btn sm" aria-pressed={s.mvp} onClick={() => h.mudar({ ...s, mvp: !s.mvp })}>{s.mvp ? '◉' : '○'} MVP</button>
      </div>
      <svg viewBox={`0 0 ${W} 96`} className="palco" role="img" aria-label="Custo por cliente da loja e do aplicativo">
        <text x={4} y={26} fontSize={11}>Loja</text><rect x={70} y={12} height={22} rx={4} width={barra(ml)} fill="var(--gold)" />
        <text x={4} y={66} fontSize={11}>Aplicativo</text><rect x={70} y={52} height={22} rx={4} width={barra(ma)} fill="var(--accent)" />
        <text x={70} y={92} fontSize={10}>custo por cliente (barra maior = mais caro)</text>
      </svg>
      <div className="vivo" aria-live="polite">
        <div className="f">Loja: {inteiro(Math.ceil(n / 1000))} loja(s) × 5.000 + {inteiro(n)} × 8 = {inteiro(cl)} → <b>{reais(ml)}</b> por cliente</div>
        <div className="f">Aplicativo: {s.mvp ? '2.000' : '20.000'} + {inteiro(n)} × 0,20 = {inteiro(ca)} → <b>{reais(ma)}</b> por cliente</div>
        {s.mvp && n > 500 && <span className="mini">Uma versão mínima não aguenta tanta gente: a esta altura a startup já teria de construir o produto completo.</span>}
        <span className="mini">Valores em reais por mês, inventados para ilustrar. O que importa é a forma: um custo cresce com o público, o outro quase não.</span>
      </div>
    </Moldura>
  );
}

// =====================================================================================================
// 3. LABORATÓRIO DE VIÉS
// =====================================================================================================
export type Pessoa = { nota: number; bom: boolean };
export const GRUPO_A: Pessoa[] = [[85, true], [78, true], [72, true], [66, true], [61, false], [55, true], [48, false], [40, false]].map(([nota, bom]) => ({ nota: nota as number, bom: bom as boolean }));
/** As mesmas pessoas, em termos de quem paga; a nota é 15 pontos menor porque o histórico do bairro era pior. */
export const GRUPO_B: Pessoa[] = GRUPO_A.map((p) => ({ nota: p.nota - 15, bom: p.bom }));
export type EstadoVies = { cA: number; cB: number; junto: boolean };
const VI0: EstadoVies = { cA: 60, cB: 60, junto: true };
const viValido = (x: unknown) => !!x && typeof (x as EstadoVies).cA === 'number' && typeof (x as EstadoVies).cB === 'number' && typeof (x as EstadoVies).junto === 'boolean';
export const CORTES = Array.from({ length: 15 }, (_, i) => 20 + 5 * i); // 20 a 90
export const balanco = (g: Pessoa[], corte: number) => ({ aprovados: g.filter((p) => p.nota >= corte).length, bonsRecusados: g.filter((p) => p.bom && p.nota < corte).length, mausAprovados: g.filter((p) => !p.bom && p.nota >= corte).length });
const apA = (s: EstadoVies) => balanco(GRUPO_A, s.cA).aprovados, apB = (s: EstadoVies) => balanco(GRUPO_B, s.cB).aprovados;
export const DESAFIOS_VIES: DesafioBase<EstadoVies>[] = [
  { id: 'vi-mesma', texto: 'Um banco aprova crédito para quem tem nota acima do corte. Com o MESMO corte para os dois bairros (cadeado ligado), ajuste até o bairro A ter exatamente 4 aprovados.', ini: { cA: 50, cB: 50, junto: true }, prever: 'Antes: e no bairro B, quantos serão aprovados com esse mesmo corte?', falta: (s) => (!s.junto || s.cA !== s.cB ? 'Deixe o cadeado ligado: o mesmo corte para os dois.' : apA(s) === 4 ? null : `O bairro A tem ${apA(s)} aprovado(s).`), depois: 'Quatro contra um. E os dois bairros têm exatamente a mesma quantidade de bons pagadores (5 em 8). A regra é igual para todos, mas a NOTA não é: ela foi calculada a partir de um histórico em que o bairro B aparecia pior. É o primeiro ponto da U8: a decisão é condicionada pelos dados de entrada.' },
  { id: 'vi-paridade', texto: 'Agora o cadeado está aberto. Ajuste os dois cortes para que cada bairro tenha 4 aprovados.', ini: { cA: 65, cB: 65, junto: false }, falta: (s) => (apA(s) === 4 && apB(s) === 4 ? null : `A: ${apA(s)} aprovado(s); B: ${apB(s)}.`), depois: 'Agora os resultados são iguais, mas as regras não: no bairro A, quem tem 61 é recusado; no B, quem tem 51 é aprovado. Tem gente que vai chamar isso de justo, e gente que vai chamar de injusto. As duas posições se defendem.' },
  { id: 'vi-impossivel', texto: 'Tente conseguir as duas coisas de uma vez: o MESMO corte para os dois bairros e o MESMO número de aprovados nos dois (pelo menos 1, no máximo 7).', ini: VI0, falta: (s) => (s.cA === s.cB && apA(s) === apB(s) && apA(s) >= 1 && apA(s) <= 7 ? null : `Corte A ${s.cA}, corte B ${s.cB}; aprovados: ${apA(s)} e ${apB(s)}.`), impossivel: 'Com estes dados, não existe. Mesma regra dá resultados desiguais; resultados iguais pedem regras diferentes. Escolher qual das duas ideias de "justo" vale é uma decisão de valor, e alguém a toma quando configura o sistema. É por isso que a U8 diz que a neutralidade tecnológica "revela-se um equívoco": as decisões dependem dos dados de entrada, dos critérios de otimização e das finalidades de quem construiu.' },
];

export function LabVies({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoVies>(VI0, chave, viValido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const { painel } = useDesafios(DESAFIOS_VIES, desafios, modo, h, onProgresso);
  const s = h.estado, bA = balanco(GRUPO_A, s.cA), bB = balanco(GRUPO_B, s.cB);
  const mexer = (k: 'cA' | 'cB', d: number) => { const v = Math.max(20, Math.min(90, s[k] + d)); h.mudar(s.junto ? { ...s, cA: v, cB: v } : { ...s, [k]: v }); };
  const W = 340, X = (nota: number) => 16 + ((nota - 20) / 70) * (W - 32);
  const Faixa = ({ g, corte, y, nome }: { g: Pessoa[]; corte: number; y: number; nome: string }) => (
    <g>
      <text x={4} y={y - 20} fontSize={11}>{nome}</text>
      <line x1={X(20)} x2={X(90)} y1={y} y2={y} stroke="var(--ink-2)" />
      <rect x={X(corte)} y={y - 16} width={X(90) - X(corte)} height={32} fill="var(--ok)" opacity={0.12} />
      <line x1={X(corte)} x2={X(corte)} y1={y - 18} y2={y + 18} stroke="var(--ink)" strokeWidth={2} strokeDasharray="4 3" />
      <text x={X(corte)} y={y + 30} fontSize={10} textAnchor="middle">corte {corte}</text>
      {g.map((p, i) => <circle key={i} cx={X(p.nota)} cy={y} r={8} fill={p.nota >= corte ? (p.bom ? 'var(--ok)' : 'var(--bad)') : 'var(--bg)'} stroke={p.bom ? 'var(--ok)' : 'var(--bad)'} strokeWidth={3} />)}
    </g>
  );
  const Controle = ({ k, nome }: { k: 'cA' | 'cB'; nome: string }) => (
    <span className="linha" style={{ gap: 4 }}><span className="mono">corte {nome} = {s[k]}</span><button className="btn sm" onClick={() => mexer(k, -5)} aria-label={`Baixar o corte ${nome}`}>−</button><button className="btn sm" onClick={() => mexer(k, 5)} aria-label={`Subir o corte ${nome}`}>+</button></span>
  );
  return (
    <Moldura titulo="Laboratório de viés" modo={modo} onModo={setModo} h={h}>
      {painel}
      <div className="linha">
        <Controle k="cA" nome="A" /><Controle k="cB" nome="B" />
        <button className="btn sm" aria-pressed={s.junto} onClick={() => h.mudar(s.junto ? { ...s, junto: false } : { cA: s.cA, cB: s.cA, junto: true })}>{s.junto ? '🔒 mesmo corte' : '🔓 cortes separados'}</button>
      </div>
      <svg viewBox={`0 0 ${W} 170`} className="palco" role="img" aria-label="Notas das pessoas dos dois bairros e a nota de corte">
        <Faixa g={GRUPO_A} corte={s.cA} y={48} nome="Bairro A" />
        <Faixa g={GRUPO_B} corte={s.cB} y={128} nome="Bairro B" />
      </svg>
      <span className="mini">Cada bolinha é uma pessoa, posicionada pela nota que o sistema deu. Contorno verde: pagaria o empréstimo. Contorno vermelho: não pagaria. Bolinha cheia: aprovada.</span>
      <div className="vivo" aria-live="polite">
        <div className="f">Bairro A: <b>{bA.aprovados}</b> de 8 aprovados · bons pagadores recusados: {bA.bonsRecusados} · maus pagadores aprovados: {bA.mausAprovados}</div>
        <div className="f">Bairro B: <b>{bB.aprovados}</b> de 8 aprovados · bons pagadores recusados: {bB.bonsRecusados} · maus pagadores aprovados: {bB.mausAprovados}</div>
        <span className="mini">Os dois bairros têm 5 bons pagadores em 8. A nota do bairro B é 15 pontos menor para todo mundo, porque o modelo aprendeu com um histórico em que aquele bairro recebia menos crédito.</span>
      </div>
    </Moldura>
  );
}

// =====================================================================================================
// 4. CHECKLIST LGPD
// =====================================================================================================
export const CAMPOS = [
  { id: 'nome', rot: 'Nome', precisa: true }, { id: 'telefone', rot: 'Telefone', precisa: true }, { id: 'cpf', rot: 'CPF', precisa: false },
  { id: 'endereco', rot: 'Endereço', precisa: false }, { id: 'renda', rot: 'Renda', precisa: false }, { id: 'local', rot: 'Localização em tempo real', precisa: false },
];
export type EstadoLgpd = { campos: string[]; fim: boolean; aviso: boolean; extra: boolean; acesso: boolean; registro: boolean };
const TODOS = CAMPOS.map((c) => c.id);
const LG0: EstadoLgpd = { campos: TODOS, fim: false, aviso: false, extra: true, acesso: false, registro: false };
const lgValido = (x: unknown) => !!x && Array.isArray((x as EstadoLgpd).campos) && typeof (x as EstadoLgpd).fim === 'boolean' && typeof (x as EstadoLgpd).registro === 'boolean';
export const sobrando = (s: EstadoLgpd) => CAMPOS.filter((c) => !c.precisa && s.campos.includes(c.id)).map((c) => c.rot);
export const PRINCIPIOS: { id: string; nome: string; ok: (s: EstadoLgpd) => boolean; sim: string; nao: string }[] = [
  { id: 'finalidade', nome: 'Finalidade', ok: (s) => s.fim, sim: 'Há um propósito específico e declarado: avisar a escala.', nao: 'Ninguém definiu para que os dados servem. Coletar "porque pode ser útil um dia" não é finalidade.' },
  { id: 'adequacao', nome: 'Adequação', ok: (s) => s.fim && !s.extra, sim: 'O que se faz com os dados é o que foi dito que se faria.', nao: 'O uso real não bate com a finalidade informada (a lista vai para uma loja, ou nem há finalidade definida).' },
  { id: 'necessidade', nome: 'Necessidade', ok: (s) => sobrando(s).length === 0, sim: 'Só se coleta o mínimo para a finalidade.', nao: 'Há dado sobrando para quem só quer avisar a escala.' },
  { id: 'transparencia', nome: 'Transparência', ok: (s) => s.aviso, sim: 'A pessoa é informada, em linguagem clara, do que é coletado e para quê.', nao: 'A pessoa preenche sem saber o que será feito com os dados.' },
  { id: 'seguranca', nome: 'Segurança', ok: (s) => s.acesso, sim: 'Há senha e só a liderança acessa a lista.', nao: 'A planilha está aberta para qualquer um com o link.' },
  { id: 'responsabilizacao', nome: 'Responsabilização', ok: (s) => s.registro, sim: 'Há um responsável e um registro de quem acessou: dá para prestar contas.', nao: 'Se vazar, ninguém sabe quem acessou nem quem responde.' },
];
export const conformes = (s: EstadoLgpd) => PRINCIPIOS.filter((p) => p.ok(s)).length;
const funciona = (s: EstadoLgpd) => s.campos.includes('nome') && s.campos.includes('telefone');
const BOM: EstadoLgpd = { campos: ['nome', 'telefone'], fim: true, aviso: true, extra: false, acesso: true, registro: true };
export const DESAFIOS_LGPD: DesafioBase<EstadoLgpd>[] = [
  { id: 'lg-minimo', texto: 'O cadastro do ministério de louvor serve para uma coisa: avisar a escala da semana por mensagem. Ele pede seis dados. Deixe só os necessários.', ini: { ...BOM, campos: TODOS }, falta: (s) => (!funciona(s) ? 'Sem nome e telefone não dá para avisar ninguém.' : sobrando(s).length ? `Ainda sobra: ${sobrando(s).join(', ')}.` : null), depois: 'Princípio da necessidade: coletar o mínimo que a finalidade exige. Dado que não foi coletado não vaza, não precisa ser protegido e não pode ser desviado. A U8 chama isso também de minimização.' },
  { id: 'lg-desvio', texto: 'A lista de telefones também está sendo repassada a uma loja parceira, para propaganda. Veja qual princípio ficou vermelho e conserte.', ini: { ...BOM, extra: true }, prever: 'Antes de olhar: quantos dos 6 princípios estão sendo feridos?', falta: (s) => (s.extra ? 'A lista ainda está indo para a loja.' : conformes(s) === 6 ? null : 'Você desligou outra proteção no caminho. Volte os 6 ao verde.'), depois: 'Um só: a adequação. As pessoas deram o telefone para receber a escala; usar para outra coisa é incompatível com o que foi informado. A U8 chama esse cuidado de "limitação de finalidade".' },
  { id: 'lg-conforme', texto: 'Este cadastro começou do pior jeito possível. Deixe os 6 princípios no verde, sem quebrar o serviço.', ini: LG0, falta: (s) => (!funciona(s) ? 'Sem nome e telefone o aviso não funciona.' : conformes(s) === 6 ? null : `${conformes(s)} de 6 no verde.`), depois: 'Repare que nenhum dos seis ajustes foi "comprar tecnologia". Foram decisões: o que coletar, para quê, quem acessa, quem responde. A U8 resume: sistemas devem ser projetados considerando a proteção de dados "desde as etapas iniciais".' },
];

export function ChecklistLgpd({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoLgpd>(LG0, chave, lgValido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const { painel } = useDesafios(DESAFIOS_LGPD, desafios, modo, h, onProgresso);
  const s = h.estado;
  const Chave = ({ k, rot }: { k: 'fim' | 'aviso' | 'extra' | 'acesso' | 'registro'; rot: string }) => <button className="btn sm" style={{ justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal' }} aria-pressed={s[k]} onClick={() => h.mudar({ ...s, [k]: !s[k] })}>{s[k] ? '◉' : '○'} {rot}</button>;
  return (
    <Moldura titulo="Cadastro e LGPD" modo={modo} onModo={setModo} h={h}>
      {painel}
      <div className="vivo">
        <span className="rotulo">O que o formulário pede</span>
        <div className="linha">{CAMPOS.map((c) => <button key={c.id} className="btn sm" aria-pressed={s.campos.includes(c.id)} onClick={() => h.mudar({ ...s, campos: s.campos.includes(c.id) ? s.campos.filter((x) => x !== c.id) : [...s.campos, c.id] })}>{s.campos.includes(c.id) ? '☑' : '☐'} {c.rot}</button>)}</div>
        <span className="rotulo">Como os dados são tratados</span>
        <Chave k="fim" rot='Finalidade definida por escrito: "avisar a escala da semana"' />
        <Chave k="aviso" rot="O formulário explica o que é coletado e para quê" />
        <Chave k="extra" rot="A lista também é repassada a uma loja parceira" />
        <Chave k="acesso" rot="Planilha com senha, acesso só da liderança" />
        <Chave k="registro" rot="Há um responsável e registro de quem acessou" />
      </div>
      <div className="vivo" aria-live="polite">
        <span className="rotulo">Os seis princípios: {conformes(s)} de 6 no verde</span>
        {PRINCIPIOS.map((p) => { const ok = p.ok(s); return <div key={p.id} className="f" style={{ whiteSpace: 'normal' }}><b style={{ color: ok ? 'var(--ok)' : 'var(--bad)' }}>{ok ? '✓' : '✗'} {p.nome}</b>: {ok ? p.sim : p.nao}</div>; })}
        {!funciona(s) && <span className="mini">Sem nome e telefone, o serviço não funciona: necessidade é o mínimo, não zero.</span>}
      </div>
    </Moldura>
  );
}
