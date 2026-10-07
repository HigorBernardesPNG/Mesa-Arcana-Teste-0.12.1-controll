# Etapa 4.6.2 - deslocamento efetivo e visibilidade de magias

## Implementado

- preservação do deslocamento base racial;
- edição do deslocamento efetivo pelo próprio jogador;
- restauração rápida do valor racial;
- movimento restante recalculado pelo valor efetivo;
- registro da alteração no histórico;
- manutenção das diferenças raciais/sub-raciais de deslocamento e visão;
- validação de alcance de magia no cliente e no servidor;
- identificação de magias cuja descrição exige que o conjurador possa ver o alvo/ponto;
- bloqueio dessas magias quando o alvo/ponto não está visível para aquele personagem;
- integração da validação com luz plena, penumbra, escuridão, visão no escuro, visão no escuro superior, fontes de luz e escuridão mágica;
- mensagem visual explicando por que uma magia não pode ser conjurada.

## Limite atual

A plataforma ainda não possui paredes/obstáculos estruturais no mapa. Portanto, cobertura total e linha de efeito física não são calculadas automaticamente nesta etapa.
