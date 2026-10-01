import { useEffect } from 'react';
import { diasEntre, hoje } from './lib/datas';
import { nivel, xpDoNivel } from './lib/progresso';
import { loja, useEstado } from './lib/store';
import { Ajustes, Brincar, Diario, ErrosMaterial, Mais, RascunhoA3 } from './pages/Caderno';
import { Erros, Revisao, Sessao } from './pages/Estudo';
import { FasePage, Mapa, Painel, RegiaoPage } from './pages/Painel';
import { link, useRota } from './rota';

// Quantos dias você ficou fora (medido uma vez, antes de registrar a visita de hoje).
const DIAS_FORA = diasEntre(loja.get().ultimaVisita, hoje());

const ICONES: Record<string, React.JSX.Element> = {
  inicio: <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  mapa: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14" />,
  revisao: <path d="M4 6h13v12H4zM7 3h13v12M8 10h5M8 14h3" />,
  brincar: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />,
  mais: <path d="M4 7h16M4 12h16M4 17h16" />,
};

export function App() {
  const rota = useRota();
  const tema = useEstado((s) => s.tema);
  const xp = useEstado((s) => s.xp);
  const [a, b] = rota;

  useEffect(() => { loja.registrarVisita(); }, []);
  useEffect(() => {
    const el = document.documentElement;
    if (tema === 'auto') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', tema === 'claro' ? 'light' : 'dark');
  }, [tema]);
  useEffect(() => { if (a !== 'fase') loja.lembrarTela(rota.join('/')); }, [rota.join('/')]); // eslint-disable-line

  const emFase = a === 'fase';
  const aba = !a ? 'inicio' : a === 'mapa' || a === 'regiao' ? 'mapa' : a === 'revisao' ? 'revisao' : a === 'brincar' ? 'brincar' : 'mais';
  const n = nivel(xp), base = xpDoNivel(n), prox = xpDoNivel(n + 1);
  const aviso = loja.aviso();

  let tela: React.JSX.Element;
  if (!a) tela = <Painel diasFora={DIAS_FORA} />;
  else if (a === 'mapa') tela = <Mapa />;
  else if (a === 'regiao' && b) tela = <RegiaoPage id={b} />;
  else if (a === 'fase' && b) tela = <FasePage id={b} />;
  else if (a === 'revisao') tela = <Revisao />;
  else if (a === 'sessao') tela = <Sessao />;
  else if (a === 'erros') tela = <Erros />;
  else if (a === 'diario') tela = <Diario />;
  else if (a === 'a3') tela = <RascunhoA3 />;
  else if (a === 'brincar') tela = <Brincar id={b} />;
  else if (a === 'material') tela = <ErrosMaterial />;
  else if (a === 'ajustes') tela = <Ajustes />;
  else if (a === 'mais') tela = <Mais />;
  else tela = <p>Tela não encontrada. <a href={link('')}>Ir para o início</a></p>;

  return (
    <div className="app">
      {!emFase && (
        <header className="topo">
          <a className="marca" href={link('')}>
            <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="var(--paper-2)" /><path d="M12 46C22 46 20 30 32 30S42 16 52 16" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" /><circle cx="12" cy="46" r="5" fill="var(--gold)" /><circle cx="32" cy="30" r="5" fill="var(--ok)" /><circle cx="52" cy="16" r="5" fill="var(--bad)" /></svg>
            Trilha Ulife
          </a>
          <div className="xp" title={`${xp} XP`}>
            <span className="pilula ouro">Nível {n}</span>
            <div className="barra" style={{ width: 64 }} aria-label={`${xp - base} de ${prox - base} XP para o próximo nível`}><i style={{ width: `${((xp - base) / (prox - base)) * 100}%` }} /></div>
          </div>
        </header>
      )}
      {aviso && <div className="aviso" role="alert" style={{ marginBottom: 12 }}>{aviso}</div>}
      <main>{tela}</main>
      {!emFase && (
        <nav className="nav" aria-label="Principal">
          <div className="nav-in">
            {([['', 'inicio', 'Início'], ['mapa', 'mapa', 'Mapa'], ['revisao', 'revisao', 'Revisão'], ['brincar', 'brincar', 'Brincar'], ['mais', 'mais', 'Mais']] as const).map(([r, k, nome]) => (
              <a key={k} href={link(r)} aria-current={aba === k ? 'page' : undefined}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONES[k]}</svg>
                {nome}
              </a>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
