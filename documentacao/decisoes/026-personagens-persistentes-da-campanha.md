# 026 — Personagens persistentes da campanha

## Decisão
Personagens de jogadores pertencem à campanha, não à conexão de rede. Ao salvar uma campanha, o registro do jogador e seu token permanecem persistidos mesmo quando ele está desconectado.

## Entrada na sessão
Depois de informar um código de sessão válido, a interface oferece os personagens já salvos naquela campanha. Um personagem conectado aparece como indisponível. O jogador pode escolher um personagem existente ou criar um novo.

Ao recuperar um personagem salvo, são reaproveitados token, raça/variante, classe, nível, seleção de magias, deslocamento efetivo e demais dados persistidos no estado da campanha.

## Remoção pelo Mestre
O Mestre pode remover um personagem desconectado da campanha. A remoção exclui tanto o token quanto o registro persistido do jogador e limpa vínculos de iluminação e efeitos mágicos associados. Um personagem em uso não pode ser removido até o jogador sair da sessão.

## Motivo
A identidade do personagem deve sobreviver à sessão de rede e acompanhar o arquivo `.mesaarcana`, permitindo continuar a campanha em outro dia ou computador sem reconstruir os personagens.
