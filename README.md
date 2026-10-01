# Trilha Ulife

Jogo de estudo para duas disciplinas de ADS (USJT, 2º semestre): **Matemática Computacional Aplicada** e **Exploração Digital**. Ensina do zero, com aulas curtas, exercícios conferidos por código e ilustrações que você mexe com o dedo.

Funciona no celular e no computador, e continua funcionando sem internet depois da primeira visita.

## O que já está pronto

| Região | Conteúdo | Situação |
| --- | --- | --- |
| M1 | Conjuntos e funções (U1) | pronta |
| M2 | Lógica e álgebra booleana (U2 + U3) | pronta |
| M3 | Contagem (U4) | pronta |
| M4 | Probabilidade (U5) | pronta |
| M5 | Álgebra linear (U6), com o caso Telecom | pronta |
| M6 | Grafos (U7) | pronta |
| M7 | Integração: indução, recorrência e Aegis-Grid (U8) | pronta |
| Simulados | A1 dissertativa e A2 objetiva (duas versões) de Matemática | prontos |
| C1 a C4 | Exploração Digital | em obras (só os cartões de revisão) |

Cada região pronta tem aulas que ensinam do zero, laboratório, resumo, questões reais da plataforma (com a fonte) e um chefão.

Ilustrações vivas prontas (13): Venn vivo, Máquina de funções, Painel de interruptores, Bancada de circuitos, Árvore de contagem, Simulador de probabilidade, Plano de vetores, Transformação por matriz, Retas do sistema, Editor de grafos, Dominós da indução e Aegis-Grid. Todas ficam também em **Mais → Brincar**, em modo livre.

## Como abrir no computador

Você precisa do **Node.js** instalado (versão 20 ou mais nova). Para conferir, abra o PowerShell e digite:

```
node --version
```

Se aparecer um número (por exemplo `v22.11.0`), está instalado. Se der erro, baixe em https://nodejs.org (botão "LTS") e instale com as opções padrão.

Depois, no PowerShell:

```
cd C:\Faculdade\estudo-ulife
npm install
npm run dev
```

O que cada linha faz:

- `cd C:\Faculdade\estudo-ulife` entra na pasta do jogo.
- `npm install` baixa as peças de que o jogo depende. Só precisa na primeira vez (demora um ou dois minutos).
- `npm run dev` liga o jogo. Vai aparecer um endereço parecido com `http://localhost:5173`. Abra esse endereço no navegador.

Para desligar, volte ao PowerShell e aperte `Ctrl + C`.

## Como abrir no celular (mesma rede Wi-Fi)

```
npm run celular
```

Vai aparecer uma linha `Network: http://192.168.x.x:5173`. Digite esse endereço no navegador do celular. O computador precisa ficar ligado, e os dois aparelhos na mesma rede Wi-Fi.

Desse jeito o progresso do celular e o do computador ficam separados. Para levar de um para o outro, use **Mais → Ajustes → Exportar progresso** num aparelho e **Importar** no outro.

Para usar no celular sem depender do computador, publique o jogo (próxima seção).

## Como publicar (GitHub Pages, de graça)

Publicar dá ao jogo um endereço na internet. Aí você abre no celular em qualquer lugar e pode "instalar" como aplicativo (no navegador: menu → "Adicionar à tela inicial").

O material do curso (pastas `fontes` e `referencia`) **não** é enviado: essas pastas estão na lista do arquivo `.gitignore`. Só o jogo vai.

1. Crie uma conta em https://github.com, se ainda não tiver.
2. No GitHub, clique em **New repository**. Nome: `trilha-ulife`. Deixe **Public** e não marque mais nada. Clique em **Create repository**.
3. Instale o Git, se não tiver: https://git-scm.com/download/win (opções padrão).
4. No PowerShell, dentro da pasta do jogo, rode uma linha de cada vez (troque `SEU-USUARIO` pelo seu nome de usuário do GitHub):

```
git init -b main
git add .
git commit -m "Trilha Ulife"
git remote add origin https://github.com/SEU-USUARIO/trilha-ulife.git
git push -u origin main
```

   - `git init -b main` transforma a pasta num projeto Git.
   - `git add .` e `git commit` guardam uma "foto" de todos os arquivos.
   - `git remote add` diz para onde enviar.
   - `git push` envia. Na primeira vez o GitHub pede login numa janela do navegador.

5. No GitHub, abra o repositório e vá em **Settings → Pages**. Em **Source**, escolha **GitHub Actions**.
6. Vá na aba **Actions**. Vai haver uma execução chamada "Publicar no GitHub Pages". Quando ficar verde (uns 2 minutos), o jogo está em:

```
https://SEU-USUARIO.github.io/trilha-ulife/
```

Para publicar uma versão nova depois de qualquer mudança:

```
git add .
git commit -m "atualização"
git push
```

Observação: o repositório público deixa o código do jogo visível para qualquer pessoa. O seu progresso não vai junto: ele fica guardado só no navegador de cada aparelho.

## Seu progresso

- Fica salvo no navegador do aparelho (não em servidor).
- **Faça backup**: Mais → Ajustes → Exportar progresso. Isso baixa um arquivo `.json`. O painel inicial avisa há quantos dias foi o último backup.
- Limpar os dados do navegador apaga o progresso. O arquivo de backup traz de volta.

## Para quem for mexer no código

```
npm test          # roda os testes (gabaritos, geradores, salvamento, telas)
npm run build     # confere os tipos e gera a versão final na pasta dist
npm run preview   # serve a pasta dist, como ficaria publicado
npm run verificar # só o teste que confere os erros apontados no material do curso
```

Onde fica cada coisa:

- `src/content/mat/` e `src/content/exp/`: as aulas, questões e cartões de cada região.
- `src/content/erros.ts`: a lista de erros encontrados no material do curso.
- `src/engine/`: correção de exercícios e geradores de exercícios com números novos.
- `src/components/toys/`: as ilustrações vivas. Todas usam a base `src/components/Sandbox.tsx` (desfazer, resetar, modo livre e desafio, "prever antes", arrasto com dedo e mouse).
- `src/lib/`: a matemática (lógica, conjuntos, funções, circuitos), datas das provas, revisão espaçada e salvamento.
- `src/tests/`: os testes.

Como o conteúdo é escrito: cada conceito é uma aula em telas curtas, que parte de uma situação concreta, constrói a ideia com um exemplo pequeno, só então dá nome e símbolo, e faz uma pergunta de checagem a cada uma ou duas telas. A ficha-resumo fecha a aula. Questões tiradas da plataforma citam a fonte (unidade e seção).
