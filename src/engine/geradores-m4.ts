// Geradores da M4 · Probabilidade. Mesma regra dos outros: a resposta é calculada pelo código.
import type { Armadilha, Ex } from './types';
import type { Rng } from '../lib/rng';
import { comb } from '../lib/contagem';

type Gerador = (r: Rng, nivel: number) => Ex;
let n = 0;
const id = (g: string) => `${g}#${Date.now().toString(36)}m4${(n++).toString(36)}`;
const v2 = (x: number, casas = 2) => (Math.round(x * 10 ** casas) / 10 ** casas).toLocaleString('pt-BR', { maximumFractionDigits: casas });
const COMO = 'Pode responder em fração (1/3), decimal (0,33) ou porcentagem (33%).';
/** Tira as armadilhas que ficariam perto demais da resposta certa. */
const longe = (resp: number, tol: number, arms: Armadilha<number>[]) => arms.filter((a) => Math.abs(a.valor - resp) > tol * 2 + 1e-9);

const classica: Gerador = (r) => {
  const tipo = r.pick(['dado', 'urna', 'baralho', 'lote'] as const);
  let prompt: string, fav: number, tot: number, conta: string;
  if (tipo === 'dado') {
    const [desc, f] = r.pick([['um número par', 3], ['um número maior que 4', 2], ['um número menor que 3', 2], ['um múltiplo de 3', 2], ['um número ímpar maior que 1', 2], ['o número 6', 1], ['um número menor que 6', 5]] as [string, number][]);
    prompt = `Um dado comum e equilibrado é lançado uma vez. Qual é a probabilidade de sair **${desc}**?`; fav = f; tot = 6; conta = `Espaço amostral: {1, 2, 3, 4, 5, 6}, 6 resultados. Favoráveis: ${f}.`;
  } else if (tipo === 'urna') {
    const a = r.int(2, 6), b = r.int(2, 5), c = r.int(1, 4), qual = r.int(0, 2), nomes = ['vermelhas', 'azuis', 'verdes'], sing = ['vermelha', 'azul', 'verde'];
    prompt = `Numa urna há **${a}** bolas vermelhas, **${b}** azuis e **${c}** verdes. Retira-se uma bola ao acaso. Qual é a probabilidade de ela ser **${sing[qual]}**?`; fav = [a, b, c][qual]; tot = a + b + c; conta = `Total de bolas: ${a} + ${b} + ${c} = ${tot}. Bolas ${nomes[qual]}: ${fav}.`;
  } else if (tipo === 'baralho') {
    const [desc, f] = r.pick([['de copas', 13], ['um ás', 4], ['uma figura (valete, dama ou rei)', 12], ['uma carta vermelha', 26]] as [string, number][]);
    prompt = `Tira-se uma carta ao acaso de um baralho comum de 52 cartas (4 naipes de 13 cartas). Qual é a probabilidade de ela ser **${desc}**?`; fav = f; tot = 52; conta = `Total: 52 cartas. Favoráveis: ${f}.`;
  } else {
    const t = r.pick([20, 40, 50, 200]), f = r.int(1, 4) * (t / 20);
    prompt = `De **${t}** pacotes enviados numa rede, **${f}** foram perdidos. Usando esses dados, qual é a probabilidade estimada de um pacote ser perdido?`; fav = f; tot = t; conta = `Perdidos: ${f}. Enviados: ${t}.`;
  }
  const resp = fav / tot;
  return {
    id: id('m4.class'), kind: 'num', topic: 'm4.classica', answer: resp, tol: 0.006, prompt: `${prompt}\n\n${COMO}`,
    armadilhas: longe(resp, 0.006, [{ valor: fav / (tot - fav), causa: 'conceito', msg: 'Você dividiu os favoráveis pelos NÃO favoráveis. O denominador é o total de resultados possíveis.' }, { valor: 1 / tot, causa: 'conceito', msg: 'Isso é a chance de UM resultado específico. Conte quantos resultados são favoráveis.' }]),
    hints: ['Probabilidade clássica: casos favoráveis divididos por casos possíveis.', conta, `${fav}/${tot} = ${v2(resp, 3)}.`],
    explain: `${conta} P = ${fav}/${tot} = **${v2(resp, 3)}** (${v2(resp * 100, 1)}%).`,
  };
};

const regrasProb: Gerador = (r, nivel) => {
  const tipo = nivel === 0 ? r.pick(['comp', 'indep'] as const) : r.pick(['comp', 'indep', 'uniao', 'pelomenos'] as const);
  if (tipo === 'comp') {
    const p = r.pick([0.1, 0.2, 0.02, 0.05, 0.3, 0.15]);
    return { id: id('m4.regras'), kind: 'num', topic: 'm4.regras', answer: 1 - p, tol: 0.0006, prompt: `A probabilidade de um servidor falhar num dia é **${v2(p)}**. Qual é a probabilidade de ele **não** falhar?\n\n${COMO}`,
      armadilhas: [{ valor: p, causa: 'leitura', msg: 'Essa é a chance de falhar. A pergunta é a de NÃO falhar.' }],
      hints: ['Falhar e não falhar são os dois únicos casos: juntos somam 1.', 'P(não A) = 1 − P(A).', `1 − ${v2(p)} = ${v2(1 - p)}.`], explain: `Complemento: P(não A) = 1 − P(A) = 1 − ${v2(p)} = **${v2(1 - p)}**.` };
  }
  if (tipo === 'indep') {
    const p = r.pick([0.9, 0.8, 0.5, 0.7, 0.95]), k = r.int(2, 3), resp = p ** k;
    return { id: id('m4.regras'), kind: 'num', topic: 'm4.regras', answer: resp, tol: 0.0006, prompt: `Cada pacote enviado chega corretamente com probabilidade **${v2(p)}**, e os envios são independentes. Qual é a probabilidade de **${k}** pacotes seguidos chegarem todos corretamente?\n\n${COMO}`,
      armadilhas: longe(resp, 0.0006, [{ valor: Math.min(1, p * k), causa: 'conceito', msg: 'Você multiplicou a probabilidade pelo número de pacotes. Para "um E outro" independentes, multiplica-se uma probabilidade pela outra.' }, { valor: p, causa: 'conceito', msg: 'Essa é a chance de UM pacote. Para vários, todos precisam dar certo: multiplique.' }]),
      hints: ['"Este E o próximo" com eventos independentes: multiplica as probabilidades.', `${Array(k).fill(v2(p)).join(' × ')}.`, `= ${v2(resp, 4)}.`], explain: `Independentes: P(A ∩ B) = P(A) · P(B). ${Array(k).fill(v2(p)).join(' × ')} = **${v2(resp, 4)}**.` };
  }
  if (tipo === 'uniao') {
    const tot = r.pick([20, 30, 40, 50]), ab = r.int(1, 4), a = ab + r.int(2, 8), b = ab + r.int(2, 8), resp = (a + b - ab) / tot;
    return { id: id('m4.regras'), kind: 'num', topic: 'm4.regras', answer: resp, tol: 0.006, prompt: `Numa turma de **${tot}** alunos, **${a}** estudam Python, **${b}** estudam Java e **${ab}** estudam as duas. Sorteando um aluno, qual é a probabilidade de ele estudar **pelo menos uma** das duas linguagens?\n\n${COMO}`,
      armadilhas: longe(resp, 0.006, [{ valor: (a + b) / tot, causa: 'conceito', msg: `Você somou ${a} + ${b} e contou em dobro os ${ab} que estudam as duas. Desconte a interseção.` }]),
      hints: ['É a regra da adição: os dois grupos se cruzam.', 'P(A ∪ B) = P(A) + P(B) − P(A ∩ B).', `(${a} + ${b} − ${ab})/${tot} = ${a + b - ab}/${tot}.`], explain: `Regra da adição: (${a} + ${b} − ${ab})/${tot} = ${a + b - ab}/${tot} = **${v2(resp, 3)}**. É a inclusão-exclusão da região de conjuntos, dividida pelo total.` };
  }
  const p = r.pick([0.1, 0.2, 0.5, 0.3]), k = r.int(2, 4), resp = 1 - (1 - p) ** k;
  return { id: id('m4.regras'), kind: 'num', topic: 'm4.regras', answer: resp, tol: 0.0006, prompt: `Cada tentativa de invasão tem probabilidade **${v2(p)}** de dar certo, de forma independente. Em **${k}** tentativas, qual é a probabilidade de **pelo menos uma** dar certo?\n\n${COMO}`,
    armadilhas: longe(resp, 0.0006, [{ valor: (1 - p) ** k, causa: 'leitura', msg: 'Essa é a chance de NENHUMA dar certo. Falta fazer 1 menos isso.' }, { valor: Math.min(1, p * k), causa: 'conceito', msg: 'Somar as probabilidades conta em dobro os casos em que mais de uma dá certo. Use o complemento: 1 − P(nenhuma).' }]),
    hints: ['"Pelo menos uma" é o contrário de "nenhuma".', `P(nenhuma) = ${v2(1 - p)} elevado a ${k}.`, `1 − ${v2((1 - p) ** k, 4)} = ${v2(resp, 4)}.`], explain: `Pelo complemento: P(pelo menos uma) = 1 − P(nenhuma) = 1 − ${v2(1 - p)}^${k} = 1 − ${v2((1 - p) ** k, 4)} = **${v2(resp, 4)}**. É a conta do exemplo de senha do curso.` };
};

const condicional: Gerador = (r, nivel) => {
  if (nivel === 0 || r.bool(0.5)) {
    const a = r.int(4, 18), b = r.int(4, 18), c = r.int(4, 18), d = r.int(4, 18), direto = r.bool();
    const tabela = `- Do plano **Pro**: **${a}** reclamaram, **${b}** não reclamaram\n- Do plano **Básico**: **${c}** reclamaram, **${d}** não reclamaram`;
    const den = direto ? a + b : a + c, resp = a / den;
    const q = direto ? 'Sabendo que o cliente sorteado é do plano **Pro**, qual é a probabilidade de ele ter reclamado?' : 'Sabendo que o cliente sorteado **reclamou**, qual é a probabilidade de ele ser do plano **Pro**?';
    const expl = direto ? `Só interessam os ${a + b} clientes Pro. Deles, ${a} reclamaram.` : `Só interessam os ${a + c} clientes que reclamaram. Deles, ${a} são Pro.`;
    return { id: id('m4.cond'), kind: 'num', topic: 'm4.condicional', answer: resp, tol: 0.006, prompt: `Uma empresa separou seus clientes:\n\n${tabela}\n\n${q}\n\n${COMO}`,
      armadilhas: longe(resp, 0.006, [{ valor: a / (a + b + c + d), causa: 'conceito', msg: 'Você dividiu pelo total de clientes. O "sabendo que" encolhe o universo: divida só pelo grupo informado.' }, { valor: direto ? a / (a + c) : a / (a + b), causa: 'leitura', msg: 'Você calculou a condicional ao contrário. P(A|B) e P(B|A) são perguntas diferentes: veja o que vem depois do "sabendo que".' }]),
      hints: ['"Sabendo que…" muda o universo: só conta quem está nesse grupo.', expl, `${a}/${den} = ${v2(resp, 3)}.`], explain: `${expl} P = ${a}/${den} = **${v2(resp, 3)}**. Na fórmula: P(A|B) = P(A ∩ B) / P(B).` };
  }
  const pa = r.pick([0.6, 0.7, 0.4, 0.3]), x = r.pick([0.9, 0.7, 0.8, 0.5]), y = r.pick([0.2, 0.4, 0.5, 0.6]), resp = pa * x + (1 - pa) * y;
  return { id: id('m4.cond'), kind: 'num', topic: 'm4.condicional', answer: resp, tol: 0.0006, prompt: `Num sistema, **${v2(pa * 100)}%** das requisições vão para o servidor A e o restante para o servidor B. O servidor A responde a tempo em **${v2(x * 100)}%** das vezes; o B, em **${v2(y * 100)}%**. Qual é a probabilidade de uma requisição qualquer ser respondida a tempo?\n\n${COMO}`,
    armadilhas: longe(resp, 0.0006, [{ valor: (x + y) / 2, causa: 'conceito', msg: 'Você fez a média simples das duas taxas. Os servidores recebem cargas diferentes: cada taxa precisa ser pesada pela fatia de requisições.' }, { valor: x * y, causa: 'conceito', msg: 'Multiplicar as duas taxas seria "A e B responderem a mesma requisição". Cada requisição vai para um servidor só: some os dois caminhos.' }]),
    hints: ['São dois caminhos: (vai para A e responde) ou (vai para B e responde).', `Caminho A: ${v2(pa)} × ${v2(x)}. Caminho B: ${v2(1 - pa)} × ${v2(y)}.`, `${v2(pa * x, 3)} + ${v2((1 - pa) * y, 3)} = ${v2(resp, 3)}.`], explain: `Probabilidade total: P = P(a tempo|A)·P(A) + P(a tempo|B)·P(B) = ${v2(x)}·${v2(pa)} + ${v2(y)}·${v2(1 - pa)} = ${v2(pa * x, 3)} + ${v2((1 - pa) * y, 3)} = **${v2(resp, 3)}**. É o mesmo raciocínio do exercício 10 do curso (meninas e meninos que praticam esportes).` };
};

const binomial: Gerador = (r, nivel) => {
  const nn = r.int(3, 5), p = r.pick([0.5, 0.2, 0.1, 0.8, 0.4]), k = r.int(1, nn - 1), c = comb(nn, k), a = p ** k, b = (1 - p) ** (nn - k), resp = c * a * b;
  const [oque, suc] = r.pick([['pacotes são enviados', 'chegar corretamente'], ['peças são testadas', 'estar com defeito'], ['usuários visitam a página', 'clicar no botão'], ['moedas viciadas são lançadas', 'dar cara']]);
  return {
    id: id('m4.binom'), kind: 'passos', topic: 'm4.binomial', ocultos: [1, 2, 4][Math.min(2, nivel)],
    prompt: `**${nn}** ${oque}, de forma independente, e cada um tem probabilidade **${v2(p)}** de ${suc}. Qual é a probabilidade de isso acontecer com **exatamente ${k}** deles?`,
    passos: [
      { texto: `É binomial: ${nn} tentativas independentes, só dois resultados, mesma chance p = ${v2(p)} em todas.` },
      { texto: `De quantos jeitos dá para escolher QUAIS ${k} dos ${nn} são os sucessos? É uma combinação: C(${nn}, ${k}).`, pede: { rotulo: `C(${nn}, ${k})`, resposta: c } },
      { texto: `Chance de os ${k} sucessos acontecerem: ${v2(p)} multiplicado por ele mesmo ${k} vez(es).`, pede: { rotulo: `${v2(p)}^${k}`, resposta: a, tol: 0.0006 } },
      { texto: `Chance de os outros ${nn - k} falharem: (1 − ${v2(p)}) = ${v2(1 - p)}, multiplicado ${nn - k} vez(es).`, pede: { rotulo: `${v2(1 - p)}^${nn - k}`, resposta: b, tol: 0.0006 } },
      { texto: `Multiplique os três: ${c} × ${v2(a, 4)} × ${v2(b, 4)}.`, pede: { rotulo: `P(X = ${k})`, resposta: resp, tol: 0.0006 } },
    ],
    hints: ['Três pedaços: quantos jeitos, chance dos sucessos, chance dos fracassos.', `C(${nn}, ${k}) · ${v2(p)}^${k} · ${v2(1 - p)}^${nn - k}.`, `${c} × ${v2(a, 4)} × ${v2(b, 4)} = ${v2(resp, 4)}.`],
    explain: `$P(X = ${k}) = C(${nn},${k}) \\cdot p^{${k}} \\cdot (1-p)^{${nn - k}}$ = ${c} × ${v2(a, 4)} × ${v2(b, 4)} = **${v2(resp, 4)}**.`,
  };
};

const normal: Gerador = (r, nivel) => {
  const mu = r.pick([150, 100, 200, 80, 500]), sg = r.pick([10, 20, 5, 25]), [gr, un] = r.pick([['O tempo de resposta de uma aplicação', 'ms'], ['A latência de uma rede', 'ms'], ['A nota de um teste de desempenho', 'pontos']]);
  const base = `${gr} segue uma distribuição normal com média **${mu}** ${un} e desvio padrão **${sg}** ${un}.`;
  const tipo = nivel === 0 ? r.pick(['faixa', 'z'] as const) : r.pick(['faixa', 'cauda', 'z'] as const);
  if (tipo === 'z') {
    const z = r.pick([-2, -1, 1, 2, 3, 1.5]), x = mu + z * sg;
    return { id: id('m4.normal'), kind: 'num', topic: 'm4.normal', answer: z, tol: 0.01, prompt: `${base}\n\nUm valor de **${v2(x)}** ${un} está a quantos desvios padrão da média? (Use sinal negativo se estiver abaixo da média.)`,
      armadilhas: longe(z, 0.01, [{ valor: x - mu, causa: 'conceito', msg: `Essa é a distância em ${un}. Falta dividir pelo desvio padrão para saber quantos desvios isso representa.` }, { valor: -z, causa: 'conta', msg: 'O sinal está trocado: faça valor menos média, nessa ordem.' }]),
      hints: ['Primeiro a distância até a média: valor − média.', `${v2(x)} − ${mu} = ${v2(x - mu)}. Agora divida pelo desvio padrão.`, `${v2(x - mu)} ÷ ${sg} = ${v2(z)}.`], explain: `$z = \\dfrac{x - \\mu}{\\sigma}$ = (${v2(x)} − ${mu}) ÷ ${sg} = **${v2(z)}**. Esse número (o escore z) diz quão "raro" o valor é.` };
  }
  if (tipo === 'faixa') {
    const k = r.int(1, 3), resp = [0.68, 0.95, 0.997][k - 1];
    return { id: id('m4.normal'), kind: 'num', topic: 'm4.normal', answer: resp, tol: 0.006, prompt: `${base}\n\nPela regra 68-95-99,7, que fração dos valores fica **entre ${mu - k * sg} e ${mu + k * sg}** ${un}?\n\n${COMO}`,
      hints: ['Descubra quantos desvios cada limite está da média.', `${mu - k * sg} = média − ${k}·${sg} e ${mu + k * sg} = média + ${k}·${sg}: é média ± ${k} desvio(s).`, '±1σ: 68%. ±2σ: 95%. ±3σ: 99,7%.'], explain: `Os limites são média ± ${k} desvio(s) padrão. Pela regra 68-95-99,7: **${v2(resp * 100, 1)}%**.` };
  }
  const k = r.int(1, 2), acima = r.bool(), resp = k === 1 ? 0.16 : 0.025, lim = acima ? mu + k * sg : mu - k * sg;
  return { id: id('m4.normal'), kind: 'num', topic: 'm4.normal', answer: resp, tol: 0.006, prompt: `${base}\n\nPela regra 68-95-99,7, que fração dos valores fica **${acima ? 'acima' : 'abaixo'} de ${lim}** ${un}?\n\n${COMO}`,
    armadilhas: [{ valor: 2 * resp, causa: 'conceito', msg: 'Esse é o total das DUAS pontas. A curva é simétrica: a pergunta quer só uma ponta, metade disso.' }, { valor: k === 1 ? 0.68 : 0.95, causa: 'leitura', msg: 'Essa é a parte de DENTRO da faixa. A pergunta quer o que fica fora, de um lado só.' }],
    hints: [`${lim} é a média ${acima ? '+' : '−'} ${k} desvio(s).`, `Dentro de ±${k}σ ficam ${k === 1 ? 68 : 95}%. Fora, sobram ${k === 1 ? 32 : 5}%, divididos igualmente nas duas pontas.`, `${k === 1 ? 32 : 5}% ÷ 2 = ${k === 1 ? 16 : '2,5'}%.`], explain: `${lim} = média ${acima ? '+' : '−'} ${k}σ. Fora de ±${k}σ sobram ${k === 1 ? 32 : 5}%, metade em cada ponta: **${k === 1 ? 16 : '2,5'}%**.` };
};

const tipoVariavel: Gerador = (r) => {
  const itens = r.shuffle([
    ['Número de usuários online num servidor', 0, 'É contagem: 0, 1, 2…'], ['Latência da rede, em milissegundos', 1, 'É medição: pode ser 12,37 ms.'], ['Número de pacotes perdidos', 0, 'É contagem.'],
    ['Utilização da CPU, em porcentagem', 1, 'É medição: qualquer valor entre 0 e 100.'], ['Temperatura de um servidor, em °C', 1, 'É medição.'], ['Número de erros num código', 0, 'É contagem.'],
    ['Tempo de resposta de uma aplicação', 1, 'É medição.'], ['Transações por segundo num banco de dados', 0, 'É contagem de eventos.'], ['Vazão de dados, em Mbps', 1, 'É medição.'], ['Número de falhas de hardware num lote', 0, 'É contagem.'],
  ] as [string, number, string][]).slice(0, 5);
  return { id: id('m4.tipo'), kind: 'classificar', topic: 'm4.variaveis', categorias: ['Discreta', 'Contínua'], prompt: 'Cada variável abaixo é discreta ou contínua? (Os exemplos são os do curso.)', itens: itens.map(([texto, cat, porque]) => ({ texto, cat, porque })),
    hints: ['Pergunte: isso se CONTA ou se MEDE?', 'Conta (0, 1, 2…): discreta. Mede (qualquer valor num intervalo): contínua.', itens.map(([, c]) => ['discreta', 'contínua'][c]).join(', ') + '.'], explain: 'Discreta vem de contagem (valores inteiros, separados). Contínua vem de medição (qualquer valor dentro de um intervalo).' };
};

export const TABELAS_ESP: [number[], number[]][] = [[[0, 1, 2], [0.5, 0.3, 0.2]], [[0, 1, 2, 3], [0.4, 0.3, 0.2, 0.1]], [[0, 1], [0.2, 0.8]], [[1, 2, 3], [0.2, 0.5, 0.3]], [[0, 10, 50], [0.7, 0.2, 0.1]], [[0, 1, 2], [0.81, 0.18, 0.01]]];
const valorEsperado: Gerador = (r) => {
  const [xs, ps] = r.pick(TABELAS_ESP);
  const resp = xs.reduce((t, x, i) => t + x * ps[i], 0), oque = r.pick(['falhas por dia num servidor', 'pacotes perdidos por lote', 'chamados abertos por hora']);
  return { id: id('m4.esp'), kind: 'num', topic: 'm4.variaveis', answer: resp, tol: 0.006, prompt: `A variável X conta o número de ${oque}. As probabilidades são:\n\n${xs.map((x, i) => `- P(X = ${x}) = **${v2(ps[i])}**`).join('\n')}\n\nQual é o valor esperado E(X)?`,
    armadilhas: longe(resp, 0.006, [{ valor: xs.reduce((a, b) => a + b, 0) / xs.length, causa: 'conceito', msg: 'Você fez a média simples dos valores. O valor esperado pesa cada valor pela sua probabilidade.' }]),
    hints: ['Valor esperado é uma média ponderada: cada valor vezes a sua probabilidade.', xs.map((x, i) => `${x} × ${v2(ps[i])}`).join(' + ') + '.', `= ${v2(resp)}.`], explain: `$E(X) = \\sum x_i \\cdot P(X = x_i)$ = ${xs.map((x, i) => `${x}·${v2(ps[i])}`).join(' + ')} = **${v2(resp)}**. É a média que você veria repetindo o experimento muitas vezes.` };
};

export const GERADORES_M4: Record<string, Gerador> = { 'm4.class': classica, 'm4.regras': regrasProb, 'm4.cond': condicional, 'm4.binom': binomial, 'm4.normal': normal, 'm4.tipo': tipoVariavel, 'm4.esp': valorEsperado };
