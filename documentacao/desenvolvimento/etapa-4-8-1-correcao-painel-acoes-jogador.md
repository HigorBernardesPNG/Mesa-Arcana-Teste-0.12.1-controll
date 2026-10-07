# Etapa 4.8.1 - Correção do painel Ações e Magias do jogador

## Objetivo

Corrigir a composição visual do painel inferior do Jogador sem alterar comportamento funcional.

## Problema identificado

A classe histórica `painel-acoes-completas` ainda mantinha uma grade em duas colunas. Na Etapa 4.8 o novo painel passou a usar cabeçalho e conteúdo em linhas, mas a definição antiga de colunas continuava ativa. Isso comprimida o cabeçalho na esquerda e o conteúdo na direita, favorecendo sobreposição quando ações raciais e ataques visuais coexistiam.

## Correção

- o painel do Jogador força uma única coluna;
- cabeçalho e conteúdo ficam em linhas independentes;
- o conteúdo possui scroll vertical próprio;
- o painel de ações usa fluxo vertical, evitando compressão dos cards;
- ataques visuais usam grid responsivo;
- ações raciais possuem bloco próprio com altura natural;
- no mobile, ações e magias ficam em uma coluna com scroll limitado à área do painel.

## Regra preservada

A alteração é exclusivamente de UI/UX. Permissões, alcance, movimento, magias, visão, iluminação, histórico e sincronização permanecem inalterados.
