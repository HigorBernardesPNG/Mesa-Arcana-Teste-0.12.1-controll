# 025 - Persistência local e campanha portátil

## Contexto

A Mesa Arcana já possui mapa, peças, jogadores, movimentação, iluminação, magias, efeitos persistentes e histórico. Manter esse estado apenas em memória passou a representar risco de perda da sessão e impedir a continuidade em outro computador.

## Decisão

A campanha passa a possuir duas formas complementares de persistência:

1. **Salvamento local no computador do Mestre**: arquivo `.mesaarcana` mantido fora do código-fonte, no diretório de dados do usuário.
2. **Exportação/Importação**: o mesmo formato pode ser baixado e transportado manualmente para outro computador.

O arquivo é autocontido nesta etapa. Imagens de mapa e tokens já processadas pela aplicação permanecem incorporadas no próprio estado da campanha.

## Regras

- O código LAN da sessão não é restaurado do arquivo; ao carregar, a campanha assume o código do servidor atualmente aberto.
- Jogadores persistidos são carregados como desconectados.
- Personagens de jogadores permanecem persistidos e podem ser escolhidos explicitamente na entrada da sessão; personagens já conectados ficam indisponíveis.
- Carregar ou importar outra campanha é bloqueado enquanto houver jogadores conectados.
- Após o primeiro salvamento local, alterações posteriores geram salvamento automático com atraso curto, evitando gravações a cada evento individual.
- Ao sobrescrever um salvamento local existente, é criada uma cópia `.backup` antes da nova gravação.
- O formato possui versão própria (`versaoFormato`) para permitir migrações futuras.

## Consequências

A campanha deixa de depender da memória do processo e passa a poder acompanhar o Mestre entre computadores sem exigir banco de dados remoto. Em etapa futura, o instalador do Mestre deverá configurar explicitamente o diretório de dados usando o diretório de usuário da aplicação.
