// Cartões de revisão de Exploração Digital. Entram desde já na revisão do dia,
// para as duas disciplinas ficarem misturadas mesmo antes de o Mundo 2 ter fases.
// Conteúdo conferido nas fontes (fontes/exploracao/U1…U8.txt).
import type { Card } from '../../engine/types';

const c = (regiao: string, pares: [string, string][]): Card[] => pares.map(([frente, verso], i) => ({ id: `${regiao}-c${i + 1}`, mundo: 'exp', regiao, frente, verso }));

export const CARDS_EXP: Card[] = [
  ...c('c1', [
    ['Largura de banda × latência', 'Banda = quanto passa por segundo. Latência = quanto demora para chegar. Videochamada sofre com latência; download sofre com banda.'],
    ['IaaS, PaaS, SaaS: o que cada um entrega?', 'IaaS: infraestrutura (você cuida do sistema operacional e da aplicação). PaaS: plataforma pronta para desenvolver. SaaS: software pronto para usar.'],
    ['Objetivo da segurança da informação', 'Confidencialidade, integridade e disponibilidade. A tríade.'],
    ['Modem, switch, roteador', 'Modem liga à operadora. Switch conecta dentro da rede local. Roteador decide o caminho entre redes.'],
    ['LAN, MAN, WAN', 'Rede local, metropolitana e de longa distância: classificação por abrangência geográfica.'],
    ['Escalabilidade na nuvem (definição do curso)', 'Aumentar ou reduzir rapidamente a capacidade conforme a demanda, sem grandes investimentos em infraestrutura física.'],
  ]),
  ...c('c2', [
    ['O que é um silo informacional?', 'Setor com sistema ou planilha isolada. Gera retrabalho, divergência de dados, atraso, custo e decisão com informação desatualizada.'],
    ['ERP × CRM', 'ERP olha para dentro (finanças, produção, logística, RH, compras). CRM olha para fora (vendas, marketing, atendimento). Juntos dão visão sistêmica.'],
    ['As três etapas do fluxo de dados', 'Entrada (coleta) → processamento → armazenamento. Falha em qualquer uma contamina a decisão.'],
    ['Data Warehouse × Data Lake × Lakehouse', 'Warehouse: dado estruturado. Lake: dado bruto. Lakehouse: híbrido. (Aparece no vídeo da U4.)'],
    ['Digitalização × transformação digital', 'Digitalização converte o analógico em digital. Transformação digital muda modelo de negócio, processos, cultura e criação de valor.'],
    ['Os cinco domínios de Rogers', 'Clientes, competição, dados, inovação e valor.'],
    ['Os três pilares da transformação digital (U2)', 'Integração de tecnologias emergentes; reengenharia de processos; foco na experiência do cliente com cultura de inovação e agilidade.'],
    ['Citação de Rogers (2017) para a A3', '"A transformação digital não é sobre tecnologia, mas sobre estratégia."'],
  ]),
  ...c('c3', [
    ['Automação × IA × sistema inteligente', 'Automação segue regra fixa e não aprende. IA aprende com dados e infere. Sistema inteligente = automação + IA + sensores e redes: percebe o ambiente e age.'],
    ['Os três tipos de aprendizado de máquina', 'Supervisionado, não supervisionado e por reforço.'],
    ['Algoritmos por tipo de aprendizado', 'Supervisionado: regressão linear e logística, árvore de decisão, k-NN. Não supervisionado: k-means, PCA. Reforço: Q-learning.'],
    ['O que é RPA?', 'Automação de Processos Robóticos: software que simula ações humanas em sistemas (preencher formulário, extrair dado). Automatiza processo estruturado; não é IA.'],
    ['IA estreita, geral e aplicada', 'Classificação por nível de complexidade e autonomia. (O curso lista os três tipos.)'],
    ['De onde vem o viés algorítmico?', 'Dos dados históricos de treinamento, que refletem desigualdades. Contramedidas do curso: transparência, auditoria de algoritmos e diversidade nas equipes.'],
    ['IA preditiva × IA generativa', 'Preditiva analisa dados para prever resultados. Generativa cria conteúdo novo (texto, imagem, código).'],
    ['As quatro técnicas de engenharia de prompt', 'Formulação clara e objetiva; exemplos para guiar; iteração e refinamento; validação e ajuste das respostas.'],
    ['Um prompt bem estruturado contém…', 'Contexto, objetivo e instrução clara.'],
    ['Webflow e Zapier fazem o quê?', 'Webflow: sites responsivos por edição visual. Zapier: integra aplicativos e automatiza tarefas entre plataformas, sem código.'],
    ['Citação de Gabriel (2021) sobre trabalho', '"O futuro do trabalho não é sobre humanos versus máquinas, mas sobre humanos com máquinas."'],
  ]),
  ...c('c4', [
    ['O que é identidade digital?', 'A representação de alguém no ambiente online: conteúdos publicados, interações e comportamento, não só os dados de cadastro.'],
    ['Objetivo da IoT em cidades inteligentes', 'Conectar dispositivos, serviços e infraestruturas urbanas para otimizar recursos, mobilidade e serviços públicos.'],
    ['Definição de startup (questão da U7)', 'Organização temporária em busca de um modelo de negócio inovador, escalável e repetível.'],
    ['Os quatro estágios de uma startup', 'Ideação → validação (MVP) → tração → escala.'],
    ['Os cinco atores do ecossistema de inovação', 'Startups, universidades, governo, investidores e empresas consolidadas.'],
    ['Os princípios da LGPD citados na U8', 'Finalidade, necessidade, adequação, transparência, segurança e responsabilização. Lei nº 13.709/2018.'],
    ['Os quatro pilares da governança algorítmica', 'Transparência, auditabilidade, explicabilidade e responsabilização.'],
    ['Por que o algoritmo não é neutro?', 'Porque depende dos dados de entrada, dos critérios de otimização e das finalidades de quem o criou.'],
    ['Citação de Gabriel (2021, p. 39) sobre neutralidade', '"A tecnologia não é neutra: ela reflete valores humanos e amplifica tanto nossos acertos quanto nossos erros."'],
  ]),
];
