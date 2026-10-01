// Teste de fumaça: monta cada tela, cada ilustração e cada passo de cada fase, para pegar
// qualquer erro que derrubaria a página. (Não substitui abrir no navegador e mexer.)
import { describe, expect, it } from 'vitest';
import { renderToString as bruto } from 'react-dom/server';

// O React separa pedaços de texto com comentários vazios; tiramos para poder procurar frases inteiras.
const renderToString = (el: React.ReactElement) => bruto(el).replace(/<!-- -->/g, '');
import { todasFases } from '../content';
import { Exercicio } from '../components/Exercicio';
import { Rico } from '../components/Rico';
import { TOYS } from '../components/toys';
import { GERADORES } from '../engine/geradores';
import { rng } from '../lib/rng';
import { Ajustes, Brincar, Diario, ErrosMaterial, Mais, RascunhoA3 } from '../pages/Caderno';
import { DesafioMisto, Erros, Revisao, Sessao } from '../pages/Estudo';
import { Mapa, Painel, RegiaoPage } from '../pages/Painel';
import { FaseRunner } from '../components/FaseRunner';
import { loja } from '../lib/store';
import type { ToyId } from '../engine/types';

describe('telas montam sem erro', () => {
  it('painel, mapa, regiões e páginas de apoio', () => {
    expect(renderToString(<Painel diasFora={0} />)).toContain('Sessão do dia');
    expect(renderToString(<Painel diasFora={5} />)).toContain('de volta');
    expect(renderToString(<Mapa />)).toContain('Conjuntos e funções');
    for (const id of ['m1', 'm2', 'm3', 'c1', 'nao-existe']) expect(renderToString(<RegiaoPage id={id} />).length).toBeGreaterThan(20);
    for (const T of [Revisao, Sessao, Erros, Diario, RascunhoA3, ErrosMaterial, Ajustes, Mais]) expect(renderToString(<T />).length).toBeGreaterThan(50);
    expect(renderToString(<Brincar />)).toContain('Venn vivo');
    expect(renderToString(<DesafioMisto onFim={() => {}} />)).toContain('Desafio misto');
  });

  it('as quatro ilustrações, em modo livre e em modo desafio', () => {
    for (const id of Object.keys(TOYS) as ToyId[]) {
      const C = TOYS[id].C;
      expect(renderToString(<C modoInicial="livre" />), id).toContain('Desfazer');
      expect(renderToString(<C modoInicial="desafio" />), id).toContain('Desafio 1 de');
      expect(renderToString(<Brincar id={id} />), id).toContain('Resetar');
    }
  });

  it('todos os passos de todas as fases', () => {
    let passos = 0;
    for (const f of todasFases()) {
      for (let i = 0; i < f.steps.length + 12; i++) {
        loja.guardarAndamento(f.id, i); // o runner abre no passo salvo
        const html = renderToString(<FaseRunner fase={f} onSair={() => {}} />);
        expect(html.length, `${f.id} passo ${i}`).toBeGreaterThan(100);
        expect(html, `${f.id} passo ${i}`).not.toContain('katex-error');
        passos++;
      }
    }
    expect(passos).toBeGreaterThan(200);
  });

  it('cada tipo de exercício gerado desenha a sua entrada', () => {
    for (const [nome, g] of Object.entries(GERADORES)) for (const nivel of [0, 2]) {
      const html = renderToString(<Exercicio ex={g(rng(77), nivel)} faseId="t" onFim={() => {}} />);
      expect(html, nome).toContain('Conferir');
      expect(html, nome).toContain('Dica 1/3');
    }
  });

  it('texto rico: fórmulas, negrito, listas e o cifrão de dinheiro', () => {
    const html = renderToString(<Rico>{'Custa R$ 25 mil e **não** R$ 27 mil. Fórmula: $2^n$.\n\n- um\n- dois\n\n$$a + b$$'}</Rico>);
    expect(html).toContain('R$ 25 mil');
    expect(html).toContain('R$ 27 mil');
    expect(html).toContain('<strong>não</strong>');
    expect(html).toContain('katex');
    expect(html).toContain('<li>um</li>');
    expect(html).not.toContain('katex-error');
  });
});
