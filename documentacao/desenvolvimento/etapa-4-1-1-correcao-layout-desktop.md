# Etapa 4.1.1 — Correção do layout desktop

## Problema observado

Com a ampliação dos controles da lateral do mestre, o conteúdo lateral passou a definir a altura da linha principal do CSS Grid. A área central do mapa mantinha altura vinculada à viewport, o que criava uma grande região vazia abaixo do mapa no desktop.

## Correção

- A região principal no desktop passa a ter altura controlada pela viewport.
- Painéis laterais possuem rolagem vertical independente quando o conteúdo excede a área disponível.
- A mesa central ocupa 100% da altura útil da região principal.
- O comportamento móvel permanece inalterado, com altura própria para o mapa e fluxo vertical natural.

## Resultado esperado

No desktop, mapa, lateral esquerda e lateral direita permanecem alinhados na mesma altura visual, sem vazio abaixo da área central.
