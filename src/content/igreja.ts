// Exemplos da igreja que vêm ANTES de uma explicação cujo exemplo é de empresa (clientes, campanha, servidor).
// Só nas regiões da A1: M1, M2, M3, C1, C2 e a U1 da C4. As questões do curso e as contas não mudam; o exemplo do curso continua depois.
// `antes` é o começo do texto da tela que passa a vir depois do exemplo da igreja. content/index.ts aplica.
import type { Phase, Regiao } from '../engine/types';
import { texto } from './ajuda';

type Insercao = { antes: string; md: string };

export const EXEMPLOS_IGREJA: Record<string, Insercao[]> = {
  'm1-conj': [{
    antes: '**O problema.** Uma empresa vende dois produtos',
    md: '**Na igreja primeiro.** O coral tem Ana, Bia, Caio e Davi. A banda tem Caio, Davi e Eli.\n\n- Quem está nos dois (E)? Caio e Davi.\n- Quem está em pelo menos um (OU)? Os cinco, sem repetir ninguém.\n- Quem é só do coral (E NÃO)? Ana e Bia.\n\nSão as operações desta aula. A seguir, a mesma estrutura no exemplo do curso: uma empresa e dois produtos.',
  }],
  'm1-comp': [{
    antes: '**O problema.** Um sistema processa um dado',
    md: '**Na igreja primeiro.** O louvor tem $n$ músicas de 4 minutos cada. A função $f(n) = 4n$ dá o tempo cantando. Depois a função $g(t) = t + 10$ soma 10 minutos de oração. Com 5 músicas: $g(f(5)) = g(20) = 30$ minutos.\n\nInverter a ordem seria somar 10 **músicas** antes de converter em minutos: $f(g(5)) = f(15) = 60$. Não é a mesma coisa: na composição, a ordem importa.',
  }],
  'm2-cond': [{
    antes: '**Condicional.** A frase "se p, então q"',
    md: '**Na igreja:** "Se for Santa Ceia, então o culto começa às 18h30." A promessa só é quebrada num caso: **é** Santa Ceia e o culto **não** começa às 18h30. Num domingo comum, qualquer horário respeita a frase. É a mesma ideia da promessa do violão.',
  }],
  'm2-tabela': [{
    antes: '**O problema.** Uma casa inteligente',
    md: '**Na igreja primeiro.** A mesa de som tem 3 canais (voz, violão e teclado), cada um ligado ou mudo. Para testar a regra de volume em todas as situações, quantas combinações existem? $2 \\cdot 2 \\cdot 2 = 8$. A tabela-verdade é essa lista de 8 situações.',
  }],
  'm2-bool': [{
    antes: '**O E vira multiplicação.**',
    md: '**Na mesa de som:** canal ligado = 1, mudo = 0; o master também. Só sai som se o canal **E** o master estiverem ligados: $C \\cdot M$ vale 1 só quando os dois valem 1. Com dois microfones, sai som se um **OU** o outro estiver ligado. Vamos dar nome a isso.',
  }],
  'm2-leis': [{
    antes: '**Duas leis que só existem aqui.**',
    md: '**Na escala:** "toca quem ensaiou, **ou** quem ensaiou e é o líder". O segundo grupo nunca acrescenta ninguém: quem ensaiou já toca. Em símbolos, $E + E \\cdot L = E$. É a absorção, que aparece logo a seguir.',
  }],
  'm2-sop': [{
    antes: '**O problema ao contrário.**',
    md: '**Na igreja primeiro.** O refletor do palco tem dois interruptores, um na porta e outro no palco. Apertar qualquer um deles **muda** o estado da luz: ela fica acesa quando os dois estão em posições **diferentes**. Dizer a tabela é fácil; achar a expressão é o difícil. É isso que esta aula ensina.',
  }],
  'm2-circuitos': [{
    antes: '**Multiplexador: uma chave que escolhe.**',
    md: '**Na igreja primeiro.** O telão mostra a câmera do culto (B) ou a letra da música (C), conforme uma chave A: com A = 1 mostra a câmera, com A = 0 mostra a letra. Uma chave que escolhe entre duas entradas é o multiplexador que vem a seguir.',
  }],
  'm3-ordem': [{
    antes: '**O problema.** Na aula passada você ordenava',
    md: '**Na igreja primeiro.** O líder escolhe 4 músicas entre 10, **na ordem em que serão cantadas**: $10 \\cdot 9 \\cdot 8 \\cdot 7 = 5040$ (arranjo: a ordem importa). Escolher 3 entre 10 pessoas para a recepção, sem cargo diferente, dá $C(10, 3) = 120$ (combinação). A pergunta que decide é: **a ordem importa?**',
  }],
  'c1-redes': [{
    antes: '**Os três aparelhos.**',
    md: '**Na igreja:** o **modem** liga a rede da igreja à operadora. O **switch** liga as câmeras e o computador da mesa de transmissão entre si, dentro do prédio. O **roteador** decide por onde o vídeo sai para a internet.',
  }],
  'c1-nuvem': [{
    antes: '**Os três modelos (é do curso).**',
    md: '**Na igreja:** guardar as fotos dos cultos num serviço de armazenamento pago por mês é **SaaS** (software pronto). Alugar uma máquina virtual para rodar o sistema de cadastro dos membros é **IaaS**. O que muda é quanto da pilha a igreja ainda precisa cuidar.',
  }],
  'c1-seguranca': [{
    antes: '**As ferramentas.**',
    md: '**Na igreja:** o cadastro de membros fica no computador da secretaria. **Autenticação**: cada pessoa entra com a sua senha. **Controle de acesso**: o voluntário vê a escala, mas só a secretaria vê endereço e telefone. **Criptografia**: a cópia de segurança vai embaralhada.',
  }],
  'c2-silos': [{
    antes: '**O problema (é o disparador da U4).**',
    md: '**Na igreja primeiro.** A tesouraria controla as ofertas numa planilha, a secretaria guarda os membros em outra e o louvor monta a escala num grupo de mensagens. Alguém troca de telefone e só a secretaria fica sabendo: a escala não chega até a pessoa. Ninguém errou; as informações é que não se falam. A seguir, o mesmo problema numa empresa.',
  }],
  'c2-transformacao': [{
    antes: '**O problema (é o disparador da U2).**',
    md: '**Na igreja primeiro.** Passar a lista de presença do caderno para uma planilha é **digitalizar**: o processo é o mesmo, só mudou o suporte. Usar essa presença para perceber quem faltou três domingos seguidos e procurar a pessoa muda a forma de cuidar: isso já se aproxima de **transformar**.',
  }],
  'c4-redes': [{
    antes: '**O problema.** Você abre uma rede social',
    md: '**Na igreja primeiro.** O perfil do ministério posta o ensaio, o aviso da escala e a foto do culto. A rede mostra primeiro o que gera mais curtida, e o aviso da escala afunda. Quem decidiu isso? Nem o ministério nem você: foi o critério de ordenação da plataforma.',
  }],
  'c4-cidade': [{
    antes: '**O problema.** Conte quantas coisas',
    md: '**Na igreja primeiro.** Inscrição no retiro pelo aplicativo, oferta por Pix, culto ao vivo no celular, aviso da escala por mensagem. Cada uma dessas coisas era antes um lugar: a secretaria, a tesouraria, o templo. Os aplicativos passaram a ocupar um papel central.',
  }],
};

/** Devolve a região com os exemplos da igreja colocados antes da explicação de empresa que cada um acompanha. */
export const comIgreja = (r: Regiao): Regiao => ({
  ...r,
  fases: r.fases.map((f): Phase => {
    const ins = EXEMPLOS_IGREJA[f.id];
    if (!ins) return f;
    const steps = [...f.steps];
    for (const { antes, md } of ins) {
      const i = steps.findIndex((s) => s.t === 'texto' && s.md.startsWith(antes));
      if (i < 0) throw new Error(`exemplo da igreja: não achei "${antes}" em ${f.id}`);
      steps.splice(i, 0, texto(md));
    }
    return { ...f, steps };
  }),
});
