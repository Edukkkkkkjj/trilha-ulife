// Geradores do Mundo 2 (Exploração Digital). A matéria é conceitual, então quase tudo aqui é classificação;
// onde há conta (vazão, tempo de download), ela é feita pelo código.
import type { Ex } from './types';
import type { Rng } from '../lib/rng';

type Gerador = (r: Rng, nivel: number) => Ex;
let n = 0;
const id = (g: string) => `${g}#${Date.now().toString(36)}ex${(n++).toString(36)}`;
const v1 = (x: number) => (Math.round(x * 10) / 10).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
type Item = [string, number, string];
const classifica = (g: string, topic: string, prompt: string, cats: string[], pool: Item[], dicas: [string, string], explain: string): Gerador => (r) => {
  const itens = r.shuffle(pool).slice(0, 5);
  return { id: id(g), kind: 'classificar', topic, categorias: cats, prompt, itens: itens.map(([texto, cat, porque]) => ({ texto, cat, porque })), hints: [dicas[0], dicas[1], itens.map(([, c]) => cats[c]).join(', ') + '.'], explain };
};

// ---------- C1 ----------
const vazaoDownload: Gerador = (r, nivel) => {
  if (nivel === 0 || r.bool()) {
    const mb = r.pick([50, 100, 200, 400]), mbps = r.pick([10, 20, 40, 50, 100]), t = (mb * 8) / mbps;
    return { id: id('c1.vazao'), kind: 'num', topic: 'c1.conectividade', answer: t, tol: 0.05, unidade: 's', prompt: `Sua conexão entrega **${mbps} Mbps** (megabits por segundo). Quantos segundos leva para baixar um arquivo de **${mb} MB** (megabytes)?`,
      armadilhas: [{ valor: mb / mbps, causa: 'conceito', msg: 'Você dividiu megabytes por megabits. 1 byte são 8 bits: primeiro multiplique o tamanho do arquivo por 8.' }],
      hints: ['Cuidado com a unidade: o arquivo está em megaBYTES e a conexão em megaBITS.', `${mb} MB × 8 = ${mb * 8} megabits.`, `${mb * 8} ÷ ${mbps} = ${v1(t)} s.`], explain: `${mb} MB × 8 = ${mb * 8} megabits. ${mb * 8} ÷ ${mbps} Mbps = **${v1(t)} s**. Por isso um plano de "100 mega" baixa a 12,5 MB por segundo, não a 100.` };
  }
  const jan = r.pick([64, 128, 256]), lat = r.pick([100, 200, 400]), lim = (jan * 1024 * 8) / (lat / 1000) / 1e6;
  return { id: id('c1.vazao'), kind: 'num', topic: 'c1.conectividade', answer: lim, tol: 0.06, unidade: 'Mbps', prompt: `Uma transferência usa janela TCP de **${jan} KiB** (1 KiB = 1024 bytes) num caminho com **${lat} ms** de latência de ida e volta. Qual é a vazão máxima, em Mbps, por mais gordo que seja o link?`,
    armadilhas: [{ valor: lim / 8, causa: 'conta', msg: 'Faltou converter bytes em bits (× 8).' }],
    hints: ['Só cabe uma janela de dados "no ar" a cada ida e volta.', `${jan} × 1024 × 8 = ${jan * 1024 * 8} bits por janela; uma janela a cada ${v1(lat / 1000)} s.`, `${jan * 1024 * 8} ÷ ${lat / 1000} = ${Math.round(lim * 1e6)} bits/s = ${v1(lim)} Mbps.`], explain: `Bits por janela: ${jan} × 1024 × 8 = ${jan * 1024 * 8}. Uma janela a cada ${lat / 1000} s: ${v1(lim)} milhões de bits por segundo = **${v1(lim)} Mbps**. Banda sobrando não ajuda: o limite é a espera pela confirmação.` };
};
const modeloNuvem = classifica('c1.modelo', 'c1.nuvem', 'Cada situação é IaaS, PaaS ou SaaS? (Pergunte: de quantas camadas a empresa ainda cuida?)', ['IaaS', 'PaaS', 'SaaS'], [
  ['A empresa aluga máquinas virtuais e instala nelas o sistema operacional que quiser', 0, 'Controle do sistema operacional para cima: IaaS.'],
  ['A equipe usa um e-mail pelo navegador, sem instalar nada', 2, 'Software pronto para usar: SaaS.'],
  ['Os desenvolvedores sobem o código e a plataforma cuida de servidor e ambiente de execução', 1, 'Só a aplicação e os dados ficam com a empresa: PaaS.'],
  ['A empresa contrata armazenamento e rede virtuais em vez de comprar servidores', 0, 'Infraestrutura alugada: IaaS.'],
  ['O setor financeiro assina um sistema de gestão acessado por login', 2, 'Sistema de gestão pronto, por assinatura: SaaS.'],
  ['Um ambiente pronto para desenvolver, testar e implantar aplicações', 1, 'É a definição de PaaS no curso.'],
  ['Editor de documentos colaborativo online', 2, 'Ferramenta colaborativa pronta: SaaS.'],
  ['Servidores virtuais para quem precisa de flexibilidade sem data center próprio', 0, 'É a descrição de IaaS no curso.'],
], ['IaaS: você ainda cuida do sistema operacional. PaaS: só da aplicação. SaaS: só usa.', 'Máquina virtual, rede, armazenamento: IaaS. Ambiente para programar: PaaS. Programa pronto: SaaS.'], 'IaaS entrega infraestrutura; PaaS entrega a plataforma para desenvolver; SaaS entrega o software pronto.');
const redes = classifica('c1.rede', 'c1.redes', 'Classifique cada item.', ['LAN', 'MAN', 'WAN'], [
  ['A rede do escritório, num andar só', 0, 'Rede local: um prédio ou ambiente.'],
  ['A rede que liga os prédios de uma universidade espalhados pela cidade', 1, 'Rede metropolitana: uma cidade.'],
  ['A internet', 2, 'A maior rede de longa distância que existe.'],
  ['O Wi-Fi da sua casa', 0, 'Rede local.'],
  ['A rede que liga a matriz em São Paulo à filial em Recife', 2, 'Entre cidades e estados: longa distância.'],
  ['A rede de câmeras de trânsito de uma prefeitura', 1, 'Cobre uma cidade: metropolitana.'],
  ['Os computadores de um laboratório da faculdade', 0, 'Um ambiente: local.'],
  ['A rede de uma operadora que cobre o país', 2, 'Abrangência nacional: longa distância.'],
], ['A classificação é pelo tamanho da área coberta.', 'LAN: um local. MAN: uma cidade. WAN: entre cidades, países.'], 'LAN (local), MAN (metropolitana) e WAN (longa distância): classificação por abrangência geográfica.');
const triade = classifica('c1.triade', 'c1.seguranca', 'Cada incidente fere principalmente qual pilar da segurança da informação?', ['Confidencialidade', 'Integridade', 'Disponibilidade'], [
  ['Um funcionário sem autorização lê a folha de pagamento', 0, 'Alguém viu o que não devia ver.'],
  ['Um ataque derruba o site da loja por duas horas', 2, 'O serviço ficou fora do ar.'],
  ['Um valor no banco de dados é alterado sem ninguém perceber', 1, 'O dado deixou de ser confiável.'],
  ['Uma senha vaza e um estranho acessa os e-mails', 0, 'Acesso indevido à informação.'],
  ['O servidor queima e não havia backup', 2, 'A informação ficou indisponível.'],
  ['Um arquivo chega corrompido ao destino', 1, 'O conteúdo não é mais o original.'],
  ['Uma lista de clientes é copiada e vendida', 0, 'Informação exposta a quem não devia.'],
  ['Um vírus troca o número da conta num boleto', 1, 'Dado adulterado.'],
], ['Confidencialidade: só quem pode, vê. Integridade: ninguém altera indevidamente. Disponibilidade: está lá quando precisa.', 'Pergunte: alguém VIU, alguém ALTEROU, ou ficou FORA DO AR?'], 'A tríade: confidencialidade (sigilo), integridade (não adulteração) e disponibilidade (acesso quando necessário).');

// ---------- C2 ----------
const digOuTransf = classifica('c2.digtrans', 'c2.transformacao', 'Cada iniciativa é só digitalização ou é transformação digital?', ['Digitalização', 'Transformação digital'], [
  ['Escanear os contratos em papel e guardar em PDF', 0, 'Converteu o analógico em digital; a lógica do negócio é a mesma.'],
  ['Trocar a planilha de papel por uma planilha no computador', 0, 'Mesmo processo, outro suporte.'],
  ['Passar a decidir preços com base nos dados de compra dos clientes em tempo real', 1, 'A decisão mudou de base: dados no lugar da experiência do gestor.'],
  ['Criar um perfil da loja nas redes sociais para divulgar produtos', 0, 'Presença digital sem mudar o modelo de negócio (é a Empresa A).'],
  ['Redesenhar o atendimento em torno do histórico de cada cliente, integrando vendas e suporte', 1, 'Processo e relação com o cliente foram repensados.'],
  ['Comprar computadores mais modernos', 0, 'Modernizar equipamento não muda o negócio.'],
  ['Lançar um serviço por assinatura que antes era venda avulsa, apoiado em dados de uso', 1, 'Mudou o modelo de negócio e a criação de valor.'],
  ['Implantar um ERP, mas continuar decidindo "no olho"', 0, 'Tem o sistema, não usa os dados: é o retrato da Empresa A.'],
], ['Mudou só o suporte (papel → tela) ou mudou o jeito de funcionar e de criar valor?', 'Transformação digital mexe em modelo de negócio, processos, cultura e decisão.'], 'Digitalização converte o analógico em digital. Transformação digital muda modelo de negócio, processos, cultura e a forma de criar valor.');
const erpOuCrm = classifica('c2.erpcrm', 'c2.erpcrm', 'Cada função é típica de qual sistema?', ['ERP', 'CRM'], [
  ['Controle de finanças', 0, 'Processo interno: ERP.'], ['Histórico de atendimento de cada cliente', 1, 'Relacionamento com o cliente: CRM.'], ['Gestão da produção', 0, 'Processo interno.'], ['Campanhas de marketing', 1, 'Voltado para fora, para o cliente.'],
  ['Logística e compras', 0, 'Processos internos.'], ['Funil de vendas e fidelização', 1, 'Relacionamento com o cliente.'], ['Recursos humanos e folha', 0, 'Processo interno.'], ['Suporte e personalização do atendimento', 1, 'Relacionamento com o cliente.'],
], ['ERP olha para dentro da empresa; CRM olha para o cliente.', 'Finanças, produção, logística, RH, compras: ERP. Vendas, marketing, atendimento, suporte: CRM.'], 'ERP centraliza os processos internos (finanças, produção, logística, RH, compras). CRM cuida do relacionamento com o cliente (vendas, marketing, atendimento, suporte).');
const dominios = classifica('c2.rogers', 'c2.rogers', 'Cada frase pertence a qual dos cinco domínios de Rogers?', ['Clientes', 'Competição', 'Dados', 'Inovação', 'Valor'], [
  ['Os consumidores formam redes e influenciam uns aos outros', 0, 'Domínio dos clientes.'], ['A informação é tratada como um ativo estratégico', 2, 'Domínio dos dados.'],
  ['Testar ideias rápido e barato, com experimentos', 3, 'Domínio da inovação.'], ['Rever continuamente o que a empresa entrega e por que isso importa', 4, 'Domínio do valor.'],
  ['Rivais de hoje podem ser parceiros numa plataforma amanhã', 1, 'Domínio da competição.'], ['O cliente no centro da estratégia', 0, 'Domínio dos clientes.'],
  ['Decisões orientadas por análise em vez de intuição', 2, 'Domínio dos dados.'], ['A proposta da empresa precisa evoluir antes de ficar obsoleta', 4, 'Domínio do valor.'],
], ['Os cinco: clientes, competição, dados, inovação e valor.', 'Pergunte de quem ou do que a frase fala: de quem compra, de quem concorre, da informação, de como se cria o novo, ou do que se entrega.'], 'Os cinco domínios de Rogers: clientes, competição, dados, inovação e valor.');

// ---------- C3 ----------
const tipoAprendizado = classifica('c3.tipo', 'c3.aprendizado', 'Cada situação é qual tipo de aprendizado de máquina?', ['Supervisionado', 'Não supervisionado', 'Por reforço'], [
  ['Treinar com e-mails já marcados como "spam" ou "não spam"', 0, 'Os exemplos vêm com a resposta certa (rótulo).'],
  ['Agrupar clientes por semelhança, sem dizer de antemão quais grupos existem', 1, 'Sem rótulos: o algoritmo descobre os grupos (k-means).'],
  ['Um robô que aprende a andar ganhando pontos quando avança e perdendo quando cai', 2, 'Tentativa, erro e recompensa.'],
  ['Prever o preço de um imóvel a partir de imóveis vendidos, com seus preços', 0, 'Exemplos com a resposta: regressão.'],
  ['Reduzir uma planilha de 200 colunas para as poucas que mais explicam os dados', 1, 'Redução de dimensionalidade (PCA): não há rótulo.'],
  ['Um programa que aprende a jogar xadrez jogando contra si mesmo', 2, 'Aprende pelas consequências das jogadas (Q-learning e parecidos).'],
  ['Classificar exames como "normal" ou "alterado" a partir de exames já laudados', 0, 'Rótulos dados por especialistas.'],
  ['Descobrir padrões de compra que ninguém tinha pensado em procurar', 1, 'Exploração sem resposta pronta.'],
], ['Há exemplos com a resposta certa? Não há resposta nenhuma? Ou há recompensa e punição?', 'Com rótulo: supervisionado. Sem rótulo, achando grupos: não supervisionado. Tentativa e recompensa: reforço.'], 'Supervisionado: aprende com exemplos rotulados. Não supervisionado: acha estrutura em dados sem rótulo. Por reforço: aprende por tentativa, erro e recompensa.');
const autoOuIa = classifica('c3.autoia', 'c3.fundamentos', 'Cada sistema é automação (regra fixa), IA (aprende com dados) ou sistema inteligente (IA + sensores + ação)?', ['Automação', 'IA', 'Sistema inteligente'], [
  ['Um robô de software (RPA) que copia dados de um formulário para outro sistema, sempre do mesmo jeito', 0, 'Processo estruturado, regra fixa: RPA é automação, não IA.'],
  ['Um sistema que recomenda filmes com base no que você já assistiu', 1, 'Aprende preferências a partir de dados.'],
  ['Semáforos que percebem o trânsito por sensores e ajustam os tempos sozinhos', 2, 'Percebe o ambiente, processa e age: é o exemplo do curso (controle de tráfego).'],
  ['Emissão de nota fiscal a cada venda registrada', 0, 'Tarefa repetitiva com regra predefinida.'],
  ['Um modelo que estima o risco de um aluno abandonar o curso', 1, 'IA preditiva: analisa dados para prever.'],
  ['Uma casa que acende, aquece e tranca conforme os hábitos dos moradores', 2, 'Casa inteligente: sensores + aprendizado + ação.'],
  ['Envio automático de e-mail quando um formulário é preenchido', 0, 'Gatilho e ação fixos.'],
  ['Um filtro que aprende sozinho a reconhecer novos tipos de spam', 1, 'Adapta-se com a experiência.'],
], ['Pergunte: ele APRENDE? E ele PERCEBE o ambiente e AGE sozinho?', 'Só segue regra: automação. Aprende e infere: IA. Aprende, percebe por sensores e age: sistema inteligente.'], 'Automação executa regras predefinidas e não aprende. IA aprende, infere e decide com base em dados. Sistema inteligente combina automação, IA, sensores, dados e redes para perceber e agir.');
const partesPrompt = classifica('c3.prompt', 'c3.prompt', 'Um bom prompt tem contexto, objetivo e instrução clara. Cada trecho abaixo é qual parte?', ['Contexto', 'Objetivo', 'Instrução'], [
  ['"Sou líder de louvor de uma igreja pequena, com músicos iniciantes."', 0, 'Diz quem pede e em que situação.'],
  ['"Quero que o ensaio de quinta renda mais."', 1, 'Diz para que serve o resultado.'],
  ['"Monte um roteiro de 60 minutos, em tópicos, com o tempo de cada parte."', 2, 'Diz o que fazer e em que formato.'],
  ['"Somos uma loja de bairro que vende pelo Instagram."', 0, 'Situação de quem pede.'],
  ['"Preciso aumentar as vendas no Dia das Mães."', 1, 'A finalidade.'],
  ['"Escreva três legendas curtas, em tom informal, sem emojis."', 2, 'Tarefa e formato.'],
  ['"O público são alunos do primeiro semestre, que nunca programaram."', 0, 'Para quem é: contexto.'],
  ['"Responda em uma tabela de duas colunas."', 2, 'Formato da resposta: instrução.'],
], ['Contexto: a situação. Objetivo: para quê. Instrução: o que fazer e como entregar.', 'Quem, onde e para quem: contexto. A finalidade: objetivo. O verbo de comando e o formato: instrução.'], 'Contexto (a situação e o público), objetivo (para que serve) e instrução clara (a tarefa e o formato da resposta).');

// ---------- C4 ----------
const cotidiano = classifica('c4.cotidiano', 'c4.apps', 'Cada frase descreve qual conceito da U1?', ['Identidade digital', 'Tecnologia cognitiva', 'Internet das Coisas', 'Experiência do usuário'], [
  ['O conjunto do que você publica, comenta e curte, e a reputação que isso forma', 0, 'Conteúdos, interações e comportamento online.'],
  ['Um aplicativo de saúde que analisa seus dados e recomenda o que fazer', 1, 'Aprende com dados e apoia a decisão.'],
  ['Semáforos e sensores de trânsito trocando dados em tempo real', 2, 'Dispositivos e infraestrutura conectados.'],
  ['O site da loja carrega rápido e é fácil achar o botão de comprar', 3, 'Usabilidade, clareza, rapidez: UX.'],
  ['O perfil profissional que um recrutador encontra ao buscar o seu nome', 0, 'Como você é percebido no ambiente digital.'],
  ['Um aplicativo de tarefas que sugere o que priorizar hoje', 1, 'Extensão da capacidade de análise e decisão.'],
  ['Uma máquina da fábrica que avisa sozinha que vai precisar de manutenção', 2, 'Sensor conectado: manutenção preditiva.'],
  ['O cliente desiste da compra porque o cadastro é confuso', 3, 'Falha de experiência custa o consumidor.'],
], ['Pergunte do que a frase fala: de como você aparece, de um sistema que ajuda a pensar, de objetos conectados ou de facilidade de uso.', 'Identidade: sua imagem online. Cognitiva: apoia decisão. IoT: coisas com sensores em rede. UX: facilidade e qualidade do uso.'], 'Identidade digital é a sua representação online. Tecnologias cognitivas ampliam análise, aprendizado e decisão. IoT conecta sensores e dispositivos. Experiência do usuário é a qualidade do uso de um site ou aplicativo.');
const atores = classifica('c4.ator', 'c4.ecossistema', 'Cada contribuição é de qual ator do ecossistema de inovação?', ['Startups', 'Universidades', 'Governo', 'Investidores', 'Hubs'], [
  ['Criar soluções inovadoras e novos modelos de negócio', 0, 'É o papel das startups na questão do curso.'],
  ['Formar profissionais qualificados e produzir conhecimento', 1, 'Ensino e pesquisa.'],
  ['Formular políticas públicas e incentivos à inovação', 2, 'Regras, fomento e incentivo.'],
  ['Colocar capital de risco em negócios que podem crescer muito', 3, 'Dinheiro em troca de participação no crescimento.'],
  ['Integrar os atores, oferecer infraestrutura e apoiar o empreendedorismo', 4, 'O hub é o ponto de encontro.'],
  ['Testar uma hipótese de negócio com um produto mínimo', 0, 'Experimentação sob incerteza.'],
  ['Ajustar o currículo às demandas do mercado de tecnologia', 1, 'Aconteceu no caso Nova Esperança.'],
  ['Reduzir barreiras regulatórias e investir em infraestrutura digital', 2, 'Só o poder público faz isso.'],
  ['Escolher em quais startups apostar olhando a escalabilidade', 3, 'A escalabilidade é o atrativo para quem investe.'],
  ['Reunir mentores, empreendedores e empresas num mesmo espaço de cocriação', 4, 'Ambiente colaborativo e rede de mentoria.'],
], ['Quem cria o produto? Quem forma gente? Quem faz as regras? Quem põe o dinheiro? Quem junta todo mundo?', 'Startups: soluções. Universidades: conhecimento e gente. Governo: políticas. Investidores: capital. Hubs: integração.'], 'Startups criam soluções e modelos de negócio; universidades formam profissionais e produzem conhecimento; o governo faz políticas públicas e incentivos; investidores trazem capital; hubs integram os atores.');
const estagios = classifica('c4.estagio', 'c4.startups', 'Cada situação é de qual estágio de uma startup?', ['Ideação', 'Validação', 'Tração', 'Escala'], [
  ['A equipe pesquisa o público e define a proposta de valor', 0, 'Ainda não há produto: há um problema e uma ideia.'],
  ['Um produto mínimo viável (MVP) é testado com usuários reais', 1, 'O MVP é a marca da validação.'],
  ['A base de clientes cresce mês a mês e a receita aumenta', 2, 'O modelo funciona e ganha força.'],
  ['A empresa se expande para outros estados e países, com processos automatizados', 3, 'Expansão nacional ou internacional.'],
  ['Alguém percebe um problema real que ninguém resolveu', 0, 'A origem da ideia.'],
  ['A equipe descobre se as pessoas pagariam pela solução', 1, 'Verificar se o mercado quer.'],
  ['O modelo de negócio se consolida', 2, 'Consolidação vem com o crescimento.'],
  ['Milhões de usuários atendidos sem aumento proporcional dos custos', 3, 'É a escalabilidade acontecendo.'],
], ['A ordem é: ideia, teste, crescimento, expansão.', 'Problema e pesquisa: ideação. MVP e teste: validação. Clientes e receita crescendo: tração. Expansão: escala.'], 'Ideação (a ideia e o problema), validação (MVP testado com usuários reais), tração (crescimento de clientes e receita) e escala (expansão com apoio de tecnologia e automação).');
const principios = classifica('c4.lgpd', 'c4.lgpd', 'Cada situação fere principalmente qual princípio da LGPD?', ['Finalidade', 'Necessidade', 'Transparência', 'Segurança'], [
  ['A farmácia pede o CPF "para o desconto" e usa para montar um perfil de saúde e vender', 0, 'O uso real é outro, diferente do que foi dito.'],
  ['Um aplicativo de lanterna pede acesso aos seus contatos e à sua localização', 1, 'Dados que a função não exige.'],
  ['O site coleta dados e não diz em lugar nenhum o que faz com eles', 2, 'A pessoa não é informada.'],
  ['A planilha de clientes fica numa pasta aberta, sem senha', 3, 'Faltam medidas de proteção.'],
  ['A escola usa as fotos da matrícula numa propaganda, sem ter dito nada sobre isso', 0, 'Dado coletado para um fim, usado para outro.'],
  ['O cadastro de uma promoção exige renda e estado civil', 1, 'Coleta além do mínimo.'],
  ['Os termos de uso têm 40 páginas de linguagem jurídica que ninguém entende', 2, 'Informar de modo que ninguém entende não é informar.'],
  ['Todos os funcionários usam a mesma senha, que nunca foi trocada', 3, 'Falha de proteção técnica e administrativa.'],
], ['Usou para outra coisa? Pediu demais? Não explicou? Não protegeu?', 'Finalidade: propósito específico e informado. Necessidade: o mínimo. Transparência: informar com clareza. Segurança: proteger.'], 'Finalidade (propósito específico, sem desvio), necessidade (o mínimo de dados), transparência (informação clara à pessoa) e segurança (medidas de proteção).');

export const GERADORES_EXP: Record<string, Gerador> = { 'c4.cotidiano': cotidiano, 'c4.ator': atores, 'c4.estagio': estagios, 'c4.lgpd': principios, 'c3.tipo': tipoAprendizado, 'c3.autoia': autoOuIa, 'c3.prompt': partesPrompt, 'c1.vazao': vazaoDownload, 'c1.modelo': modeloNuvem, 'c1.rede': redes, 'c1.triade': triade, 'c2.digtrans': digOuTransf, 'c2.erpcrm': erpOuCrm, 'c2.rogers': dominios };
