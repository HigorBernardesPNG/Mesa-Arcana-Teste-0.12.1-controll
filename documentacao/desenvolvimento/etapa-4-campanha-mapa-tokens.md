# Etapa 4 — Campanha, mapa e tokens

## Entrega

- nome da campanha editável pelo mestre;
- QR Code e link de convite;
- importação de imagem como mapa;
- configuração de colunas, linhas e visibilidade do grid;
- inclusão de personagens, NPCs e monstros como peças;
- imagem personalizada para tokens;
- movimentação sincronizada preservada;
- mapa e tokens enviados para os jogadores em tempo real;
- dados privados do mestre continuam fora da visão do jogador.

## Tratamento das imagens

As imagens são redimensionadas no navegador antes do envio. Mapas usam limite visual de 1920 px no maior lado e tokens 512 px. Nesta etapa os arquivos permanecem em memória; persistência em disco será tratada na etapa própria de salvamento.

## Validação manual

1. Definir nome da campanha.
2. Importar uma imagem de mapa.
3. Alterar linhas e colunas do grid.
4. Abrir a sessão em outro dispositivo e confirmar o mesmo mapa.
5. Adicionar NPC e monstro com imagem de token.
6. Movimentar as peças e confirmar sincronização.
7. Confirmar que PV de monstro continua invisível ao jogador.
8. Entrar por QR Code ou link sem digitar IP.
