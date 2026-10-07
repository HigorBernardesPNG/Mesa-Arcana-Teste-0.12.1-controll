# Etapa 4.6 — layout flexível e seleção de magias

## Objetivo

Refinar a usabilidade sem alterar o foco da plataforma como apoio visual da campanha.

## Layout redimensionável

- Mestre e jogador podem redimensionar as laterais esquerda e direita arrastando divisores verticais.
- A área principal do mapa cresce ou diminui automaticamente conforme os painéis laterais mudam de tamanho.
- A área inferior também pode ser redimensionada verticalmente.
- A divisão entre ações/magias e histórico também pode ser redimensionada horizontalmente.
- As proporções escolhidas são salvas no `localStorage` do navegador de cada dispositivo.
- O botão `Layout` restaura as proporções padrão.
- Em telas pequenas, o layout permanece responsivo e empilhado; os divisores não são exibidos.

## Seleção de magias

A lista completa elegível não fica mais permanentemente visível durante a sessão. O jogador escolhe quais magias deseja manter na barra visual.

A elegibilidade continua limitada por:

- classe;
- nível;
- raça.

O seletor permite pesquisa por nome e apresenta marcadores visuais para:

- Truque;
- Magia por nível;
- Ação bônus;
- Magia racial.

A seleção é armazenada no estado da sessão e validada pelo servidor. Uma magia não selecionada não pode ser conjurada pela interface.

## Magias raciais incluídas nesta etapa

Com base no Livro do Jogador utilizado pelo projeto:

- Alto Elfo: escolha de um truque da lista de Mago;
- Drow: Globos de Luz; Fogo das Fadas a partir do nível 3; Escuridão a partir do nível 5;
- Tiefling: Taumaturgia; Repreensão Infernal a partir do nível 3; Escuridão a partir do nível 5.

Nenhuma magia racial foi presumida para raças cujo texto base não concede magia diretamente. Habilidades raciais que não sejam magias ficam fora deste módulo.

## Decisão de escopo

A seleção da barra não tenta reproduzir regras completas de magias conhecidas, preparadas ou espaços de magia. Ela serve apenas para escolher quais ações mágicas visuais estarão acessíveis durante a sessão.
