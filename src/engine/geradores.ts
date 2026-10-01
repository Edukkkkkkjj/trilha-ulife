// Geradores de exercícios: cada chamada com uma semente diferente dá números diferentes,
// e a resposta é calculada pelo código (os testes conferem centenas de sementes).
import type { Ex } from './types';
import type { Rng } from '../lib/rng';
import { diff, inter, union } from '../lib/sets';
import { analisar, type Pair } from '../lib/functions';
import { GERADORES_M4 } from './geradores-m4';
import { anagramas, arranjo, comb, fat, frequencias } from '../lib/contagem';
import { classify, envs, evalAst, parse, show, subexprs, sumOfProducts, vars } from '../lib/logic';

export type Gerador = (r: Rng, nivel: number) => Ex;
const cj = (xs: (string | number)[]) => (xs.length ? `{${xs.join(', ')}}` : '∅');
const ord = (xs: string[]) => [...xs].sort((a, b) => Number(a) - Number(b));
let n = 0;
const id = (g: string) => `${g}#${Date.now().toString(36)}${(n++).toString(36)}`;

// ======================= M1 · Conjuntos e funções =======================

const opsConjuntos: Gerador = (r) => {
  const U = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const A = ord(r.sample(U, r.int(3, 5))), B = ord(r.sample(U, r.int(3, 5)));
  const op = r.pick(['∪', '∩', 'A−B', 'B−A', "A'"] as const);
  const U_ = union(A, B), I = inter(A, B), AB = diff(A, B), BA = diff(B, A), Ac = diff(U, A);
  const info = {
    '∪': { q: 'A ∪ B', a: U_, dica: 'União = está em pelo menos um dos dois.', como: `Junte tudo de A e de B, sem repetir: ${cj(ord(U_))}.` },
    '∩': { q: 'A ∩ B', a: I, dica: 'Interseção = está nos dois ao mesmo tempo.', como: `Fique só com o que aparece em A e também em B: ${cj(ord(I))}.` },
    'A−B': { q: 'A − B', a: AB, dica: 'Diferença A − B = está em A e NÃO está em B.', como: `Pegue A e risque o que também está em B: ${cj(ord(AB))}.` },
    'B−A': { q: 'B − A', a: BA, dica: 'Diferença B − A = está em B e NÃO está em A.', como: `Pegue B e risque o que também está em A: ${cj(ord(BA))}.` },
    "A'": { q: "A' (complemento de A)", a: Ac, dica: 'Complemento = tudo do universo U que não está em A.', como: `Percorra U e fique com quem não está em A: ${cj(ord(Ac))}.` },
  }[op];
  return {
    id: id('m1.ops'), kind: 'set', topic: 'm1.operacoes',
    prompt: `Universo $U = \\{1,\\dots,9\\}$, **A** = ${cj(A)} e **B** = ${cj(B)}.\n\nEscreva os elementos de **${info.q}** (separe por vírgula; se for vazio, deixe em branco e confira).`,
    answer: info.a,
    armadilhas: [
      { valor: I, causa: 'conceito', msg: 'Isso é a interseção (só quem está nos dois).' },
      { valor: U_, causa: 'conceito', msg: 'Isso é a união (quem está em pelo menos um).' },
      { valor: op === 'A−B' ? BA : AB, causa: 'leitura', msg: 'Você fez a diferença ao contrário. A − B não é igual a B − A: a ordem importa.' },
      { valor: op === "A'" ? diff(U, U_) : Ac, causa: 'conceito', msg: op === "A'" ? 'Você tirou também os elementos de B. O complemento de A só olha para A.' : 'Isso é o complemento de A, não o que foi pedido.' },
      { valor: A, causa: 'leitura', msg: 'Você devolveu o próprio A. Releia qual operação foi pedida.' },
    ],
    hints: [info.dica, `Vá elemento por elemento e pergunte: ele está em A? Está em B?`, info.como],
    explain: info.como,
  };
};

const CENAS_IE = [
  ['No ministério de louvor,', 'tocam violão', 'tocam teclado', 'tocam os dois', 'tocam pelo menos um dos dois instrumentos'],
  ['Numa pesquisa com usuários,', 'usam o app no celular', 'usam no computador', 'usam nos dois', 'usam pelo menos um dos dois'],
  ['Na turma de ADS,', 'estudam Python', 'estudam Java', 'estudam as duas linguagens', 'estudam pelo menos uma das duas'],
  ['Na loja,', 'clientes compraram em janeiro', 'compraram em fevereiro', 'compraram nos dois meses', 'compraram em pelo menos um dos meses'],
];

const incExc2: Gerador = (r, nivel) => {
  const x = r.int(2, 9), a = x + r.int(3, 20), b = x + r.int(3, 20);
  const [onde, fa, fb, fx, fu] = r.pick(CENAS_IE);
  const uniao = a + b - x;
  const tipo = nivel === 0 ? 'uniao' : r.pick(['uniao', 'soA', 'nenhum'] as const);
  const base = `${onde} **${a}** ${fa}, **${b}** ${fb} e **${x}** ${fx}.`;
  if (tipo === 'soA') {
    return {
      id: id('m1.ie2'), kind: 'num', topic: 'm1.inclusao-exclusao', prompt: `${base}\n\nQuantos estão **só** no primeiro grupo (e não no segundo)?`, answer: a - x,
      armadilhas: [{ valor: a, causa: 'leitura', msg: `${a} é o primeiro grupo inteiro; dentro dele há ${x} que também estão no segundo.` }, { valor: uniao, causa: 'leitura', msg: 'Isso é "pelo menos um". A pergunta é só o primeiro grupo.' }],
      hints: ['No diagrama de Venn, "só A" é a lua de A fora da interseção.', `Tire de ${a} os ${x} que também estão no outro grupo.`, `${a} − ${x} = ${a - x}.`], explain: `Só no primeiro: ${a} − ${x} = **${a - x}**.`,
    };
  }
  if (tipo === 'nenhum') {
    const total = uniao + r.int(2, 12);
    return {
      id: id('m1.ie2'), kind: 'num', topic: 'm1.inclusao-exclusao', prompt: `${base} Ao todo são **${total}** pessoas.\n\nQuantas não estão em **nenhum** dos dois grupos?`, answer: total - uniao,
      armadilhas: [{ valor: total - a - b, causa: 'conta', msg: `Você tirou ${a} + ${b} do total, mas os ${x} que estão nos dois foram tirados duas vezes.` }, { valor: uniao, causa: 'leitura', msg: 'Isso é quem está em pelo menos um. Falta tirar do total.' }],
      hints: ['Primeiro descubra quantos estão em pelo menos um grupo.', `Pelo menos um: ${a} + ${b} − ${x}. Depois tire isso do total.`, `${a} + ${b} − ${x} = ${uniao}; ${total} − ${uniao} = ${total - uniao}.`],
      explain: `Em pelo menos um: ${a} + ${b} − ${x} = ${uniao}. Em nenhum: ${total} − ${uniao} = **${total - uniao}**.`,
    };
  }
  return {
    id: id('m1.ie2'), kind: 'num', topic: 'm1.inclusao-exclusao', prompt: `${base}\n\nQuantos ${fu}?`, answer: uniao,
    armadilhas: [
      { valor: a + b, causa: 'conceito', msg: `Você somou ${a} + ${b} e esqueceu de tirar os ${x} que estão nos dois: eles foram contados duas vezes.` },
      { valor: a + b + x, causa: 'conceito', msg: `Os ${x} já estão dentro de cada grupo. Somar de novo conta três vezes; é para tirar uma.` },
      { valor: a + b - 2 * x, causa: 'conta', msg: `Você tirou os ${x} duas vezes. Isso dá quem está em exatamente um grupo; a pergunta é "pelo menos um".` },
    ],
    hints: ['Quem está nos dois grupos aparece nas duas contagens.', `Some os grupos e desconte uma vez quem foi contado em dobro: ${a} + ${b} − ?`, `${a} + ${b} − ${x} = ${uniao}.`],
    explain: `$|A \\cup B| = |A| + |B| - |A \\cap B|$: ${a} + ${b} − ${x} = **${uniao}**.`,
  };
};

const incExc3: Gerador = (r, nivel) => {
  const t = r.int(1, 4), sab = r.int(1, 5), sac = r.int(1, 5), sbc = r.int(1, 5), sa = r.int(2, 9), sb = r.int(2, 9), sc = r.int(2, 9);
  const a = sa + sab + sac + t, b = sb + sab + sbc + t, c = sc + sac + sbc + t, ab = sab + t, ac = sac + t, bc = sbc + t;
  const total = sa + sb + sc + sab + sac + sbc + t;
  return {
    id: id('m1.ie3'), kind: 'passos', topic: 'm1.inclusao-exclusao',
    prompt: `Clientes por categoria: **A** (eletrônicos) = ${a}, **B** (alimentos) = ${b}, **C** (vestuário) = ${c}. Em A e B: ${ab}. Em A e C: ${ac}. Em B e C: ${bc}. Nas três: ${t}.\n\nPreencha o diagrama **de dentro para fora** e ache quantos compraram em pelo menos uma categoria.`,
    ocultos: [1, 4, 7][Math.min(2, nivel)],
    passos: [
      { texto: `Centro (nas três): já veio no enunciado, ${t}.` },
      { texto: `Só em A e B (sem C): quem está em A∩B menos o centro, ${ab} − ${t}.`, pede: { rotulo: 'só A e B', resposta: sab } },
      { texto: `Só em A e C (sem B): ${ac} − ${t}.`, pede: { rotulo: 'só A e C', resposta: sac } },
      { texto: `Só em B e C (sem A): ${bc} − ${t}.`, pede: { rotulo: 'só B e C', resposta: sbc } },
      { texto: `Só em A: A inteiro menos os três pedaços que já estão dentro dele, ${a} − (${sab} + ${sac} + ${t}).`, pede: { rotulo: 'só A', resposta: sa } },
      { texto: `Só em B: ${b} − (${sab} + ${sbc} + ${t}).`, pede: { rotulo: 'só B', resposta: sb } },
      { texto: `Só em C: ${c} − (${sac} + ${sbc} + ${t}).`, pede: { rotulo: 'só C', resposta: sc } },
      { texto: `Total: some as sete regiões, ${sa} + ${sb} + ${sc} + ${sab} + ${sac} + ${sbc} + ${t}.`, pede: { rotulo: 'pelo menos uma', resposta: total } },
    ],
    hints: ['Comece sempre pela região do meio e vá para fora.', 'Cada "em A e B" do enunciado inclui quem está nas três. Tire o centro antes.', `Pela fórmula: ${a} + ${b} + ${c} − ${ab} − ${ac} − ${bc} + ${t} = ${total}.`],
    explain: `Conferindo pela fórmula: ${a} + ${b} + ${c} − ${ab} − ${ac} − ${bc} + ${t} = **${total}**. Dá o mesmo que somar as sete regiões.`,
  };
};

const partes: Gerador = (r) => {
  const k = r.int(2, 6), els = ['a', 'b', 'c', 'd', 'e', 'f'].slice(0, k);
  return {
    id: id('m1.partes'), kind: 'num', topic: 'm1.partes', prompt: `Seja A = ${cj(els)}. Quantos subconjuntos A tem (ou seja, quantos elementos tem o conjunto das partes $P(A)$)?`, answer: 2 ** k,
    armadilhas: [
      { valor: 2 * k, causa: 'conceito', msg: `2 × ${k} não: cada um dos ${k} elementos tem 2 opções (entra ou não entra), e as opções se multiplicam: 2·2·…·2.` },
      { valor: k * k, causa: 'conceito', msg: `Não é ${k}². É 2 elevado a ${k}: a base é 2 porque cada elemento entra ou não entra.` },
      { valor: 2 ** k - 1, causa: 'conceito', msg: 'Faltou um: o conjunto vazio ∅ também é subconjunto.' },
      { valor: 2 ** k - 2, causa: 'conceito', msg: 'Faltaram dois: o vazio ∅ e o próprio A também são subconjuntos.' },
    ],
    hints: ['Para montar um subconjunto, você decide elemento por elemento: entra ou não entra.', `São ${k} decisões de 2 opções cada.`, `2^${k} = ${2 ** k}.`], explain: `$|P(A)| = 2^n = 2^{${k}} = ${2 ** k}$. Isso inclui ∅ e o próprio A.`,
  };
};

const cartesiano: Gerador = (r) => {
  const m = r.int(2, 6), k = r.int(2, 7);
  const [x, y] = r.pick([['camisetas', 'cores'], ['produtos', 'canais de venda'], ['usuários', 'permissões'], ['servidores', 'portas']]);
  return {
    id: id('m1.cart'), kind: 'num', topic: 'm1.cartesiano', prompt: `A é um conjunto de **${m} ${x}** e B é um conjunto de **${k} ${y}**. Quantos pares ordenados tem o produto cartesiano $A \\times B$?`, answer: m * k,
    armadilhas: [{ valor: m + k, causa: 'conceito', msg: `Você somou. Cada um dos ${m} elementos de A forma par com TODOS os ${k} de B: é multiplicação.` }, { valor: 2 ** m, causa: 'conceito', msg: 'Isso é conjunto das partes. Produto cartesiano é a lista de pares (a, b).' }],
    hints: ['Um par é (um de A, um de B).', `Para cada elemento de A há ${k} pares possíveis.`, `${m} × ${k} = ${m * k}.`], explain: `$|A \\times B| = |A| \\cdot |B| = ${m} \\cdot ${k} = ${m * k}$.`,
  };
};

const composicao: Gerador = (r) => {
  const a = r.int(2, 4), b = r.int(-3, 5), c = r.int(1, 3), d = r.int(-4, 6), k = r.int(1, 4);
  const quad = r.bool(0.4);
  const f = (x: number) => a * x + b, g = (x: number) => (quad ? x * x : c * x + d);
  const sinal = (v: number) => (v === 0 ? '' : v > 0 ? ` + ${v}` : ` − ${-v}`);
  const fTxt = `f(x) = ${a}x${sinal(b)}`, gTxt = quad ? 'g(x) = x^2' : `g(x) = ${c === 1 ? '' : c}x${sinal(d)}`;
  const gf = r.bool();
  const certo = gf ? g(f(k)) : f(g(k)), trocado = gf ? f(g(k)) : g(f(k));
  const nome = gf ? 'g∘f' : 'f∘g', pri = gf ? 'f' : 'g', seg = gf ? 'g' : 'f';
  const meio = gf ? f(k) : g(k);
  return {
    id: id('m1.comp'), kind: 'num', topic: 'm1.composicao', prompt: `Sejam $${fTxt}$ e $${gTxt}$. Calcule $(${gf ? 'g \\circ f' : 'f \\circ g'})(${k})$.`, answer: certo,
    armadilhas: [
      { valor: trocado, causa: 'conceito', msg: `Você aplicou ${seg} primeiro. Em ${nome}, quem age primeiro é a função da direita: ${pri}.` },
      { valor: f(k) * g(k), causa: 'conceito', msg: 'Você multiplicou f(k) por g(k). Compor é encaixar: o resultado de uma vira a entrada da outra.' },
      { valor: meio, causa: 'conta', msg: `Você parou no meio: ${meio} é só ${pri}(${k}). Falta aplicar ${seg} nesse resultado.` },
    ],
    hints: [`${nome} significa: primeiro ${pri}, depois ${seg}.`, `Calcule ${pri}(${k}) e guarde o resultado.`, `${pri}(${k}) = ${meio}; depois ${seg}(${meio}) = ${certo}.`],
    explain: `(${nome})(${k}) = ${seg}(${pri}(${k})) = ${seg}(${meio}) = **${certo}**.${trocado !== certo ? ` Na ordem contrária daria ${trocado}: composição não é comutativa.` : ''}`,
  };
};

export const CATEGORIAS_FN = ['não é função', 'função, mas nem injetora nem sobrejetora', 'injetora (não sobrejetora)', 'sobrejetora (não injetora)', 'bijetora'];
export function categoriaFn(A: string[], B: string[], f: Pair[]): number {
  const x = analisar(A, B, f);
  return !x.isFunction ? 0 : x.bijetora ? 4 : x.injetora ? 2 : x.sobrejetora ? 3 : 1;
}

const classificarFuncao: Gerador = (r) => {
  const alvo = r.int(0, 4);
  const na = alvo === 3 ? 4 : 3, nb = alvo === 2 ? 4 : 3;
  const A = ['1', '2', '3', '4'].slice(0, na), B = r.shuffle(['a', 'b', 'c', 'd'].slice(0, nb));
  let f: Pair[];
  if (alvo === 4 || alvo === 2) f = A.map((a, i) => [a, B[i]]);
  else if (alvo === 3) f = A.map((a, i) => [a, B[i % nb]]);
  else if (alvo === 1) f = [[A[0], B[0]], [A[1], B[0]], [A[2], B[1]]];
  else { f = A.map((a, i) => [a, B[i]] as Pair); if (r.bool()) f = f.slice(1); else f.push([A[0], B[1]]); }
  f = r.shuffle(f).sort((p, q) => p[0].localeCompare(q[0]));
  const x = analisar(A, B, f);
  const porque = !x.isFunction ? (x.semImagem.length ? `O elemento ${x.semImagem[0]} do domínio ficou sem saída.` : `O elemento ${x.comVarias[0]} tem duas saídas.`)
    : `${x.colisoes.length ? `Há colisão em ${x.colisoes[0]} (duas entradas, mesma saída), então não é injetora.` : 'Não há colisão: é injetora.'} ${x.naoAtingidos.length ? `Ninguém chega em ${x.naoAtingidos[0]}, então não é sobrejetora.` : 'Todo o contradomínio é atingido: é sobrejetora.'}`;
  return {
    id: id('m1.classf'), kind: 'mcq', fixo: true, topic: 'm1.funcoes', options: CATEGORIAS_FN, correct: categoriaFn(A, B, f),
    prompt: `Domínio A = ${cj(A)}, contradomínio B = ${cj([...B].sort())}.\n\nSetas: **${f.map((p) => `${p[0]} → ${p[1]}`).join(',  ')}**\n\nComo se classifica?`,
    hints: ['Primeiro teste se é função: cada elemento de A tem exatamente uma seta?', 'Depois: alguma saída recebe duas setas (colisão)? Alguma saída ficou sem seta?', porque], explain: porque,
  };
};

const POOL_VENN: [2 | 3, string, string][] = [
  [3, '(B∩C)−A', 'em B e em C, mas não em A'], [3, 'A−(B∪C)', 'apenas em A'], [3, '(A∪B)−C', 'em A ou em B, mas não em C'], [3, 'A∩B∩C', 'nos três'],
  [3, '(A∩B)∪C', 'em A e B ao mesmo tempo, ou em C'], [3, "(A∪B∪C)'", 'em nenhum dos três'], [3, 'A∩(B∪C)', 'em A e em pelo menos um dos outros'], [3, '(A∩B)−C', 'em A e B, mas não em C'],
  [2, 'A−B', 'em A e não em B'], [2, "A'∩B", 'fora de A e dentro de B'], [2, "(A∪B)'", 'em nenhum dos dois'], [2, "(A∩B)'", 'tudo, menos quem está nos dois'], [3, 'C−(A∩B)', 'em C, menos quem está em A e B ao mesmo tempo'],
];
const pintarVenn: Gerador = (r) => {
  const [k, alvo, fala] = r.pick(POOL_VENN);
  return {
    id: id('m1.venn'), kind: 'venn', topic: 'm1.venn', n: k, target: alvo, prompt: `Toque nas regiões para pintar **${alvo.replace(/([∪∩−])/g, ' $1 ')}**.`,
    hints: ['Resolva primeiro o que está dentro dos parênteses.', `Em palavras: ${fala}.`, 'Passe região por região e pergunte: ela obedece à frase? Se sim, pinte.'], explain: `${alvo}: ${fala}.`,
  };
};

// ======================= M2 · Lógica e álgebra booleana =======================

const FRASES: [string, 0 | 1, string][] = [
  ['3 é um número ímpar.', 0, 'É declarativa e tem valor: verdadeira.'], ['O Rio Amazonas fica na Europa.', 0, 'É declarativa e tem valor: falsa. Falsa também é proposição.'],
  ['Abra a porta.', 1, 'É uma ordem; ordens não são verdadeiras nem falsas.'], ['Lave o carro agora!', 1, 'Imperativa: não tem valor lógico.'],
  ['x + 2 = 4', 1, 'Sentença aberta: só vira proposição quando se diz quanto vale x.'], ['O servidor está online.', 0, 'Afirma um fato que é verdadeiro ou falso.'],
  ['Que horas são?', 1, 'Pergunta não tem valor lógico.'], ['2 + 2 = 5', 0, 'Falsa, mas é proposição: tem valor definido.'],
  ['Tomara que o deploy funcione.', 1, 'Desejo: não é declarativa.'], ['Todo programador sabe lógica.', 0, 'Declarativa; pode ser julgada verdadeira ou falsa.'],
  ['O sistema está ligado.', 0, 'Declarativa com valor definido.'], ['Faça o backup hoje.', 1, 'Ordem.'], ['Esta senha tem 8 caracteres.', 0, 'Declarativa: dá para verificar.'], ['Uau, que rede rápida!', 1, 'Exclamação: expressa emoção, não afirma algo julgável.'],
];
const proposicao: Gerador = (r) => ({
  id: id('m2.prop'), kind: 'classificar', topic: 'm2.proposicoes', prompt: 'É proposição? Lembre: proposição é frase **declarativa** que só pode ser verdadeira ou falsa.', categorias: ['é proposição', 'não é'],
  itens: r.sample(FRASES, 5).map(([texto, cat, porque]) => ({ texto, cat, porque })),
  hints: ['Pergunte: faz sentido responder "isso é verdade" ou "isso é mentira"?', 'Ordens, perguntas, desejos e exclamações ficam de fora.', 'Frase com variável solta (x + 2 = 4) também fica de fora até dizerem o valor de x.'],
  explain: 'Proposição = declarativa + valor lógico único (V ou F). Ser falsa não impede de ser proposição.',
});

const conectivo: Gerador = (r) => {
  const op = r.pick([['→', 'p → q'], ['→', 'p → q'], ['∧', 'p ∧ q'], ['∨', 'p ∨ q'], ['↔', 'p ↔ q'], ['→', 'q → p']] as const);
  const p = r.bool(), q = r.bool();
  const v = evalAst(parse(op[1]), { p, q });
  const VF = (b: boolean) => (b ? 'V' : 'F');
  const regra: Record<string, string> = { '→': 'A condicional só é falsa quando o antecedente (o lado de onde sai a seta) é V e o consequente é F.', '∧': 'O "e" só é V quando os dois são V.', '∨': 'O "ou" só é F quando os dois são F.', '↔': 'O bicondicional é V quando os dois lados têm o mesmo valor.' };
  return {
    id: id('m2.cond'), kind: 'mcq', fixo: true, topic: op[0] === '→' ? 'm2.condicional' : 'm2.conectivos', options: ['V (verdadeiro)', 'F (falso)'], correct: v ? 0 : 1,
    prompt: `Se **p é ${VF(p)}** e **q é ${VF(q)}**, qual é o valor de $${op[1].replace('→', '\\to').replace('∧', '\\land').replace('∨', '\\lor').replace('↔', '\\leftrightarrow')}$?`,
    porOpcao: [regra[op[0]], regra[op[0]]],
    hints: [regra[op[0]], op[0] === '→' ? 'Pense numa promessa: "se chover, levo guarda-chuva". Ela só é quebrada se chover e eu não levar.' : 'Olhe os dois valores e aplique a regra.', `Aqui: ${op[1]} com p = ${VF(p)}, q = ${VF(q)} dá ${VF(v)}.`],
    explain: `${regra[op[0]]} Com p = ${VF(p)} e q = ${VF(q)}: **${VF(v)}**.`,
  };
};

const linhas: Gerador = (r) => {
  const k = r.int(2, 6);
  return {
    id: id('m2.linhas'), kind: 'num', topic: 'm2.tabela', prompt: `Uma expressão tem **${k} proposições simples** diferentes. Quantas linhas tem a tabela-verdade?`, answer: 2 ** k,
    armadilhas: [{ valor: 2 * k, causa: 'conceito', msg: `Não é 2 × ${k}. Cada proposição dobra o número de linhas: 2·2·…·2 (${k} vezes).` }, { valor: k * k, causa: 'conceito', msg: `Não é ${k}². A base é 2 (V ou F) e o expoente é a quantidade de proposições.` }],
    hints: ['Com 1 proposição há 2 linhas (V, F). Cada nova proposição dobra.', `2 elevado a ${k}.`, `2^${k} = ${2 ** k}.`], explain: `$2^{${k}} = ${2 ** k}$ linhas: cada proposição pode ser V ou F, e as possibilidades se multiplicam.`,
  };
};

const POOL_TAB = [
  ['p ∧ ¬q', '¬p ∨ q', '¬(p ∨ ¬q)', 'p → ¬q', '(p ∨ q) ∧ ¬p', '¬p ↔ q', '¬(p ∧ q)', '(p → q) ∧ p'],
  ['p ∨ (q ∧ r)', '(p ∧ q) → r', '(p → q) ∧ ¬r', '¬(p ∧ q) ∨ r', '(p ∨ q) ∧ ¬r', 'p ∧ (q ∨ r)'],
];
const tabela: Gerador = (r, nivel) => {
  const expr = r.pick(POOL_TAB[nivel >= 2 ? 1 : 0]);
  const ast = parse(expr), vs = vars(ast), subs = subexprs(ast);
  return {
    id: id('m2.tabela'), kind: 'tabela', topic: 'm2.tabela', expr, ordem: 'desc', notacao: 'logica',
    prompt: `Monte a tabela-verdade de **${expr}**. Toque em cada célula para alternar entre V e F. Preencha uma coluna de cada vez, da esquerda para a direita.`,
    hints: [`São ${vs.length} proposições, então ${2 ** vs.length} linhas. Comece pela coluna mais simples: ${show(subs[0])}.`, 'Cada coluna só depende das que estão à esquerda dela. Não pule para a última.', `Primeira coluna (${show(subs[0])}): ${envs(vs, 'desc').map((e) => (evalAst(subs[0], e) ? 'V' : 'F')).join(', ')}.`],
    explain: `Coluna final de ${expr}: ${envs(vs, 'desc').map((e) => (evalAst(ast, e) ? 'V' : 'F')).join(', ')}. É uma ${classify(ast)}.`,
  };
};

const POOL_CLASSE = ['p ∨ ¬p', 'p ∧ ¬p', '(p ∧ (p → q)) → q', 'p → (p ∨ q)', '(p ∧ q) → p', 'p → q', '(p ∨ q) ∧ ¬p ∧ ¬q', '¬(p ∧ q) ↔ (¬p ∨ ¬q)', 'p ↔ ¬p', '(p → q) ↔ (¬q → ¬p)', 'p ∧ (q ∨ ¬q)', 'p ∨ q', '(p → q) ∧ (p ∧ ¬q)'];
const classe: Gerador = (r) => {
  const expr = r.pick(POOL_CLASSE), ast = parse(expr), c = classify(ast), vs = vars(ast);
  const col = envs(vs, 'desc').map((e) => (evalAst(ast, e) ? 'V' : 'F')).join(', ');
  return {
    id: id('m2.classe'), kind: 'mcq', fixo: true, topic: 'm2.tautologia', options: ['tautologia (sempre V)', 'contradição (sempre F)', 'contingência (depende)'], correct: ['tautologia', 'contradição', 'contingência'].indexOf(c),
    prompt: `Classifique **${expr}**. (Monte a tabela no papel ou de cabeça antes de responder.)`,
    hints: ['Olhe só a última coluna da tabela-verdade.', 'Só V → tautologia. Só F → contradição. Misturado → contingência.', `Última coluna: ${col}.`], explain: `Última coluna: ${col}. Portanto é **${c}**.`,
  };
};

export const POOL_EQUIV: { x: string; certa: string; erradas: string[]; porque: string; errou: string }[] = [
  { x: '¬(p ∧ q)', certa: '¬p ∨ ¬q', erradas: ['¬p ∧ ¬q', 'p ∨ q', '¬p ∨ q'], porque: 'De Morgan: nega cada parte E troca o conectivo (∧ vira ∨).', errou: 'Negar um "e" não dá outro "e": o conectivo troca.' },
  { x: '¬(p ∨ q)', certa: '¬p ∧ ¬q', erradas: ['¬p ∨ ¬q', 'p ∧ q', '¬(p ∧ q)'], porque: 'De Morgan: nega cada parte E troca o conectivo (∨ vira ∧).', errou: 'Negar um "ou" não dá outro "ou": o conectivo troca.' },
  { x: 'p → q', certa: '¬p ∨ q', erradas: ['p ∨ ¬q', '¬p → ¬q', 'q → p'], porque: 'p → q só é falsa em V→F; ¬p ∨ q também só é falsa quando p é V e q é F.', errou: 'q → p (recíproca) e ¬p → ¬q (inversa) NÃO são equivalentes a p → q.' },
  { x: 'p → q', certa: '¬q → ¬p', erradas: ['q → p', '¬p → ¬q', 'p ∧ ¬q'], porque: 'Contrapositiva: inverte os lados e nega os dois. É sempre equivalente à original.', errou: 'Só inverter (recíproca) ou só negar (inversa) muda o significado. Precisa das duas coisas.' },
  { x: '¬(p → q)', certa: 'p ∧ ¬q', erradas: ['¬p → ¬q', '¬p ∧ q', 'p → ¬q'], porque: 'p → q só falha em "p verdadeiro e q falso". Negar a condicional é afirmar exatamente esse caso.', errou: 'A negação de "se p então q" não é outra condicional: é "p aconteceu e q não".' },
  { x: 'p ↔ q', certa: '(p → q) ∧ (q → p)', erradas: ['p → q', 'p ∨ q', '¬p ↔ q'], porque: '"Se e somente se" é a condicional valendo nos dois sentidos.', errou: 'Um sentido só (p → q) não basta para o bicondicional.' },
];
const equivalencia: Gerador = (r) => {
  const it = r.pick(POOL_EQUIV);
  const opts = r.shuffle([it.certa, ...it.erradas]);
  return {
    id: id('m2.equiv'), kind: 'mcq', fixo: true, topic: 'm2.equivalencias', options: opts, correct: opts.indexOf(it.certa), porOpcao: opts.map((o) => (o === it.certa ? undefined : it.errou)),
    prompt: `Qual expressão é **equivalente** a **${it.x}** (mesma coluna final na tabela-verdade)?`,
    hints: ['Equivalentes = mesmo resultado em todas as linhas.', 'Teste a linha p = V, q = F em cada alternativa e compare com a original.', it.porque], explain: `${it.x} ≡ ${it.certa}. ${it.porque}`,
  };
};

const POOL_BOOL = ['A + B·C', "A·B + C'", '(A + B)·C', "A' + B·C", "A·(B + C')", "A·B' + A'·B", "A + B·C'", "(A + B')·C", "A'·B + C", 'A·B + B·C'];
const valorBooleano: Gerador = (r) => {
  const expr = r.pick(POOL_BOOL), ast = parse(expr);
  const env = { A: r.bool(), B: r.bool(), C: r.bool() };
  const v = evalAst(ast, env);
  const passos = subexprs(ast).map((s) => `${show(s, 'bool')} = ${evalAst(s, env) ? 1 : 0}`).join('; ');
  return {
    id: id('m2.bool'), kind: 'mcq', fixo: true, topic: 'm2.precedencia', options: ['0', '1'], correct: v ? 1 : 0,
    prompt: `Com **A = ${env.A ? 1 : 0}**, **B = ${env.B ? 1 : 0}**, **C = ${env.C ? 1 : 0}**, quanto vale **S = ${expr}**?`,
    porOpcao: ['Refaça na ordem: primeiro os complementos (\'), depois os produtos (·), por último as somas (+).', 'Refaça na ordem: primeiro os complementos (\'), depois os produtos (·), por último as somas (+).'],
    hints: ["Ordem: parênteses, depois ' (NÃO), depois · (E), depois + (OU).", 'Lembre: na álgebra booleana 1 + 1 = 1.', passos], explain: `${passos}. Logo S = **${v ? 1 : 0}**.`,
  };
};

export const POOL_SIMPL: { e: string; alvo: string; lits: number; passos: string }[] = [
  { e: "A·B + A·B'", alvo: 'A', lits: 1, passos: "Evidência: A·(B + B') = A·1 = A." },
  { e: 'A + A·B', alvo: 'A', lits: 1, passos: 'Absorção: A·(1 + B) = A·1 = A.' },
  { e: 'A·(A + B)', alvo: 'A', lits: 1, passos: 'Distribui: A·A + A·B = A + A·B = A (absorção).' },
  { e: "A·B + A'·B", alvo: 'B', lits: 1, passos: "Evidência: B·(A + A') = B·1 = B." },
  { e: "(A + B)·(A + B')", alvo: 'A', lits: 1, passos: "Distributiva \"estranha\" ao contrário: A + B·B' = A + 0 = A." },
  { e: "A + A'·B", alvo: 'A + B', lits: 2, passos: "Distributiva \"estranha\": (A + A')·(A + B) = 1·(A + B) = A + B." },
  { e: "X + X·Y + X'·Y", alvo: 'X + Y', lits: 2, passos: "X + X·Y = X (absorção). Fica X + X'·Y = (X + X')·(X + Y) = X + Y." },
  { e: "A·B + A·B' + A'·B", alvo: 'A + B', lits: 2, passos: "A·B + A·B' = A. Fica A + A'·B = A + B." },
  { e: "A·B·C + A·B·C'", alvo: 'A·B', lits: 2, passos: "Evidência: A·B·(C + C') = A·B·1 = A·B." },
  { e: "A·B + A·B'·C + A·B'·C'", alvo: 'A', lits: 1, passos: "A·B'·C + A·B'·C' = A·B'. Fica A·B + A·B' = A." },
];
const simplificar: Gerador = (r) => {
  const it = r.pick(POOL_SIMPL);
  return {
    id: id('m2.simpl'), kind: 'expr', topic: 'm2.simplificacao', target: it.alvo, maxLits: it.lits,
    prompt: `Simplifique **S = ${it.e}** e escreva a expressão mais curta que conseguir. (Use ' para negação, · ou nada para E, + para OU.)`,
    armadilhas: [{ valor: it.e, causa: 'leitura', msg: 'Você repetiu a expressão original. Ela está certa, mas a ideia é enxugar.' }],
    hints: ['Procure um fator comum para pôr em evidência, ou um par x + x\'.', "Leis que mais resolvem: x + x' = 1, x·1 = x, x + x·y = x.", it.passos], explain: `${it.passos} Resposta: **S = ${it.alvo}**.`,
  };
};

const somaDeProdutos: Gerador = (r, nivel) => {
  const vs = nivel === 0 ? ['A', 'B'] : ['A', 'B', 'C'];
  const todas = envs(vs), uns = r.sample(todas, nivel === 0 ? r.int(1, 2) : r.int(2, 3)).sort((a, b) => todas.indexOf(a) - todas.indexOf(b));
  const alvo = sumOfProducts(vs, uns);
  const lin = (e: Record<string, boolean>) => `(${vs.map((v) => (e[v] ? 1 : 0)).join(', ')})`;
  return {
    id: id('m2.sop'), kind: 'expr', topic: 'm2.sop', target: alvo,
    prompt: `Uma função S de (${vs.join(', ')}) vale **1** apenas nas linhas ${uns.map(lin).join(' e ')}, e 0 nas outras.\n\nEscreva S como **soma de produtos**.`,
    hints: ['Cada linha com saída 1 vira um produto (um termo com ·).', "Dentro do termo: variável que vale 1 entra normal; variável que vale 0 entra negada (').", `Primeiro termo: ${alvo.split(' + ')[0]}.`],
    explain: `Um termo por linha com saída 1, somados: **S = ${alvo}**. (Qualquer expressão equivalente é aceita.)`,
  };
};

// ======================= M3 · Contagem =======================

const CENAS_PFC: [string, [string, number, number][]][] = [
  ['Uma lanchonete monta combos com', [['tipos de pão', 2, 4], ['recheios', 3, 6], ['bebidas', 2, 5]]],
  ['Uma campanha de marketing escolhe', [['produtos', 3, 6], ['canais de divulgação', 2, 5], ['tipos de oferta', 2, 4]]],
  ['Um sistema gera códigos com', [['letras possíveis na 1ª posição', 3, 8], ['dígitos possíveis na 2ª posição', 2, 10]]],
  ['Para se vestir, alguém tem', [['camisetas', 3, 7], ['calças', 2, 4], ['pares de tênis', 2, 3]]],
  ['A equipe de louvor escolhe, para o culto,', [['músicas de abertura', 2, 5], ['músicas de adoração', 3, 6]]],
];
const CENAS_ADIT: [string, string, string][] = [
  ['Para ir ao trabalho, a pessoa pode pegar', 'linhas de ônibus', 'linhas de metrô'],
  ['O estudante vai se inscrever em UM curso e pode escolher entre', 'cursos de matemática', 'cursos de programação'],
  ['A biblioteca empresta UM livro por vez e tem', 'livros de física', 'livros de química'],
  ['O cliente vai levar UMA sobremesa e pode escolher entre', 'sabores de sorvete', 'tipos de torta'],
];
const principios: Gerador = (r, nivel) => {
  if (nivel > 0 && r.bool(0.4)) {
    const [ini, a, b] = r.pick(CENAS_ADIT), x = r.int(2, 9), y = r.int(2, 9);
    return {
      id: id('m3.princ'), kind: 'num', topic: 'm3.principios', answer: x + y,
      prompt: `${ini} **${x}** ${a} **ou** **${y}** ${b}.\n\nDe quantas maneiras a escolha pode ser feita?`,
      armadilhas: [{ valor: x * y, causa: 'conceito', msg: 'Você multiplicou. Aqui a escolha é de UMA coisa só, de um grupo OU do outro: os casos se excluem, então se somam.' }],
      hints: ['A pessoa escolhe as duas coisas juntas (E) ou só uma delas (OU)?', 'OU, com casos que não se misturam: princípio aditivo.', `${x} + ${y} = ${x + y}.`],
      explain: `É uma escolha só, de um grupo **ou** do outro: princípio aditivo. ${x} + ${y} = **${x + y}**.`,
    };
  }
  const [ini, etapas0] = r.pick(CENAS_PFC);
  const etapas = etapas0.map(([nome, lo, hi]) => ({ nome, n: r.int(lo, hi) }));
  const prod = etapas.reduce((t, e) => t * e.n, 1), soma = etapas.reduce((t, e) => t + e.n, 0);
  const lista = etapas.map((e) => `**${e.n}** ${e.nome}`).join(etapas.length === 2 ? ' e ' : ', ').replace(/, ([^,]*)$/, ' e $1');
  return {
    id: id('m3.princ'), kind: 'num', topic: 'm3.principios', answer: prod,
    prompt: `${ini} ${lista}, escolhendo **uma opção de cada**.\n\nQuantos resultados diferentes são possíveis?`,
    armadilhas: soma !== prod ? [{ valor: soma, causa: 'conceito', msg: 'Você somou. A escolha é de uma opção de CADA etapa (uma E outra): para cada opção da primeira, existem todas as da segunda. Multiplica.' }] : [],
    hints: ['São decisões em sequência: uma de cada grupo.', 'Para cada opção da 1ª etapa, existem todas as da 2ª: princípio multiplicativo.', `${etapas.map((e) => e.n).join(' × ')} = ${prod}.`],
    explain: `Princípio multiplicativo (PFC): ${etapas.map((e) => e.n).join(' × ')} = **${prod}**.`,
  };
};

const fatorial: Gerador = (r, nivel) => {
  if (nivel === 0) {
    const k = r.int(4, 6);
    return { id: id('m3.fat'), kind: 'num', topic: 'm3.fatorial', answer: fat(k), prompt: `Quanto é $${k}!$ ?`,
      armadilhas: [{ valor: k * (k + 1) / 2, causa: 'conceito', msg: 'Você somou de 1 até n. Fatorial é o PRODUTO.' }, { valor: k * k, causa: 'conceito', msg: `Não é ${k} × ${k}. É ${k} × ${k - 1} × … × 1.` }],
      hints: ['Fatorial multiplica o número por todos os menores que ele, até o 1.', `${Array.from({ length: k }, (_, i) => k - i).join(' × ')}.`, `${k}! = ${fat(k)}.`], explain: `$${k}! = ${Array.from({ length: k }, (_, i) => k - i).join(' \\cdot ')} = ${fat(k)}$.` };
  }
  const nn = r.int(5, 10), corta = r.int(1, 3), resto = nn - corta;
  const fatores = Array.from({ length: corta }, (_, i) => nn - i), resp = fatores.reduce((a, b) => a * b, 1);
  return { id: id('m3.fat'), kind: 'num', topic: 'm3.fatorial', answer: resp, prompt: `Simplifique sem calcular os fatoriais inteiros: quanto é $\\dfrac{${nn}!}{${resto}!}$ ?`,
    armadilhas: [{ valor: nn / resto, causa: 'conceito', msg: 'Não dá para "cortar o !" e dividir os números. Abra o fatorial de cima até aparecer o de baixo.' }, { valor: fat(corta), causa: 'conceito', msg: `Você fez (${nn} − ${resto})!. Fatorial não se subtrai assim: abra ${nn}! até chegar em ${resto}!.` }],
    hints: [`Escreva ${nn}! como ${nn} × ${nn - 1} × … e pare quando chegar em ${resto}!.`, `${nn}! = ${fatores.join(' × ')} × ${resto}!. O ${resto}! de cima cancela com o de baixo.`, `${fatores.join(' × ')} = ${resp}.`],
    explain: `$${nn}! = ${fatores.join(' \\cdot ')} \\cdot ${resto}!$. Cancelando o $${resto}!$: ${fatores.join(' × ')} = **${resp}**.` };
};

const PALAVRAS = ['LIVRO', 'PORTA', 'AMOR', 'REDE', 'CASA', 'DADOS', 'ARARA', 'BANANA', 'MOUSE', 'BATATA', 'TECLA', 'ARARAS', 'SENHA', 'CHAVE', 'OVO', 'NUVEM', 'BYTE', 'MAMÃE', 'LOGICA', 'DADO'];
const anagrama: Gerador = (r, nivel) => {
  const pool = nivel === 0 ? PALAVRAS.filter((p) => anagramas(p) === fat(p.length)) : PALAVRAS.filter((p) => anagramas(p) !== fat(p.length));
  const p = r.pick(pool), n = [...p].length, reps = Object.entries(frequencias(p)).filter(([, k]) => k > 1), resp = anagramas(p);
  const den = reps.map(([, k]) => `${k}!`).join(' × ');
  return {
    id: id('m3.anag'), kind: 'num', topic: 'm3.permutacao', answer: resp,
    prompt: `Quantos anagramas (ordens diferentes de todas as letras) tem a palavra **${p}**?`,
    armadilhas: reps.length ? [{ valor: fat(n), causa: 'leitura', msg: `${n}! contaria como diferentes palavras que são iguais. Há letra repetida: ${reps.map(([l, k]) => `${l} (${k} vezes)`).join(', ')}.` }] : [{ valor: n, causa: 'conceito', msg: 'Isso é o número de letras. A pergunta é em quantas ordens elas podem ficar.' }],
    hints: ['Primeiro: quantas letras? Alguma se repete?', reps.length ? `${n} letras, com repetição: ${reps.map(([l, k]) => `${l} aparece ${k} vezes`).join(', ')}. Use n! dividido pelos fatoriais das repetições.` : `${n} letras, todas diferentes: permutação simples, ${n}!.`, reps.length ? `${n}! ÷ (${den}) = ${fat(n)} ÷ ${fat(n) / resp} = ${resp}.` : `${n}! = ${resp}.`],
    explain: reps.length ? `${n} letras com repetição (${reps.map(([l, k]) => `${l}: ${k}`).join(', ')}): ${n}! ÷ (${den}) = ${fat(n)} ÷ ${fat(n) / resp} = **${resp}**.` : `${n} letras distintas: ${n}! = **${resp}**.`,
  };
};

const CENAS_ORDEM: { txt: (n: number, p: number) => string; ordem: boolean; porque: string }[] = [
  { txt: (n, p) => `Numa corrida com **${n}** atletas, de quantas formas podem ser ocupados os **${p}** primeiros lugares?`, ordem: true, porque: 'Trocar quem ficou em 1º com quem ficou em 2º muda o resultado: a ordem importa.' },
  { txt: (n, p) => `De um grupo de **${n}** pessoas, quantas comissões de **${p}** membros (todos com a mesma função) podem ser formadas?`, ordem: false, porque: 'Uma comissão com as mesmas pessoas é a mesma comissão, não importa quem foi escolhido primeiro.' },
  { txt: (n, p) => `Uma senha usa **${p}** símbolos diferentes, escolhidos entre **${n}** símbolos, sem repetir. Quantas senhas existem?`, ordem: true, porque: 'AB e BA são senhas diferentes: a ordem importa.' },
  { txt: (n, p) => `Uma pizzaria tem **${n}** sabores. De quantas formas dá para escolher **${p}** sabores diferentes para um pedido?`, ordem: false, porque: 'Mussarela e calabresa é o mesmo pedido que calabresa e mussarela.' },
  { txt: (n, p) => `Há **${n}** livros diferentes e uma prateleira onde cabem **${p}**. De quantas formas a prateleira pode ser arrumada?`, ordem: true, porque: 'Mudar a posição dos livros dá outra arrumação: a ordem importa.' },
  { txt: (n, p) => `Um técnico tem **${n}** atacantes e precisa escolher **${p}** para começar a partida. De quantas formas?`, ordem: false, porque: 'Escolher Ana e Bia é o mesmo que escolher Bia e Ana.' },
  { txt: (n, p) => `Entre **${n}** servidores, **${p}** serão escolhidos para manutenção nesta noite. Quantos grupos são possíveis?`, ordem: false, porque: 'O grupo é o mesmo, seja qual for a ordem em que os servidores foram citados.' },
  { txt: (n, p) => `Entre **${n}** candidatos, serão eleitos presidente, vice e assim por diante, num total de **${p}** cargos diferentes. De quantas formas?`, ordem: true, porque: 'Cargos diferentes: trocar duas pessoas de cargo muda o resultado.' },
];
const arranjoOuComb: Gerador = (r, nivel) => {
  const c = r.pick(CENAS_ORDEM), n = r.int(5, 9), p = r.int(2, Math.min(4, n - 2));
  const A = arranjo(n, p), C = comb(n, p), resp = c.ordem ? A : C;
  const fatores = Array.from({ length: p }, (_, i) => n - i);
  const passos = [
    { texto: `A pergunta que decide: se eu trocar a ordem dos escolhidos, o resultado muda? ${c.porque} ${c.ordem ? 'É **arranjo**.' : 'É **combinação**.'}` },
    { texto: `Conte primeiro como se a ordem importasse: ${fatores.join(' × ')} (${p} fatores, começando em ${n} e descendo).`, pede: { rotulo: `A(${n}, ${p})`, resposta: A } },
    ...(c.ordem ? [] : [
      { texto: `Cada grupo de ${p} foi contado em todas as suas ordens. Quantas ordens tem um grupo de ${p}? É ${p}!.`, pede: { rotulo: `${p}!`, resposta: fat(p) } },
      { texto: `Divida para ficar com um de cada: ${A} ÷ ${fat(p)}.`, pede: { rotulo: `C(${n}, ${p})`, resposta: C } },
    ]),
  ];
  const pedidos = passos.filter((x) => 'pede' in x).length;
  return {
    id: id('m3.ac'), kind: 'passos', topic: c.ordem ? 'm3.arranjo' : 'm3.combinacao', prompt: c.txt(n, p), passos,
    ocultos: nivel === 0 ? 1 : pedidos,
    hints: ['Pergunte: trocar a ordem muda o resultado? Se sim, arranjo. Se não, combinação.', c.ordem ? `Arranjo: ${fatores.join(' × ')}.` : `Combinação: (${fatores.join(' × ')}) ÷ ${p}!.`, `Resposta: ${resp}.`],
    explain: c.ordem ? `${c.porque} Arranjo: $A(${n},${p}) = \\dfrac{${n}!}{${n - p}!}$ = ${fatores.join(' × ')} = **${A}**.` : `${c.porque} Combinação: $C(${n},${p}) = \\dfrac{${n}!}{${p}!\\,${n - p}!}$ = ${A} ÷ ${fat(p)} = **${C}**.`,
  };
};

const qualTecnica: Gerador = (r) => {
  const itens: [string, number, string][] = r.shuffle([
    ['Definir 1º, 2º e 3º lugares entre 10 atletas', 0, 'Escolhe alguns e a ordem importa: arranjo.'],
    ['Escolher 3 sabores de pizza entre 8', 1, 'Escolhe alguns e a ordem não importa: combinação.'],
    ['Colocar 6 pessoas em fila para uma foto', 2, 'Usa TODOS os elementos e a ordem importa: permutação.'],
    ['Formar uma comissão de 4 entre 12 funcionários', 1, 'Mesmo grupo em qualquer ordem: combinação.'],
    ['Contar os anagramas da palavra LIVRO', 2, 'Todas as letras, em ordens diferentes: permutação.'],
    ['Montar uma senha de 4 letras diferentes entre 26', 0, 'Escolhe 4 de 26 e a ordem importa: arranjo.'],
    ['Sortear 6 dezenas entre 60 (Mega-Sena)', 1, 'O jogo é o mesmo em qualquer ordem: combinação.'],
    ['Definir a ordem de execução de 5 processos, todos eles', 2, 'Ordena todos: permutação.'],
    ['Eleger presidente e vice entre 9 candidatos', 0, 'Cargos diferentes: a ordem importa. Arranjo.'],
  ] as [string, number, string][]).slice(0, 5);
  return {
    id: id('m3.qual'), kind: 'classificar', topic: 'm3.escolha-da-tecnica', categorias: ['Arranjo', 'Combinação', 'Permutação'],
    prompt: 'Para cada situação, diga qual técnica conta as possibilidades. (Use a pergunta: a ordem importa? Uso todos ou só alguns?)',
    itens: itens.map(([texto, cat, porque]) => ({ texto, cat, porque })),
    hints: ['Duas perguntas: a ordem importa? Entram todos os elementos ou só alguns?', 'Ordem importa + todos = permutação. Ordem importa + alguns = arranjo. Ordem não importa = combinação.', itens.map(([, cat]) => ['Arranjo', 'Combinação', 'Permutação'][cat]).join(', ') + '.'],
    explain: 'Ordem importa e entram todos: permutação. Ordem importa e entram só alguns: arranjo. Ordem não importa: combinação.',
  };
};

export const GERADORES: Record<string, Gerador> = {
  ...GERADORES_M4,
  'm3.princ': principios, 'm3.fat': fatorial, 'm3.anag': anagrama, 'm3.ac': arranjoOuComb, 'm3.qual': qualTecnica,
  'm1.ops': opsConjuntos, 'm1.ie2': incExc2, 'm1.ie3': incExc3, 'm1.partes': partes, 'm1.cart': cartesiano, 'm1.comp': composicao, 'm1.classf': classificarFuncao, 'm1.venn': pintarVenn,
  'm2.prop': proposicao, 'm2.cond': conectivo, 'm2.linhas': linhas, 'm2.tabela': tabela, 'm2.classe': classe, 'm2.equiv': equivalencia, 'm2.bool': valorBooleano, 'm2.simpl': simplificar, 'm2.sop': somaDeProdutos,
};
