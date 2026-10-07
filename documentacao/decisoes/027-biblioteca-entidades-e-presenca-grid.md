# 027 — Biblioteca de entidades e presença no grid

## Decisão
Uma entidade pertence à campanha independentemente de estar atualmente posicionada no grid.

- **Retirar do grid** preserva a entidade, token e configurações na biblioteca da campanha.
- **Colocar no grid** procura uma posição livre e devolve a entidade à cena.
- **Excluir da campanha** é uma ação distinta e definitiva.
- Personagens de jogadores seguem a mesma regra de presença. A exclusão definitiva continua bloqueada enquanto o jogador estiver conectado.
- NPCs e monstros podem ser criados em lote, compartilhando a mesma imagem de token.
- Se não houver espaço para todas as cópias criadas, as excedentes permanecem na biblioteca.

## Motivo
O Mestre precisa preparar e alternar criaturas de uma cena sem recadastrar tokens, e encontros com criaturas repetidas não devem exigir criação manual peça por peça.
