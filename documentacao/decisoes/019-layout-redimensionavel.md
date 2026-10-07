# 019 — Layout redimensionável por dispositivo

## Decisão

Os painéis principais do Mestre e do Jogador podem ser redimensionados por divisores de arraste.

## Motivo

O mapa deve continuar sendo o elemento central, mas diferentes momentos da sessão exigem mais espaço para histórico, ações, configurações ou informações contextuais.

## Consequências

- O redimensionamento reorganiza o mesmo grid, sem sobreposição dos painéis.
- As preferências de tamanho são locais ao dispositivo e não fazem parte do estado compartilhado da campanha.
- Em telas móveis, o layout responsivo tem prioridade e os divisores são desativados.
