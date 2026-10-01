// Geradores da M5 · Álgebra linear. A resposta é sempre calculada pelo código.
import type { Ex } from './types';
import type { Rng } from '../lib/rng';
import { det, escalar, produto, sistema2, type Mat } from '../lib/linear';

type Gerador = (r: Rng, nivel: number) => Ex;
let n = 0;
const id = (g: string) => `${g}#${Date.now().toString(36)}m5${(n++).toString(36)}`;
const pv = (v: number[]) => `(${v.join(', ')})`;
const neg = (x: number) => (x < 0 ? `(${x})` : String(x));
const matTex = (A: Mat) => `\\begin{pmatrix} ${A.map((l) => l.join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
const nz = (r: Rng, lo: number, hi: number) => { let x = 0; while (x === 0) x = r.int(lo, hi); return x; };

const vetores: Gerador = (r, nivel) => {
  const u = [nz(r, -5, 6), nz(r, -5, 6)], v = [nz(r, -5, 6), nz(r, -5, 6)];
  const tipo = nivel === 0 ? r.pick(['soma', 'k'] as const) : r.pick(['soma', 'k', 'pe', 'norma', 'perp'] as const);
  if (tipo === 'soma') return { id: id('m5.vet'), kind: 'passos', topic: 'm5.vetores', ocultos: 2, prompt: `Dados **u** = ${pv(u)} e **v** = ${pv(v)}, calcule **u + v**.`,
    passos: [{ texto: 'Soma de vetores: componente com componente.' }, { texto: `Primeira coordenada: ${u[0]} + ${neg(v[0])}.`, pede: { rotulo: 'x', resposta: u[0] + v[0] } }, { texto: `Segunda coordenada: ${u[1]} + ${neg(v[1])}.`, pede: { rotulo: 'y', resposta: u[1] + v[1] } }],
    hints: ['Some x com x e y com y.', `x: ${u[0]} + ${neg(v[0])}. y: ${u[1]} + ${neg(v[1])}.`, `u + v = ${pv([u[0] + v[0], u[1] + v[1]])}.`], explain: `u + v = (${u[0]} + ${neg(v[0])}, ${u[1]} + ${neg(v[1])}) = **${pv([u[0] + v[0], u[1] + v[1]])}**.` };
  if (tipo === 'k') { const k = r.pick([-3, -2, -1, 2, 3, 4]);
    return { id: id('m5.vet'), kind: 'passos', topic: 'm5.vetores', ocultos: 2, prompt: `Dado **v** = ${pv(v)}, calcule **${k}·v**.`,
      passos: [{ texto: `Multiplicar por escalar: cada coordenada vezes ${k}.` }, { texto: `${k} · ${neg(v[0])}.`, pede: { rotulo: 'x', resposta: k * v[0] } }, { texto: `${k} · ${neg(v[1])}.`, pede: { rotulo: 'y', resposta: k * v[1] } }],
      hints: ['Multiplique as duas coordenadas pelo número.', `x: ${k}·${neg(v[0])}. y: ${k}·${neg(v[1])}.`, `${pv([k * v[0], k * v[1]])}.`], explain: `${k}·v = **${pv([k * v[0], k * v[1]])}**.${k < 0 ? ' O sinal negativo inverte o sentido.' : ''} O tamanho fica ${Math.abs(k)} vezes maior.` }; }
  if (tipo === 'pe') { const pe = escalar(u, v);
    return { id: id('m5.vet'), kind: 'num', topic: 'm5.vetores', answer: pe, prompt: `Dados **u** = ${pv(u)} e **v** = ${pv(v)}, calcule o produto escalar **u · v**.`,
      armadilhas: [{ valor: (u[0] + v[0]) * (u[1] + v[1]), causa: 'conceito' as const, msg: 'O produto escalar multiplica x com x e y com y, e depois soma. Não se somam as coordenadas antes.' }, { valor: u[0] * v[1] + u[1] * v[0], causa: 'conta' as const, msg: 'Você cruzou as coordenadas. É x de u com x de v, e y de u com y de v.' }].filter((a) => a.valor !== pe),
      hints: ['Multiplique x com x, y com y, e some. O resultado é um número, não um vetor.', `${u[0]}·${neg(v[0])} + ${u[1]}·${neg(v[1])}.`, `${u[0] * v[0]} + ${neg(u[1] * v[1])} = ${pe}.`], explain: `u · v = ${u[0]}·${neg(v[0])} + ${u[1]}·${neg(v[1])} = ${u[0] * v[0]} + ${neg(u[1] * v[1])} = **${pe}**. ${pe === 0 ? 'Zero: são perpendiculares.' : pe > 0 ? 'Positivo: ângulo agudo.' : 'Negativo: ângulo obtuso.'}` }; }
  if (tipo === 'norma') { const [a, b, c] = r.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [4, 3, 5], [12, 5, 13]]), w = [r.bool() ? a : -a, r.bool() ? b : -b];
    return { id: id('m5.vet'), kind: 'num', topic: 'm5.vetores', answer: c, prompt: `Qual é o módulo (a norma) do vetor **v** = ${pv(w)}?`,
      armadilhas: [{ valor: Math.abs(w[0]) + Math.abs(w[1]), causa: 'conceito' as const, msg: 'Você somou as coordenadas. O comprimento vem de Pitágoras: raiz da soma dos quadrados.' }, { valor: a * a + b * b, causa: 'conta' as const, msg: 'Faltou tirar a raiz quadrada.' }],
      hints: ['O módulo é o comprimento da seta: use Pitágoras.', `√(${neg(w[0])}² + ${neg(w[1])}²) = √(${a * a} + ${b * b}).`, `√${a * a + b * b} = ${c}.`], explain: `$|v| = \\sqrt{x^2 + y^2}$ = √(${a * a} + ${b * b}) = √${a * a + b * b} = **${c}**. O quadrado apaga o sinal negativo.` }; }
  const a = nz(r, -4, 5), b = nz(r, -4, 5), k = r.pick([1, 2, -1]), certo = `(${-b * k}, ${a * k})`;
  const ops = r.shuffle([certo, `(${b * k}, ${a * k})`, `(${a * 2}, ${b * 2})`, `(${-a}, ${-b})`]).filter((x, i, xs) => xs.indexOf(x) === i);
  return { id: id('m5.vet'), kind: 'mcq', topic: 'm5.vetores', options: ops, correct: ops.indexOf(certo), fixo: true, prompt: `Qual destes vetores é **perpendicular** a **u** = ${pv([a, b])}?`,
    hints: ['Perpendicular = produto escalar igual a zero.', 'Teste cada alternativa: x·x + y·y.', `${a}·${neg(-b * k)} + ${b}·${neg(a * k)} = 0.`], explain: `Só **${certo}** dá produto escalar zero: ${a}·${neg(-b * k)} + ${b}·${neg(a * k)} = ${-a * b * k} + ${neg(a * b * k)} = 0. Um múltiplo de u (mesma direção ou sentido oposto) nunca é perpendicular a u.` };
};

const ordemProduto: Gerador = (r) => {
  const m = r.int(2, 5), k = r.int(2, 5), p = r.int(2, 5), existe = r.bool(0.7), kk = existe ? k : k === 5 ? 2 : k + 1;
  const certo = existe ? `Existe, e é ${m} × ${p}` : 'Não existe';
  const ops = [...new Set([certo, `Existe, e é ${p} × ${m}`, `Existe, e é ${k} × ${kk}`, existe ? 'Não existe' : `Existe, e é ${m} × ${p}`, `Existe, e é ${m} × ${k}`])].slice(0, 4);
  return { id: id('m5.ordem'), kind: 'mcq', topic: 'm5.matrizes', options: ops, correct: ops.indexOf(certo), prompt: `A matriz **A** tem ordem **${m} × ${k}** e a matriz **B** tem ordem **${kk} × ${p}**. O produto **A·B** existe? Se existe, qual é a ordem dele?`,
    hints: ['Ordem é sempre linhas × colunas.', `O produto só existe se as COLUNAS de A (${k}) forem iguais às LINHAS de B (${kk}).`, existe ? `Existe. O resultado fica com as linhas de A e as colunas de B: ${m} × ${p}.` : `${k} ≠ ${kk}: não existe.`],
    explain: existe ? `Colunas de A = linhas de B = ${k}: o produto existe. Ordem: linhas de A × colunas de B = **${m} × ${p}**. (Os "números de dentro" têm de ser iguais; os "de fora" dão a ordem.)` : `A tem ${k} colunas e B tem ${kk} linhas. Como ${k} ≠ ${kk}, **o produto não existe**.` };
};

const produtoMat: Gerador = (r, nivel) => {
  const A: Mat = [[r.int(-2, 4), r.int(-2, 4)], [r.int(-2, 4), r.int(-2, 4)]], B: Mat = [[r.int(-2, 4), r.int(-2, 4)], [r.int(-2, 4), r.int(-2, 4)]], C = produto(A, B)!;
  const conta = (i: number, j: number) => `${A[i][0]}·${neg(B[0][j])} + ${A[i][1]}·${neg(B[1][j])}`;
  return { id: id('m5.prod'), kind: 'passos', topic: 'm5.matrizes', ocultos: [2, 3, 4][Math.min(2, nivel)], prompt: `Calcule o produto $A \\cdot B$, com\n\n$$A = ${matTex(A)} \\qquad B = ${matTex(B)}$$`,
    passos: [
      { texto: 'Cada elemento do resultado é: LINHA de A vezes COLUNA de B (multiplica par a par e soma).' },
      { texto: `Linha 1, coluna 1: ${conta(0, 0)}.`, pede: { rotulo: 'c₁₁', resposta: C[0][0] } },
      { texto: `Linha 1, coluna 2: ${conta(0, 1)}.`, pede: { rotulo: 'c₁₂', resposta: C[0][1] } },
      { texto: `Linha 2, coluna 1: ${conta(1, 0)}.`, pede: { rotulo: 'c₂₁', resposta: C[1][0] } },
      { texto: `Linha 2, coluna 2: ${conta(1, 1)}.`, pede: { rotulo: 'c₂₂', resposta: C[1][1] } },
    ],
    hints: ['Para o elemento da linha i e coluna j: pegue a linha i de A e a coluna j de B.', `c₁₁ = ${conta(0, 0)} = ${C[0][0]}.`, `Resultado: linha 1 = (${C[0].join(', ')}), linha 2 = (${C[1].join(', ')}).`],
    explain: `$$A \\cdot B = ${matTex(C)}$$\n\nNão é "elemento com elemento": é linha vezes coluna.` };
};

const determinante: Gerador = (r, nivel) => {
  if (nivel === 0 || r.bool(0.4)) {
    const A: Mat = [[r.int(-4, 6), r.int(-4, 6)], [r.int(-4, 6), r.int(-4, 6)]], d = det(A);
    return { id: id('m5.det'), kind: 'num', topic: 'm5.determinante', answer: d, prompt: `Calcule o determinante de\n\n$$A = ${matTex(A)}$$`,
      armadilhas: [{ valor: A[0][0] * A[1][1] + A[0][1] * A[1][0], causa: 'conta' as const, msg: 'Você somou as duas diagonais. É a diagonal principal MENOS a secundária.' }, { valor: -d, causa: 'conta' as const, msg: 'O sinal está invertido: é principal menos secundária, nessa ordem.' }].filter((a) => a.valor !== d),
      hints: ['Determinante 2×2: diagonal principal menos diagonal secundária.', `${A[0][0]}·${neg(A[1][1])} − ${neg(A[0][1])}·${neg(A[1][0])}.`, `${A[0][0] * A[1][1]} − ${neg(A[0][1] * A[1][0])} = ${d}.`], explain: `det A = ${A[0][0]}·${neg(A[1][1])} − ${neg(A[0][1])}·${neg(A[1][0])} = ${A[0][0] * A[1][1]} − ${neg(A[0][1] * A[1][0])} = **${d}**.${d === 0 ? ' Zero: a matriz não tem inversa.' : ''}` };
  }
  const A: Mat = [0, 1, 2].map(() => [r.int(-2, 3), r.int(-2, 3), r.int(-2, 3)]), d = det(A);
  const [a, b, c] = A[0], [e, f, g] = A[1], [h, i, j] = A[2], pos = [a * f * j, b * g * h, c * e * i], ng = [c * f * h, a * g * i, b * e * j];
  return { id: id('m5.det'), kind: 'passos', topic: 'm5.determinante', ocultos: nivel === 1 ? 2 : 3, prompt: `Calcule o determinante pela regra de Sarrus:\n\n$$A = ${matTex(A)}$$`,
    passos: [
      { texto: 'Sarrus: some os três produtos das diagonais que descem para a direita e subtraia os três das que descem para a esquerda.' },
      { texto: `Diagonais que descem para a direita: ${a}·${neg(f)}·${neg(j)} + ${neg(b)}·${neg(g)}·${neg(h)} + ${neg(c)}·${neg(e)}·${neg(i)} = ${pos.map(neg).join(' + ')}.`, pede: { rotulo: 'soma das principais', resposta: pos[0] + pos[1] + pos[2] } },
      { texto: `Diagonais que descem para a esquerda: ${c}·${neg(f)}·${neg(h)} + ${neg(a)}·${neg(g)}·${neg(i)} + ${neg(b)}·${neg(e)}·${neg(j)} = ${ng.map(neg).join(' + ')}.`, pede: { rotulo: 'soma das secundárias', resposta: ng[0] + ng[1] + ng[2] } },
      { texto: 'Determinante = principais − secundárias.', pede: { rotulo: 'det A', resposta: d } },
    ],
    hints: ['Repita as duas primeiras colunas à direita da matriz para enxergar as diagonais.', `Principais: ${pos[0] + pos[1] + pos[2]}. Secundárias: ${ng[0] + ng[1] + ng[2]}.`, `${pos[0] + pos[1] + pos[2]} − ${neg(ng[0] + ng[1] + ng[2])} = ${d}.`],
    explain: `det A = (${pos.map(neg).join(' + ')}) − (${ng.map(neg).join(' + ')}) = ${pos[0] + pos[1] + pos[2]} − ${neg(ng[0] + ng[1] + ng[2])} = **${d}**.` };
};

const classificaSistema: Gerador = (r) => {
  const a = nz(r, 1, 4), b = nz(r, -3, 4), c = r.int(2, 12), tipo = r.pick(['SPD', 'SPI', 'SI'] as const), k = r.pick([2, 3, -1]);
  let spd: [number, number, number] = [nz(r, 1, 4), nz(r, -3, 4), r.int(1, 12)];
  while (a * spd[1] - b * spd[0] === 0) spd = [nz(r, 1, 4), nz(r, -3, 4), r.int(1, 12)];
  const [a2, b2, c2] = tipo === 'SPD' ? spd : tipo === 'SPI' ? [a * k, b * k, c * k] : [a * k, b * k, c * k + r.pick([1, 3, -2])];
  const cls = sistema2(a, b, c, a2, b2, c2).classe;
  const eq = (x: number, y: number, z: number) => `${x === 1 ? '' : x === -1 ? '-' : x}x ${y < 0 ? '-' : '+'} ${Math.abs(y) === 1 ? '' : Math.abs(y)}y = ${z}`;
  const ops = ['SPD: uma única solução (retas que se cruzam)', 'SPI: infinitas soluções (a mesma reta)', 'SI: nenhuma solução (retas paralelas)'], D = a * b2 - b * a2;
  return { id: id('m5.classe'), kind: 'mcq', topic: 'm5.sistemas', options: ops, correct: ['SPD', 'SPI', 'SI'].indexOf(cls), fixo: true, prompt: `Classifique o sistema:\n\n$$\\begin{cases} ${eq(a, b, c)} \\\\ ${eq(a2, b2, c2)} \\end{cases}$$`,
    hints: ['Comece pelo determinante dos coeficientes: D = a₁·b₂ − b₁·a₂.', `D = ${a}·${neg(b2)} − ${neg(b)}·${neg(a2)} = ${D}.`, D !== 0 ? 'D ≠ 0: solução única.' : 'D = 0: veja se a segunda equação inteira é múltipla da primeira (SPI) ou só o lado esquerdo (SI).'],
    explain: D !== 0 ? `D = ${D} ≠ 0: as retas se cruzam num único ponto. **SPD**.` : cls === 'SPI' ? `D = 0, e a segunda equação é a primeira multiplicada por ${a2 / a}, inclusive o lado direito: é a mesma reta. **SPI**.` : `D = 0: os lados esquerdos são múltiplos (mesma inclinação), mas o lado direito não acompanha. Retas paralelas. **SI**.` };
};

const CENAS_SIS: [string, string, string, string][] = [
  ['Uma empresa comprou servidores de dois tipos.', 'servidores do tipo A', 'servidores do tipo B', 'mil reais'],
  ['Uma equipe fez instalações de dois tipos.', 'instalações de fibra', 'instalações de rádio', 'horas'],
  ['Uma loja vendeu dois planos.', 'planos básicos', 'planos premium', 'reais (em centenas)'],
];
const resolveSistema: Gerador = (r, nivel) => {
  const x = r.int(1, 8), y = r.int(1, 8), p = r.int(2, 5), q = p + r.int(1, 4), tot = x + y, val = p * x + q * y;
  const [ctx, nx, ny, un] = r.pick(CENAS_SIS), D = q - p, Dx = tot * q - val, Dy = val - p * tot;
  return { id: id('m5.sis'), kind: 'passos', topic: 'm5.sistemas', ocultos: [2, 3, 5][Math.min(2, nivel)],
    prompt: `${ctx} Foram **${tot}** no total. Cada um dos ${nx} vale **${p}** ${un} e cada um dos ${ny} vale **${q}** ${un}; o total foi **${val}** ${un}.\n\nChame de x a quantidade de ${nx} e de y a de ${ny}. Resolva pela regra de Cramer.`,
    passos: [
      { texto: `Armando o sistema: x + y = ${tot} (quantidade) e ${p}x + ${q}y = ${val} (valor).` },
      { texto: `Determinante principal, só com os coeficientes: D = 1·${q} − 1·${p}.`, pede: { rotulo: 'D', resposta: D } },
      { texto: `Dx: troque a coluna do x pelos termos independentes (${tot} e ${val}): ${tot}·${q} − 1·${val}.`, pede: { rotulo: 'Dx', resposta: Dx } },
      { texto: `Dy: troque a coluna do y: 1·${val} − ${tot}·${p}.`, pede: { rotulo: 'Dy', resposta: Dy } },
      { texto: 'x = Dx ÷ D.', pede: { rotulo: 'x', resposta: x } },
      { texto: 'y = Dy ÷ D.', pede: { rotulo: 'y', resposta: y } },
    ],
    hints: ['Duas frases do enunciado, duas equações: uma de quantidade e uma de valor.', `x + y = ${tot}; ${p}x + ${q}y = ${val}. D = ${D}, Dx = ${Dx}, Dy = ${Dy}.`, `x = ${Dx}/${D} = ${x}; y = ${Dy}/${D} = ${y}.`],
    explain: `Sistema: x + y = ${tot} e ${p}x + ${q}y = ${val}. D = ${D}, Dx = ${Dx}, Dy = ${Dy}. **x = ${x}** e **y = ${y}**. Conferindo: ${x} + ${y} = ${tot} e ${p}·${x} + ${q}·${y} = ${val}.` };
};

export const GERADORES_M5: Record<string, Gerador> = { 'm5.vet': vetores, 'm5.ordem': ordemProduto, 'm5.prod': produtoMat, 'm5.det': determinante, 'm5.classe': classificaSistema, 'm5.sis': resolveSistema };
