# Etapa 4.1.4 — Fundo do grid

A imagem do mapa deve preencher integralmente a area visual do grid em qualquer tamanho de tela.

## Decisao

O fundo usa `background-size: 100% 100%`. Assim, desktop e mobile exibem a imagem ocupando toda a area do tabuleiro, e o mestre ajusta linhas e colunas do grid sobre essa representacao.

Esta decisao aceita alteracao de proporcao da imagem quando a proporcao do tabuleiro for diferente da imagem original, pois a prioridade do produto e o preenchimento integral do grid.
