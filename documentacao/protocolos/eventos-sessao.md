# Eventos da sessão

## Sessão

- `sessao:listar-personagens-salvos`
- `sessao:entrar`
- `sessao:sincronizar-jogador`
- `sessao:sincronizar-mestre`
- `sessao:mestre-configurar-campanha`
- `sessao:mestre-avancar-rodada`
- `sessao:estado-jogador-atualizado`
- `sessao:estado-mestre-atualizado`

## Personagem

- `personagem:configurar-deslocamento`

O jogador só pode alterar o deslocamento efetivo da própria peça. O deslocamento base racial permanece preservado como referência.

## Mapa

- `mapa:mover-entidade`
- `mapa:mestre-mover-entidade`
- `mapa:mestre-alterar-tema`
- `mapa:mestre-configurar`
- `mapa:mestre-adicionar-entidade`
- `mapa:mestre-atualizar-entidade-privada`
- `mapa:mestre-definir-morte`
- `mapa:mestre-remover-entidade` — também remove personagem persistido quando o jogador está desconectado

## Ações visuais

- `combate:executar-acao`
- `combate:mestre-executar-acao`
- `combate:efeito-visual`

As ações visuais não calculam acerto ou dano. O servidor apenas valida autoria e alvo, distribui o efeito e registra a ação no histórico.

## Magias

- `magia:configurar-selecao`
- `magia:conjurar`
- `magia:efeito-visual`
- `magia:encerrar-efeito`

O jogador só pode conjurar usando sua própria peça. O servidor valida raça, classe, nível, seleção visual, alcance e área antes de publicar o efeito. Quando a descrição da magia exige visão, o servidor também valida a iluminação percebida pelo conjurador naquele ponto/alvo. A plataforma não controla espaços de magia, preparação, dano ou testes de resistência. Magias não instantâneas permanecem no estado da sessão e têm seu tempo de jogo reduzido conforme o Mestre avança as rodadas.
