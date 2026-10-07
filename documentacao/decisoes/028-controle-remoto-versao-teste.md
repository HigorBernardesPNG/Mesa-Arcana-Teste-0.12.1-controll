# 028 — Controle remoto da distribuição de teste

## Decisão

A distribuição **Mesa Arcana Teste** consulta obrigatoriamente um JSON remoto antes de iniciar. O endereço padrão é:

`https://mesa-arcana-controle.vercel.app/controle.json`

A versão interna do criador permanece independente desse mecanismo.

## Comportamento

- consulta única na abertura;
- falha fechada: sem internet ou sem JSON válido, não abre;
- `aplicativoAtivo: false` bloqueia todas as versões de teste;
- a versão `0.12.1-teste.1` precisa existir e estar com `ativo: true`;
- após a autorização, a sessão funciona pela LAN sem novas consultas durante a partida.

## Limite conhecido

O mecanismo é um kill switch de distribuição controlada, não um sistema de licenciamento inviolável. Ele atende ao objetivo atual de permitir revogação simples de uma versão compartilhada.
