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

export const GERADORES_EXP: Record<string, Gerador> = { 'c1.vazao': vazaoDownload, 'c1.modelo': modeloNuvem, 'c1.rede': redes, 'c1.triade': triade, 'c2.digtrans': digOuTransf, 'c2.erpcrm': erpOuCrm, 'c2.rogers': dominios };
