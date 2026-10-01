// Brinquedos das camadas C1 e C2 de Exploração Digital:
//  - CanoDados: banda × latência (e por que uma janela pequena estrangula um link gordo).
//  - PilhaNuvem: quem cuida de cada camada em IaaS, PaaS e SaaS.
//  - EmpresaSilos: três setores com planilhas isoladas × uma base integrada.
import { useEffect, useState } from 'react';
import { Moldura, useHistorico, useModo } from '../Sandbox';
import { useDesafios, type DesafioBase } from './desafio';
import type { ToyProps } from './tipos';

const n1 = (v: number, casas = 1) => v.toLocaleString('pt-BR', { maximumFractionDigits: casas });

// =====================================================================================================
// 1. CANO DE DADOS
// =====================================================================================================
/** banda em Mbps; latência (ida e volta) em ms; janela TCP em KiB */
export type EstadoCano = { banda: number; lat: number; janela: number };
const CANO0: EstadoCano = { banda: 100, lat: 20, janela: 1024 };
const canoValido = (x: unknown) => !!x && typeof (x as EstadoCano).banda === 'number' && typeof (x as EstadoCano).lat === 'number';
const BANDAS = [1, 5, 10, 30, 100, 500, 1000], LATS = [5, 10, 20, 60, 100, 200, 400, 600], JANELAS = [64, 256, 1024, 4096];
/** Limite que a janela impõe: só dá para ter "uma janela" de dados em trânsito por ida e volta. */
export const limiteJanela = (janelaKiB: number, latMs: number) => (janelaKiB * 1024 * 8) / (latMs / 1000) / 1e6;
export const vazao = (s: EstadoCano) => Math.min(s.banda, limiteJanela(s.janela, s.lat));
const CEN_CANO: { rotulo: string; s: EstadoCano; nota: string }[] = [
  { rotulo: 'Fibra em casa', s: { banda: 500, lat: 10, janela: 1024 }, nota: 'Muita banda e pouca latência: tudo funciona. É o que o curso chama de "altas velocidades, baixa latência e maior estabilidade".' },
  { rotulo: '4G na rua', s: { banda: 30, lat: 60, janela: 1024 }, nota: 'Banda razoável, latência média: vídeo vai bem; jogo online já sente.' },
  { rotulo: 'Satélite distante', s: { banda: 100, lat: 600, janela: 1024 }, nota: 'O sinal sobe 36 mil km e desce. Sobra banda, mas cada resposta demora mais de meio segundo: videochamada fica truncada.' },
  { rotulo: 'E se… o link for de 1 giga, mas longe?', s: { banda: 1000, lat: 200, janela: 64 }, nota: 'Link de 1000 Mbps, e a transferência anda a 2,6. O gargalo não é o cano: é a espera pela confirmação de cada janela de 64 KiB.' },
  { rotulo: 'E se… a banda for mínima e a latência ótima?', s: { banda: 1, lat: 5, janela: 1024 }, nota: 'Resposta instantânea, mas passa pouco por vez: mensagem de texto voa, download se arrasta.' },
];
export const DESAFIOS_CANO: DesafioBase<EstadoCano>[] = [
  { id: 'cn-video', texto: 'A videochamada está travando, e o plano é de 500 Mbps. Conserte SEM mexer na banda.', ini: { banda: 500, lat: 400, janela: 1024 }, prever: 'Antes de mexer: o problema é de banda ou de latência?',
    falta: (s) => (s.banda !== 500 ? 'Deixe a banda em 500 Mbps.' : s.lat <= 100 ? null : `A latência está em ${s.lat} ms. Conversa ao vivo precisa de resposta rápida (até uns 100 ms).`), depois: 'Videochamada usa pouca banda (uns 2 a 4 Mbps), mas não tolera atraso. Banda é quanto passa; latência é quanto demora para chegar.' },
  { id: 'cn-janela', texto: 'Link de 1000 Mbps, latência de 200 ms, janela TCP de 64 KiB. A transferência está lenta. Faça a vazão passar de 100 Mbps SEM mudar a banda nem a latência.', ini: { banda: 1000, lat: 200, janela: 64 }, prever: 'Antes de mexer: a quantos Mbps a transferência está andando?',
    falta: (s) => (s.banda !== 1000 || s.lat !== 200 ? 'Deixe a banda em 1000 e a latência em 200 ms.' : vazao(s) > 100 ? null : `A vazão está em ${n1(vazao(s))} Mbps.`), depois: 'Com 64 KiB só cabem 524 mil bits "no ar" a cada 0,2 s: 2,6 Mbps. Aumentar a janela deixa mais dados em trânsito de cada vez. É por isso que redes de longa distância usam janelas grandes.' },
  { id: 'cn-download', texto: 'Um arquivo de 100 MB precisa baixar em menos de 10 segundos. Ajuste o que quiser.', ini: { banda: 10, lat: 60, janela: 64 },
    falta: (s) => (800 / vazao(s) < 10 ? null : `Está levando ${n1(800 / vazao(s))} s (vazão de ${n1(vazao(s))} Mbps). 100 MB são 800 megabits.`), depois: 'Download depende da VAZÃO: 800 megabits em 10 s pedem 80 Mbps de verdade. Atenção à unidade: megabyte (MB) é 8 vezes megabit (Mb).' },
];

export function CanoDados({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoCano>(CANO0, chave, canoValido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const [nota, setNota] = useState('');
  const { painel } = useDesafios(DESAFIOS_CANO, desafios, modo, h, onProgresso, () => setNota(''));
  const s = h.estado, lim = limiteJanela(s.janela, s.lat), v = vazao(s);
  const W = 360, H = 150, grossura = 8 + (Math.log10(s.banda) / 3) * 54, comprimento = 90 + (Math.log(s.lat / 5) / Math.log(120)) * 230;
  const Passo = ({ rot, k, lista, un }: { rot: string; k: keyof EstadoCano; lista: number[]; un: string }) => {
    const i = lista.indexOf(s[k]);
    return (
      <span className="linha" style={{ gap: 4 }}>
        <span className="mono" style={{ minWidth: 150 }}>{rot}: {n1(s[k])} {un}</span>
        <button className="btn sm" disabled={i <= 0} onClick={() => h.mudar({ ...s, [k]: lista[Math.max(0, i - 1)] })} aria-label={`Diminuir ${rot}`}>−</button>
        <button className="btn sm" disabled={i >= lista.length - 1} onClick={() => h.mudar({ ...s, [k]: lista[i < 0 ? 0 : i + 1] })} aria-label={`Aumentar ${rot}`}>+</button>
      </span>
    );
  };
  const usos: [string, boolean, string][] = [
    ['Mensagem de texto', true, 'quase nada de banda, tolera atraso'],
    ['Videochamada', s.lat <= 100 && v >= 2, s.lat > 100 ? 'latência alta: a conversa atropela' : v < 2 ? 'banda insuficiente' : 'ok'],
    ['Jogo online', s.lat <= 60 && v >= 1, s.lat > 60 ? 'latência alta: o comando chega atrasado' : 'ok'],
    ['Filme em 4K', v >= 25, v < 25 ? 'vazão abaixo de 25 Mbps: a imagem cai de qualidade' : 'ok (um atraso de 1 s no começo ninguém nota)'],
    ['Baixar 100 MB', 800 / v <= 30, `leva ${n1(800 / v)} s`],
  ];
  return (
    <Moldura titulo="Cano de dados" modo={modo} onModo={setModo} h={h} cenarios={modo === 'livre' ? CEN_CANO.map((c) => ({ rotulo: c.rotulo, acao: () => { h.mudar(c.s); setNota(c.nota); } })) : undefined}>
      {painel}
      {nota && <div className="fb neutro">{nota}</div>}
      <div className="pilha" style={{ gap: 6 }}>
        <Passo rot="Banda" k="banda" lista={BANDAS} un="Mbps" />
        <Passo rot="Latência (ida e volta)" k="lat" lista={LATS} un="ms" />
        <Passo rot="Janela TCP" k="janela" lista={JANELAS} un="KiB" />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="palco" role="img" aria-label={`Cano com ${s.banda} Mbps de largura e ${s.lat} ms de comprimento`}>
        <rect x={20} y={H / 2 - grossura / 2} width={comprimento} height={grossura} rx={6} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2} />
        <rect x={20} y={H / 2 - Math.max(3, (grossura * v) / s.banda) / 2} width={comprimento} height={Math.max(3, (grossura * v) / s.banda)} fill="var(--accent)" opacity={0.75} />
        <text x={20} y={18} fontSize={11} fontWeight={700}>você</text><text x={20 + comprimento} y={18} textAnchor="end" fontSize={11} fontWeight={700}>servidor</text>
        <text x={20 + comprimento / 2} y={H - 8} textAnchor="middle" fontSize={11}>comprimento = latência ({s.lat} ms) · grossura = banda ({n1(s.banda)} Mbps)</text>
      </svg>
      <span className="mini">A parte escura é o quanto do cano está sendo usado de verdade.</span>
      <div className="vivo" aria-live="polite">
        <div className="f">Limite da janela = {s.janela} KiB × 8 bits ÷ {n1(s.lat / 1000, 3)} s = <b>{n1(lim)} Mbps</b></div>
        <div className="f">Vazão real = o menor entre a banda ({n1(s.banda)}) e esse limite = <b>{n1(v)} Mbps</b></div>
        {lim < s.banda && <span className="mini">O gargalo é a janela: o emissor manda {s.janela} KiB e espera a confirmação voltar. Quanto maior a latência, mais ele espera.</span>}
        {usos.map(([nome, ok, porque]) => <div key={nome} className="f">{ok ? '✓' : '✗'} {nome}: <span className="mini">{porque}</span></div>)}
      </div>
    </Moldura>
  );
}

// =====================================================================================================
// 2. PILHA DA NUVEM
// =====================================================================================================
export const CAMADAS = ['Aplicação (o programa em si)', 'Dados', 'Ambiente de execução (runtime)', 'Sistema operacional', 'Virtualização', 'Servidores e armazenamento', 'Rede e prédio do data center'];
/** corte = quantas camadas, a partir de CIMA, são responsabilidade de quem contrata. O resto é do provedor. */
export type EstadoPilha = { prov: boolean[] };
export const MODELOS_NUVEM: { id: string; nome: string; voce: number; frase: string }[] = [
  { id: 'local', nome: 'Tudo local (on-premises)', voce: 7, frase: 'A empresa compra, instala e mantém tudo, do prédio ao programa.' },
  { id: 'iaas', nome: 'IaaS', voce: 4, frase: 'O provedor entrega a infraestrutura (máquinas virtuais, rede, armazenamento). Você cuida do sistema operacional para cima.' },
  { id: 'paas', nome: 'PaaS', voce: 2, frase: 'O provedor entrega a plataforma pronta (infraestrutura + sistema + ambiente de execução). Você cuida só da aplicação e dos dados.' },
  { id: 'saas', nome: 'SaaS', voce: 0, frase: 'O provedor entrega o software pronto. Você só usa (e responde pelo que põe lá dentro e por quem tem acesso).' },
];
const pilhaDe = (voce: number): EstadoPilha => ({ prov: CAMADAS.map((_, i) => i >= voce) });
export const modeloAtual = (s: EstadoPilha) => { const voce = s.prov.filter((p) => !p).length; return s.prov.every((p, i) => p === i >= voce) ? MODELOS_NUVEM.find((m) => m.voce === voce) : undefined; };
const pilhaValida = (x: unknown) => !!x && Array.isArray((x as EstadoPilha).prov) && (x as EstadoPilha).prov.length === CAMADAS.length;
const monta = (id: string, nome: string, voce: number, depois: string): DesafioBase<EstadoPilha> => ({ id, texto: `Monte a divisão de responsabilidades de ${nome}: toque nas camadas para passá-las para o provedor ou para você.`, ini: pilhaDe(7), falta: (s) => (modeloAtual(s)?.voce === voce ? null : modeloAtual(s) ? `Isso é ${modeloAtual(s)!.nome}.` : 'Essa divisão não é um modelo padrão: o provedor sempre cuida de baixo para cima, sem buracos.'), depois });
export const DESAFIOS_PILHA: DesafioBase<EstadoPilha>[] = [
  monta('pn-iaas', 'IaaS (infraestrutura como serviço)', 4, 'IaaS: o provedor cuida da parte física e da virtualização. Você fica com o controle do sistema operacional e das aplicações, como diz o curso.'),
  monta('pn-paas', 'PaaS (plataforma como serviço)', 2, 'PaaS: o provedor gerencia a infraestrutura e os ambientes de execução; o desenvolvedor se concentra em criar o software.'),
  monta('pn-saas', 'SaaS (software como serviço)', 0, 'SaaS: software pronto, acessado pelo navegador ou aplicativo. E-mail, armazenamento de arquivos, sistemas de gestão.'),
];

export function PilhaNuvem({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoPilha>(pilhaDe(7), chave, pilhaValida, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const { painel } = useDesafios(DESAFIOS_PILHA, desafios, modo, h, onProgresso);
  const s = h.estado, m = modeloAtual(s), voce = s.prov.filter((p) => !p).length;
  return (
    <Moldura titulo="Pilha da nuvem" modo={modo} onModo={setModo} h={h} cenarios={modo === 'livre' ? MODELOS_NUVEM.map((x) => ({ rotulo: x.nome, acao: () => h.mudar(pilhaDe(x.voce)) })) : undefined}>
      {painel}
      <div className="pilha" style={{ gap: 4 }}>
        {CAMADAS.map((c, i) => (
          <button key={c} className="btn" onClick={() => h.mudar({ prov: s.prov.map((p, k) => (k === i ? !p : p)) })} aria-pressed={s.prov[i]}
            style={{ justifyContent: 'space-between', textAlign: 'left', background: s.prov[i] ? 'var(--accent-soft)' : 'var(--gold-soft)', borderColor: s.prov[i] ? 'var(--accent)' : 'var(--gold)' }}>
            <span>{c}</span><b style={{ color: s.prov[i] ? 'var(--accent)' : 'var(--gold)' }}>{s.prov[i] ? 'provedor' : 'você'}</b>
          </button>
        ))}
      </div>
      <span className="mini">Toque numa camada para trocar quem cuida dela. Em cima fica o que o usuário vê; embaixo, o que é físico.</span>
      <div className="vivo" aria-live="polite">
        <div className="f"><b>{m ? m.nome : 'Divisão fora do padrão'}</b> · você cuida de {voce} camada(s); o provedor, de {7 - voce}</div>
        <span className="mini">{m ? m.frase : 'Nos modelos de serviço, o provedor assume as camadas de baixo para cima, sem pular nenhuma. Não existe "o provedor cuida do sistema operacional, mas eu cuido do servidor".'}</span>
        <span className="mini">Quanto mais camadas com o provedor: menos trabalho e menos controle para você, e mais dependência do fornecedor.</span>
      </div>
    </Moldura>
  );
}

// =====================================================================================================
// 3. EMPRESA COM SILOS
// =====================================================================================================
/** real: o que existe de verdade. visoes: o que cada setor ACHA (em silo, cada um só vê as próprias operações). */
type Visao = { saldo: number; vendas: number };
export type EstadoSilos = { integrado: boolean; real: Visao; visoes: { vendas: Visao; estoque: Visao; financeiro: Visao }; retrabalho: number; atrasos: number; opsIntegradas: number };
const VIS0: Visao = { saldo: 3, vendas: 0 };
const SILOS0: EstadoSilos = { integrado: false, real: VIS0, visoes: { vendas: VIS0, estoque: VIS0, financeiro: VIS0 }, retrabalho: 0, atrasos: 0, opsIntegradas: 0 };
const silosValido = (x: unknown) => !!x && typeof (x as EstadoSilos).integrado === 'boolean' && !!(x as EstadoSilos).visoes?.vendas;
const todos = (v: Visao) => ({ vendas: v, estoque: v, financeiro: v });
export const divergencias = (s: EstadoSilos) => (['vendas', 'estoque', 'financeiro'] as const).filter((k) => s.visoes[k].saldo !== s.real.saldo || s.visoes[k].vendas !== s.real.vendas).length;
export function operar(s: EstadoSilos, op: 'vender' | 'receber' | 'planilha' | 'integrar'): EstadoSilos {
  if (op === 'integrar') return { ...s, integrado: !s.integrado, visoes: !s.integrado ? todos(s.real) : s.visoes, opsIntegradas: 0 };
  if (op === 'planilha') return { ...s, visoes: todos(s.real), retrabalho: s.retrabalho + 1 };
  if (op === 'receber') { const real = { ...s.real, saldo: s.real.saldo + 5 }; return { ...s, real, visoes: s.integrado ? todos(real) : { ...s.visoes, estoque: { ...s.visoes.estoque, saldo: s.visoes.estoque.saldo + 5 } }, opsIntegradas: s.integrado ? s.opsIntegradas + 1 : 0 }; }
  // vender: o vendedor decide olhando a visão DELE
  if (s.visoes.vendas.saldo <= 0) return s;
  const semEstoque = s.real.saldo <= 0;
  const real = { saldo: Math.max(0, s.real.saldo - 1), vendas: s.real.vendas + 1 };
  return { ...s, real, atrasos: s.atrasos + (semEstoque ? 1 : 0), visoes: s.integrado ? todos(real) : { ...s.visoes, vendas: { saldo: s.visoes.vendas.saldo - 1, vendas: s.visoes.vendas.vendas + 1 } }, opsIntegradas: s.integrado ? s.opsIntegradas + 1 : 0 };
}
export const DESAFIOS_SILOS: DesafioBase<EstadoSilos>[] = [
  { id: 'si-diverge', texto: 'Com os setores em silos, faça operações até as três áreas mostrarem números diferentes da realidade.', ini: SILOS0, falta: (s) => (s.integrado ? 'Deixe os sistemas isolados.' : divergencias(s) === 3 ? null : `${divergencias(s)} de 3 setores estão desatualizados. Faça uma venda e um recebimento.`), depois: 'Cada setor só enxerga o que ele mesmo registrou. Ninguém mentiu: é a estrutura que gera a divergência. O curso lista as consequências: retrabalho, divergência de dados, atrasos, custo e decisão com informação desatualizada.' },
  { id: 'si-atraso', texto: 'Ainda em silos: faça o vendedor vender um produto que o estoque não tem mais.', ini: { ...SILOS0, real: { saldo: 1, vendas: 0 }, visoes: { vendas: { saldo: 3, vendas: 0 }, estoque: { saldo: 1, vendas: 0 }, financeiro: VIS0 } }, prever: 'O estoque real é 1. Na tela do vendedor aparece 3. Quantas vendas ele consegue fazer antes de perceber?',
    falta: (s) => (s.atrasos > 0 ? null : 'Ainda não houve venda sem estoque. Continue vendendo.'), depois: 'O vendedor decidiu certo com a informação que tinha; a informação é que estava velha. É o "atraso na entrega de produtos" do estudo de caso da U4.' },
  { id: 'si-integra', texto: 'Ligue a integração (ERP + CRM numa base só) e faça 4 operações. Observe as divergências.', ini: { ...SILOS0, visoes: { vendas: { saldo: 2, vendas: 1 }, estoque: VIS0, financeiro: VIS0 }, real: { saldo: 2, vendas: 1 } },
    falta: (s) => (!s.integrado ? 'Ligue a integração.' : s.opsIntegradas >= 4 ? null : `Faça mais ${4 - s.opsIntegradas} operação(ões) com a integração ligada.`), depois: 'Uma base única: cada operação é registrada uma vez e todos enxergam na hora. Zero divergência, zero planilha repassada. É a "visão sistêmica" que o curso atribui a ERP e CRM integrados.' },
];

export function EmpresaSilos({ modoInicial = 'livre', desafios, chave, onProgresso }: ToyProps) {
  const [salva, setSalva] = useState(modoInicial === 'livre');
  const h = useHistorico<EstadoSilos>(SILOS0, chave, silosValido, salva);
  const [modo, setModo] = useModo(h, modoInicial);
  useEffect(() => { setSalva(modo === 'livre'); }, [modo]);
  const { painel } = useDesafios(DESAFIOS_SILOS, desafios, modo, h, onProgresso);
  const s = h.estado, div = divergencias(s);
  const setores: [keyof EstadoSilos['visoes'], string, string][] = [['vendas', 'Vendas (CRM)', 'registra pedidos'], ['estoque', 'Estoque', 'registra entradas'], ['financeiro', 'Financeiro', 'fatura o que foi vendido']];
  return (
    <Moldura titulo="Empresa com silos" modo={modo} onModo={setModo} h={h}>
      {painel}
      <div className="linha">
        <button className="btn sm pri" disabled={s.visoes.vendas.saldo <= 0} onClick={() => h.mudar(operar(s, 'vender'))}>Vender 1</button>
        <button className="btn sm" onClick={() => h.mudar(operar(s, 'receber'))}>Chegou mercadoria (+5)</button>
        {!s.integrado && <button className="btn sm" onClick={() => h.mudar(operar(s, 'planilha'))}>Repassar planilha (manual)</button>}
        <button className="btn sm" aria-pressed={s.integrado} onClick={() => h.mudar(operar(s, 'integrar'))}>{s.integrado ? '◉ sistemas integrados' : '○ integrar sistemas'}</button>
      </div>
      <div className="grade2" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
        {setores.map(([k, nome, faz]) => {
          const v = s.visoes[k], ruim = v.saldo !== s.real.saldo || v.vendas !== s.real.vendas;
          return (
            <div key={k} className="cartao" style={{ padding: 8, borderColor: ruim ? 'var(--bad)' : 'var(--ok)', borderWidth: 2 }}>
              <b style={{ fontSize: '.85rem' }}>{nome}</b>
              <span className="mini">{faz}</span>
              <div className="mono" style={{ color: v.saldo !== s.real.saldo ? 'var(--bad)' : undefined }}>saldo: {v.saldo}</div>
              <div className="mono" style={{ color: v.vendas !== s.real.vendas ? 'var(--bad)' : undefined }}>vendas: {v.vendas}</div>
            </div>
          );
        })}
      </div>
      <div className="vivo" aria-live="polite">
        <div className="f">Realidade: saldo <b>{s.real.saldo}</b> · vendas <b>{s.real.vendas}</b></div>
        <div className="f">Setores com dado errado: <b>{div}</b> de 3 · planilhas repassadas: <b>{s.retrabalho}</b> · vendas sem estoque: <b>{s.atrasos}</b></div>
        <span className="mini">{s.integrado ? 'Base única: cada operação é registrada uma vez e todos enxergam na hora.' : 'Silos: cada setor só vê o que ele mesmo registrou. Para alinhar, alguém repassa uma planilha (retrabalho), e ela começa a envelhecer no mesmo instante.'}</span>
      </div>
    </Moldura>
  );
}
