import { useRef, useState } from 'react';
import { ERROS_MATERIAL } from '../content/erros';
import { fase as acharFase } from '../content';
import { Anotar } from '../components/FaseRunner';
import { SeloTag, Txt } from '../components/Rico';
import { TOYS, Toy } from '../components/toys';
import { SELOS, type Mundo, type Selo, type ToyId } from '../engine/types';
import { dataBR, diasEntre, hoje } from '../lib/datas';
import { loja, useEstado, VERSAO, type Nota } from '../lib/store';
import { link } from '../rota';

const TAGS: Record<Nota['tag'], string> = { duvida: 'Dúvida', erro: 'Erro', estalo: 'Estalo', explico: 'Explicação minha', livre: 'Nota' };

// ---------- diário ----------
export function Diario() {
  const notas = useEstado((x) => x.diario);
  const [novo, setNovo] = useState(false);
  const [filtro, setFiltro] = useState<Nota['tag'] | 'todas'>('todas');
  const lista = notas.filter((n) => filtro === 'todas' || n.tag === filtro);
  return (
    <div className="pilha g">
      <div><h1>Diário de pesquisa</h1><p className="sub">O "como eu pensei": dúvidas, erros e estalos. A U8 pede esse diário, e ele é a matéria-prima da A3.</p></div>
      <div className="linha">
        <button className="btn pri" onClick={() => setNovo(true)}>Nova anotação</button>
        <a className="btn" href={link('a3')}>Montar rascunho da A3</a>
      </div>
      {novo && <Anotar onFechar={() => setNovo(false)} />}
      <div className="linha">
        {(['todas', 'duvida', 'erro', 'estalo', 'explico', 'livre'] as const).map((t) => <button key={t} className="btn sm" aria-pressed={filtro === t} onClick={() => setFiltro(t)}>{t === 'todas' ? `Todas (${notas.length})` : TAGS[t]}</button>)}
      </div>
      {lista.length === 0 && <div className="cartao"><p className="sub">Nada aqui ainda. Dentro de qualquer fase, o botão ✎ abre uma anotação rápida ligada àquela fase.</p></div>}
      {lista.map((n) => (
        <div key={n.id} className="cartao">
          <div className="entre"><span className="pilula acc">{TAGS[n.tag]}</span><span className="mini">{dataBR(n.em)}{n.faseId && acharFase(n.faseId) ? ` · ${acharFase(n.faseId)!.titulo}` : ''}</span></div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{n.texto}</p>
          <button className="btn sm fantasma" onClick={() => { if (confirm('Apagar esta anotação?')) loja.apagarNota(n.id); }}>Apagar</button>
        </div>
      ))}
    </div>
  );
}

// ---------- rascunho da A3 ----------
const A3: Record<Mundo, { titulo: string; formato: string; itens: { id: string; nome: string; guia: string }[]; citacoes?: [string, string][] }> = {
  mat: {
    titulo: 'A3 de Matemática Computacional', formato: 'Texto dissertativo-reflexivo, 2 a 3 páginas (cerca de 600 a 900 palavras), individual, com introdução, desenvolvimento e conclusão.',
    itens: [
      { id: '1', nome: 'Sintetizar os principais conceitos das unidades', guia: 'Um parágrafo curto por grupo: conjuntos e funções; lógica e álgebra booleana; contagem; probabilidade; álgebra linear; grafos. Diga o que é e para que serve, com as suas palavras.' },
      { id: '2', nome: 'Mostrar a aplicação na situação-problema (Aegis-Grid)', guia: 'p ∨ (q ∧ r), S = P + QR, a tabela com 5 falhas em 8, a matriz de adjacência, a conta de probabilidade e as rotas alternativas no grafo. Mostre a conta.' },
      { id: '3', nome: 'Refletir sobre o processo de pesquisa', guia: 'O que você buscou, onde, e o que cada fonte acrescentou. O diário mostra o caminho. A U8 sugere SciELO, Google Acadêmico e o artigo do Minecraft com portas lógicas.' },
      { id: '4', nome: 'Conectar teoria e prática', guia: 'Um exemplo concreto por ferramenta. Os erros que você achou nos gabaritos do curso são ótimo material: mostram que você validou o resultado no contexto (Telecom: a solução exata não é inteira).' },
      { id: '5', nome: 'Contar a percepção da sua trajetória', guia: 'O que era difícil no começo, onde travou, o que mudou. Honestidade vale mais do que elogio à disciplina.' },
    ],
  },
  exp: {
    titulo: 'A3 de Exploração Digital', formato: 'Dissertativa que integra as 8 unidades sobre um cenário organizacional. Os eixos abaixo seguem o que a própria U8 pede.',
    itens: [
      { id: '1', nome: 'Abrir pela distinção: digitalização × transformação digital', guia: 'Não comece por "vivemos em uma era digital". Separe quem digitalizou processos de quem mudou modelo de negócio, cultura e forma de decidir.' },
      { id: '2', nome: 'Descer à infraestrutura', guia: 'Conectividade (banda e latência), nuvem (IaaS, PaaS, SaaS, escalabilidade) e integração de sistemas contra os silos (ERP, CRM, plataformas analíticas).' },
      { id: '3', nome: 'Subir para dado → IA → automação', guia: 'Fluxo entrada → processamento → armazenamento. Diferencie automação (regra fixa), IA (aprende com dados) e sistemas inteligentes.' },
      { id: '4', nome: 'Ética', guia: 'Viés algorítmico, opacidade, responsabilização, LGPD (finalidade, necessidade, adequação, transparência, segurança, responsabilização) e supervisão humana.' },
      { id: '5', nome: 'Fechar com o humano', guia: 'A tecnologia redefine funções, não elimina pessoas, sob condições: qualificação, governança e inclusão.' },
    ],
    citacoes: [
      ['Rogers (2017)', '"A transformação digital não é sobre tecnologia, mas sobre estratégia."'],
      ['Gabriel (2021)', '"Não são as tecnologias que substituem os profissionais, mas os profissionais que sabem usar tecnologia substituem os que não sabem."'],
      ['Gabriel (2021)', '"O futuro do trabalho não é sobre humanos versus máquinas, mas sobre humanos com máquinas."'],
      ['Gabriel (2021, p. 39)', '"A tecnologia não é neutra: ela reflete valores humanos e amplifica tanto nossos acertos quanto nossos erros."'],
      ['Akabane (2018)', '"As tecnologias cognitivas ampliam a capacidade das organizações de aprender com dados e transformar informação em vantagem competitiva."'],
      ['Schmidt, Huttenlocher e Kissinger (2023)', '"A inteligência artificial não é apenas mais uma ferramenta, mas uma tecnologia que redefine a relação entre humanos, conhecimento e poder."'],
    ],
  },
};
const palavras = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

export function RascunhoA3() {
  const a3 = useEstado((x) => x.a3);
  const notas = useEstado((x) => x.diario);
  const [mundo, setMundo] = useState<Mundo>('mat');
  const [aberto, setAberto] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const def = A3[mundo], txt = a3[mundo];
  const total = def.itens.reduce((s, it) => s + palavras(txt[it.id] ?? ''), 0);
  const montar = () => `${def.titulo}\nRascunho montado na Trilha Ulife (o texto é meu)\n\n` + def.itens.map((it) => `${it.id}. ${it.nome}\n\n${(txt[it.id] ?? '').trim() || '[ainda não escrevi]'}`).join('\n\n') + '\n';
  const baixar = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([montar()], { type: 'text/plain;charset=utf-8' })); a.download = `rascunho-a3-${mundo}.txt`; a.click(); URL.revokeObjectURL(a.href); };

  return (
    <div className="pilha g">
      <div><h1>Rascunho da A3</h1><p className="sub">O jogo organiza e dá o esqueleto. Quem escreve é você: nenhum texto aqui é gerado.</p></div>
      <div className="seg"><button aria-pressed={mundo === 'mat'} onClick={() => setMundo('mat')}>Matemática</button><button aria-pressed={mundo === 'exp'} onClick={() => setMundo('exp')}>Exploração</button></div>
      <div className="cartao"><b>{def.titulo}</b><p className="sub">{def.formato}</p><p className="mini">Vale 40 pontos, sem recuperação. Janela: 05/11 a 02/12/2026.</p>
        <div className="linha"><span className="pilula">{total} palavras</span><button className="btn sm" onClick={() => { navigator.clipboard?.writeText(montar()).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); }); }}>{copiado ? 'Copiado' : 'Copiar rascunho'}</button><button className="btn sm" onClick={baixar}>Baixar .txt</button></div>
      </div>
      {def.itens.map((it) => (
        <div key={it.id} className="cartao">
          <span className="rotulo acc">Item {it.id}</span>
          <h3>{it.nome}</h3>
          <p className="sub">{it.guia}</p>
          <textarea className="campo" style={{ minHeight: 150 }} value={txt[it.id] ?? ''} onChange={(e) => loja.escreverA3(mundo, it.id, e.target.value)} placeholder="Escreva aqui com suas palavras…" />
          <div className="entre"><span className="mini">{palavras(txt[it.id] ?? '')} palavras · salvo automaticamente</span><button className="btn sm" onClick={() => setAberto(aberto === it.id ? null : it.id)}>{aberto === it.id ? 'Fechar diário' : `Puxar do diário (${notas.length})`}</button></div>
          {aberto === it.id && (
            <div className="pilha" style={{ gap: 8 }}>
              {notas.length === 0 && <p className="mini">O diário está vazio. As anotações que você fizer nas fases aparecem aqui.</p>}
              {notas.map((n) => (
                <div key={n.id} className="cartao liso" style={{ padding: 10 }}>
                  <div className="entre"><span className="pilula">{TAGS[n.tag]}</span><span className="mini">{dataBR(n.em)}</span></div>
                  <p style={{ whiteSpace: 'pre-wrap', fontSize: '.92rem' }}>{n.texto.length > 280 ? n.texto.slice(0, 280) + '…' : n.texto}</p>
                  <button className="btn sm" onClick={() => loja.escreverA3(mundo, it.id, ((txt[it.id] ?? '').trim() + '\n\n' + n.texto).trim())}>Colar neste item</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {def.citacoes && (
        <div className="cartao">
          <span className="rotulo">Citações diretas que estão no material (use com aspas)</span>
          {def.citacoes.map(([quem, q], k) => <p key={k}><b>{quem}:</b> {q}</p>)}
          <p className="mini">Conferidas palavra por palavra no texto do curso (não nos livros originais).</p>
        </div>
      )}
    </div>
  );
}

// ---------- brincar (todas as ilustrações em modo livre) ----------
export function Brincar({ id }: { id?: string }) {
  if (id && id in TOYS) {
    const t = TOYS[id as ToyId];
    return (
      <div className="pilha">
        <a href={link('brincar')} className="mini">← Todas as ilustrações</a>
        <p className="sub">{t.resumo}</p>
        <Toy id={id as ToyId} modoInicial="livre" chave={'livre-' + id} />
        <p className="mini">O modo livre fica salvo como você deixou. Não tem certo nem errado aqui.</p>
      </div>
    );
  }
  return (
    <div className="pilha g">
      <div><h1>Brincar</h1><p className="sub">As ilustrações vivas em caixa de areia: mexa, quebre, desfaça. Cada uma também tem modo desafio.</p></div>
      <div className="grade2">
        {(Object.keys(TOYS) as ToyId[]).map((k) => (
          <a key={k} className="cartao" href={link('brincar/' + k)} style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="pilula acc">{TOYS[k].regiao}</span>
            <h3>{TOYS[k].nome}</h3>
            <p className="sub">{TOYS[k].resumo}</p>
          </a>
        ))}
      </div>
      <p className="mini">As ilustrações das outras regiões (contagem, probabilidade, vetores, matrizes, grafos, Aegis-Grid e as de Exploração) entram junto com as regiões delas.</p>
    </div>
  );
}

// ---------- erros do material ----------
export function ErrosMaterial() {
  const [f, setF] = useState<Selo | 'todos'>('todos');
  const lista = ERROS_MATERIAL.filter((e) => f === 'todos' || e.selo === f);
  return (
    <div className="pilha g">
      <div><h1>Erros no material do curso</h1><p className="sub">Encontrados na leitura completa das unidades e dos PDFs. Se cair algo parecido numa prova dissertativa, explique por que discorda: isso conta a seu favor.</p></div>
      <div className="cartao liso">{(Object.keys(SELOS) as Selo[]).map((k) => <p key={k}><SeloTag tipo={k} /> <span className="sub">{SELOS[k].explica}</span></p>)}</div>
      <div className="linha">{(['todos', 'erro', 'confira', 'alem'] as const).map((k) => <button key={k} className="btn sm" aria-pressed={f === k} onClick={() => setF(k)}>{k === 'todos' ? `Todos (${ERROS_MATERIAL.length})` : SELOS[k].rotulo}</button>)}</div>
      {lista.map((e) => (
        <div key={e.id} className="cartao">
          <div className="entre"><span className="fonte">{e.onde}</span><SeloTag tipo={e.selo} /></div>
          <p><b>No material:</b> <Txt>{e.oQue}</Txt></p>
          <p><b>O certo:</b> <Txt>{e.certo}</Txt></p>
          <p className="mini">Como foi conferido: {e.conferido}</p>
        </div>
      ))}
    </div>
  );
}

// ---------- ajustes ----------
export function Ajustes() {
  const s = useEstado((x) => x);
  const arq = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const exportar = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([loja.exportar()], { type: 'application/json' }));
    a.download = `trilha-ulife-backup-${hoje()}.json`;
    a.click(); URL.revokeObjectURL(a.href);
    setMsg({ ok: true, t: 'Backup baixado. Para levar ao celular, mande esse arquivo para você mesmo (WhatsApp, e-mail ou Drive) e use "Importar" lá.' });
  };
  const importar = async (f?: File) => {
    if (!f) return;
    try {
      const texto = await f.text();
      if (!confirm('Importar este backup substitui o progresso deste aparelho. (Uma cópia do progresso atual fica guardada.) Continuar?')) return;
      loja.importar(texto);
      setMsg({ ok: true, t: 'Progresso importado.' });
    } catch (e) { setMsg({ ok: false, t: (e as Error).message }); }
    if (arq.current) arq.current.value = '';
  };
  const dias = s.ultimoBackup ? diasEntre(s.ultimoBackup, hoje()) : null;
  return (
    <div className="pilha g">
      <h1>Ajustes</h1>
      <div className="cartao">
        <span className="rotulo">Progresso e backup</span>
        <p className="sub">Tudo é salvo sozinho neste navegador, a cada ação. O backup é um arquivo que serve para duas coisas: segurança, e levar o progresso do PC para o celular (ou o contrário).</p>
        <p>{dias === null ? 'Você ainda não fez backup.' : dias === 0 ? 'Último backup: hoje.' : `Último backup há ${dias} dia${dias === 1 ? '' : 's'} (${dataBR(s.ultimoBackup!)}).`}</p>
        <div className="linha">
          <button className="btn pri" onClick={exportar}>Exportar progresso (.json)</button>
          <button className="btn" onClick={() => arq.current?.click()}>Importar progresso</button>
          <input ref={arq} type="file" accept="application/json,.json" hidden onChange={(e) => importar(e.target.files?.[0])} />
        </div>
        {msg && <div className={'fb ' + (msg.ok ? 'ok' : 'bad')}>{msg.t}</div>}
        <p className="mini">O progresso fica preso ao endereço em que o jogo foi aberto. Se você abrir por outro endereço (por exemplo, depois de publicar), use exportar e importar uma vez.</p>
      </div>
      <div className="cartao">
        <span className="rotulo">Aparência</span>
        <div className="seg">{(['auto', 'claro', 'escuro'] as const).map((t) => <button key={t} aria-pressed={s.tema === t} onClick={() => loja.definirTema(t)}>{t === 'auto' ? 'Automático' : t === 'claro' ? 'Claro' : 'Escuro'}</button>)}</div>
      </div>
      <div className="cartao">
        <span className="rotulo">Usar como aplicativo no celular</span>
        <p className="sub">Depois de publicado, abra o endereço no celular e escolha "Adicionar à tela inicial" (no Chrome: menu ⋮; no iPhone: botão de compartilhar). Depois de aberto uma vez, funciona sem internet.</p>
      </div>
      <div className="cartao">
        <span className="rotulo">Números</span>
        <p className="sub">{Object.values(s.fases).filter((f) => f.feita).length} fases concluídas · {s.xp} XP · {s.dias.length} dia(s) de estudo · {s.diario.length} anotações · formato do save v{VERSAO}</p>
        <button className="btn sm fantasma" onClick={() => { if (prompt('Isso apaga TODO o progresso deste aparelho. Para confirmar, digite APAGAR') === 'APAGAR') { loja.apagarTudo(); setMsg({ ok: true, t: 'Progresso apagado.' }); } }}>Apagar todo o progresso</button>
      </div>
    </div>
  );
}

export function Mais() {
  const pend = useEstado((x) => x.erros).filter((e) => !e.resolvido).length;
  const itens: [string, string, string][] = [
    ['erros', 'Caderno de erros', pend ? `${pend} para refazer · "por que estou errando?"` : 'Exercícios errados, com explicação'],
    ['diario', 'Diário de pesquisa', 'Dúvidas, erros e estalos'],
    ['a3', 'Rascunho da A3', 'Organiza suas anotações nos itens pedidos'],
    ['material', 'Erros no material do curso', `${ERROS_MATERIAL.length} itens conferidos`],
    ['sessao', 'Sessão do dia', 'Revisão + fase nova + desafio misto'],
    ['ajustes', 'Ajustes e backup', 'Exportar, importar, tema'],
  ];
  return (
    <div className="pilha g">
      <h1>Mais</h1>
      <div className="pilha">{itens.map(([r, t, d]) => <a key={r} className="cartao" href={link(r)} style={{ textDecoration: 'none', color: 'inherit' }}><h3>{t}</h3><p className="sub">{d}</p></a>)}</div>
    </div>
  );
}
