# 022 - Deslocamento efetivo e visibilidade das magias

## Decisão

A entidade do jogador mantém dois valores distintos:

- `deslocamentoBase`: referência derivada da raça/sub-raça;
- `deslocamento`: valor efetivo usado pela sessão e editável pelo próprio jogador.

O valor efetivo continua respeitando a escala do tabuleiro, com passos de 1,5 metro. Alterar o valor não muda a referência racial e pode ser revertido pelo botão de restauração do padrão.

## Motivo

O deslocamento pode sofrer modificadores externos à raça, como armadura, condições, características de classe, magias e decisões da própria mesa. A plataforma deve apoiar a representação visual sem tentar substituir a ficha completa.

## Conjuração

O servidor continua sendo a fonte oficial da validação. Para uma magia ser aceita:

1. ela precisa estar disponível e selecionada pelo personagem;
2. o ponto/alvo precisa estar dentro do alcance quando a magia possuir alcance mensurável;
3. quando a descrição da magia exigir explicitamente que o conjurador possa ver o alvo ou ponto, a iluminação percebida por aquele personagem também é validada;
4. escuridão total sem recurso de visão suficiente bloqueia essas magias;
5. visão no escuro racial ou mágica permite a conjuração dentro do respectivo alcance;
6. escuridão mágica continua bloqueando visão no escuro comum.

A existência de paredes e cobertura total ainda não é automatizada porque o mapa atual não possui uma camada estrutural de obstáculos. Essa validação ficará para a etapa em que paredes/obstáculos forem modelados.
