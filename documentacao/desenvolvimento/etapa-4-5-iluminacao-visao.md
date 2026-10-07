# Etapa 4.5 - Iluminação e visão

Implementado:

- três níveis de iluminação ambiente: luz plena, penumbra e escuridão;
- visão individual do jogador calculada a partir da iluminação, posição e raça;
- visão no escuro racial de 18 m e visão superior do Drow de 36 m;
- suporte à magia Visão no Escuro (18 m durante o efeito);
- tochas vinculadas à peça, com 6 m de luz plena e 6 m adicionais de penumbra;
- duração da tocha integrada ao relógio de rodadas da sessão;
- fontes mágicas persistentes de luz: Luz, Luz do Dia, Criar Chamas, Chama Contínua, Escudo de Fogo e representação simplificada de Globos de Luz;
- Escuridão mágica bloqueia visão no escuro e luz não mágica dentro da área;
- interação entre Escuridão e fontes mágicas de luz conforme nível quando a sobreposição pode ser determinada pelo grid;
- pré-visualização opcional da iluminação para o Mestre;
- histórico de mudanças ambientais e fontes de luz.

## Decisão visual

A iluminação é calculada casa a casa. Isso mantém o sistema coerente com o grid de 1,5 m já adotado e evita criar uma engine gráfica paralela apenas para luz.

A visão do Mestre continua administrativa por padrão. O Mestre só recebe o escurecimento do mapa quando ativa a prévia de iluminação.

A visão dos jogadores é sempre aplicada automaticamente.
