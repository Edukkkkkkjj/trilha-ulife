// Funções como conjunto de setas (pares) entre domínio e contradomínio.

export type Pair = [string, string];

export type FnReport = {
  isFunction: boolean;
  semImagem: string[];   // elementos do domínio sem nenhuma seta
  comVarias: string[];   // elementos do domínio com mais de uma seta
  injetora: boolean;
  sobrejetora: boolean;
  bijetora: boolean;
  imagem: string[];      // elementos do contradomínio realmente atingidos
  colisoes: string[];    // elementos do contradomínio atingidos por mais de uma seta
  naoAtingidos: string[];
};

export function analisar(dominio: string[], contra: string[], pares: Pair[]): FnReport {
  const saidas = (a: string) => pares.filter((p) => p[0] === a).map((p) => p[1]);
  const semImagem = dominio.filter((a) => saidas(a).length === 0);
  const comVarias = dominio.filter((a) => new Set(saidas(a)).size > 1);
  const isFunction = semImagem.length === 0 && comVarias.length === 0;
  const imagem = contra.filter((b) => pares.some((p) => p[1] === b));
  const colisoes = contra.filter((b) => new Set(pares.filter((p) => p[1] === b).map((p) => p[0])).size > 1);
  const naoAtingidos = contra.filter((b) => !imagem.includes(b));
  const injetora = isFunction && colisoes.length === 0;
  const sobrejetora = isFunction && naoAtingidos.length === 0;
  return { isFunction, semImagem, comVarias, injetora, sobrejetora, bijetora: injetora && sobrejetora, imagem, colisoes, naoAtingidos };
}

/** g∘f: aplica f e depois g. Só liga a→c se existe b com a→b em f e b→c em g. */
export function compor(f: Pair[], g: Pair[]): Pair[] {
  const out: Pair[] = [];
  for (const [a, b] of f) for (const [b2, c] of g) if (b === b2 && !out.some((p) => p[0] === a && p[1] === c)) out.push([a, c]);
  return out;
}

export function rotulo(r: FnReport): string {
  if (!r.isFunction) return 'não é função';
  if (r.bijetora) return 'bijetora';
  if (r.injetora) return 'injetora';
  if (r.sobrejetora) return 'sobrejetora';
  return 'função (nem injetora nem sobrejetora)';
}
