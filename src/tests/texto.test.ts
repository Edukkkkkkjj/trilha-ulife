// Telas curtas: a quebra não pode perder nem estragar texto, e nenhuma tela de aula passa do limite sem motivo.
import { describe, expect, it } from 'vitest';
import { todasFases } from '../content';
import { quebrarTexto, tamanhoVisivel } from '../lib/texto';

const juntar = (partes: string[]) => partes.join(' ').replace(/\s+/g, ' ').trim();
const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

describe('quebrarTexto', () => {
  it('texto curto volta inteiro', () => {
    expect(quebrarTexto('Uma frase curta.')).toEqual(['Uma frase curta.']);
  });
  it('quebra entre parágrafos e não perde nada', () => {
    const md = Array.from({ length: 6 }, (_, i) => `Parágrafo ${i + 1}. ` + 'palavra '.repeat(18)).join('\n\n');
    const partes = quebrarTexto(md, 200);
    expect(partes.length).toBeGreaterThan(2);
    expect(juntar(partes)).toBe(norm(md));
    for (const p of partes) expect(tamanhoVisivel(p)).toBeLessThanOrEqual(200);
  });
  it('mantém a introdução com dois-pontos junto da lista', () => {
    const md = 'Texto antes. ' + 'x '.repeat(100) + '\n\nAs três peças:\n\n- um\n- dois\n- três';
    const partes = quebrarTexto(md, 150);
    const comLista = partes.find((p) => p.includes('- um'))!;
    expect(comLista).toContain('As três peças:');
  });
  it('parágrafo gigante quebra por frases sem abrir fórmula nem negrito', () => {
    const md = Array.from({ length: 12 }, (_, i) => `Frase número ${i} com $x_${i} + 1$ e **destaque ${i}** no meio.`).join(' ');
    const partes = quebrarTexto(md, 160);
    expect(partes.length).toBeGreaterThan(2);
    for (const p of partes) { expect((p.match(/\$/g) ?? []).length % 2).toBe(0); expect((p.match(/\*\*/g) ?? []).length % 2).toBe(0); }
    expect(juntar(partes)).toBe(norm(md));
  });
  it('lista grande quebra por itens', () => {
    const md = Array.from({ length: 20 }, (_, i) => `- item ${i} com algum texto`).join('\n');
    const partes = quebrarTexto(md, 150);
    expect(partes.length).toBeGreaterThan(2);
    for (const p of partes) expect(p.split('\n').every((l) => l.startsWith('- '))).toBe(true);
    expect(partes.join('\n')).toBe(md);
  });
});

describe('conteúdo curto', () => {
  it('nenhum texto de aula, depois de quebrado, tem tela com mais de ~6 linhas de fórmula ou lista indivisível', () => {
    let telas = 0;
    for (const f of todasFases()) for (const s of f.steps) {
      if (s.t !== 'texto') continue;
      const partes = quebrarTexto(s.md);
      telas += partes.length;
      // sem perda de conteúdo
      expect(juntar(partes.map((p) => p.replace(/\n+/g, ' '))), f.id).toBe(norm(s.md));
      // nenhuma tela passa de 2x o limite (só quando um único bloco indivisível, como uma fórmula grande, é maior que o limite)
      for (const p of partes) expect(tamanhoVisivel(p), `${f.id}: ${p.slice(0, 50)}`).toBeLessThanOrEqual(360 * 2);
    }
    expect(telas).toBeGreaterThan(354);
  });
  it('o resumo de cada região (leitura) cabe em 2 a 3 minutos', () => {
    for (const f of todasFases().filter((x) => x.tipo === 'leitura')) {
      const palavras = f.steps.reduce((a, s) => a + (s.t === 'texto' ? s.md.split(/\s+/).length : 0), 0);
      expect(palavras / 200, f.id).toBeLessThanOrEqual(3); // 200 palavras por minuto
    }
  });
});
