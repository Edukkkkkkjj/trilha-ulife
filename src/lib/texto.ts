// Telas de leitura curtas: um texto comprido vira duas ou mais telas, sempre quebrando entre parágrafos
// (ou entre itens de lista, ou entre frases, quando o parágrafo sozinho é grande demais).

/** Tamanho aproximado do que aparece na tela: sem marcas de formatação, e cada fórmula em bloco vale uma linha e pouco. */
export function tamanhoVisivel(md: string): number {
  return md
    .replace(/\$\$[\s\S]*?\$\$/g, ' '.repeat(70))
    .replace(/\*\*|`/g, '')
    .length;
}

/** Divide por frases sem cortar dentro de "$...$" nem de "**...**" (conta as marcas para saber se está aberto). */
function frases(par: string): string[] {
  const partes = par.split(/(?<=[.!?…])\s+(?=[A-ZÀ-Ú"“(\d*$])/);
  const out: string[] = [];
  for (const p of partes) {
    const ant = out[out.length - 1];
    const aberto = ant !== undefined && ((ant.match(/\$/g)?.length ?? 0) % 2 === 1 || (ant.match(/\*\*/g)?.length ?? 0) % 2 === 1);
    if (aberto) out[out.length - 1] = ant + ' ' + p; else out.push(p);
  }
  return out;
}

const agrupar = (pecas: string[], limite: number, junta: string): string[] => {
  const out: string[] = [];
  let atual = '';
  for (const p of pecas) {
    if (atual && tamanhoVisivel(atual + junta + p) > limite) { out.push(atual); atual = p; }
    else atual = atual ? atual + junta + p : p;
  }
  if (atual) out.push(atual);
  return out;
};

/** Quebra um parágrafo grande em partes que cabem: por linhas (listas) ou, na falta delas, por frases. */
function partirBloco(bloco: string, limite: number): string[] {
  if (tamanhoVisivel(bloco) <= limite) return [bloco];
  const linhas = bloco.split('\n').map((l) => l.trimEnd()).filter(Boolean);
  if (linhas.length > 1) {
    // a linha que termina em ":" fica junto da seguinte
    const un: string[] = [];
    for (let i = 0; i < linhas.length; i++) { let l = linhas[i]; while (l.endsWith(':') && i + 1 < linhas.length) l += '\n' + linhas[++i]; un.push(l); }
    return agrupar(un, limite, '\n');
  }
  return agrupar(frases(bloco), limite, ' ');
}

/** Quebra o markdown de uma tela em telas menores. Um texto que já cabe volta inteiro. */
export function quebrarTexto(md: string, limite = 360): string[] {
  const texto = md.trim();
  if (tamanhoVisivel(texto) <= limite) return [texto];
  const blocos = texto.split(/\n\s*\n/);
  // "Introdução:" fica junto do bloco que ela apresenta; citação (">") e fórmula em bloco não ficam sozinhas no fim
  const un: string[] = [];
  for (let i = 0; i < blocos.length; i++) { let b = blocos[i]; while (b.trimEnd().endsWith(':') && i + 1 < blocos.length) b += '\n\n' + blocos[++i]; un.push(b); }
  const pecas = un.flatMap((b) => partirBloco(b, limite));
  return agrupar(pecas, limite, '\n\n');
}
