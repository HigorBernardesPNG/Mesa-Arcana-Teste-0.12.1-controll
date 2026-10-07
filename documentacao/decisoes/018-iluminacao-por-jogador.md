# 018 - Iluminação calculada por jogador

## Decisão

O servidor mantém o estado global do ambiente, tochas e magias. A interface calcula a apresentação visual conforme o personagem do jogador.

## Motivo

Uma fonte de luz deve ser compartilhada por todos, enquanto a capacidade de enxergar no escuro pertence ao observador. Separar fonte global e percepção individual evita duplicar estados incompatíveis entre jogadores.

## Regras adotadas

- luz plena, penumbra e escuridão são estados ambientais;
- tochas e magias podem elevar a iluminação local;
- visão no escuro modifica somente a percepção do personagem;
- escuridão mágica impede a visão no escuro comum;
- o Mestre não perde sua visão administrativa e dispõe de prévia opcional.
