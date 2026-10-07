# 021 - Variações raciais e ações raciais

## Decisão

A plataforma diferencia a raça base das escolhas internas dessa raça.

O campo técnico genérico é `varianteRacialPersonagem`, mas a interface usa o termo correto conforme o caso:

- **Sub-raça** para Anão, Elfo, Halfling e Gnomo;
- **Ancestral dracônico** para Draconato.

## Motivo

Nem todas as escolhas internas de uma raça são juridicamente ou mecanicamente equivalentes dentro das regras. O Draconato do Livro do Jogador não possui sub-raças nesse ponto: ele escolhe um ancestral dracônico, que determina resistência e a forma/tipo da Arma de Sopro.

## Regras visuais implementadas

- Anão: Colina ou Montanha;
- Elfo: Alto Elfo, Elfo da Floresta ou Drow;
- Halfling: Pés-Leves ou Robusto;
- Gnomo: Floresta ou Rochas;
- Draconato: Azul, Branco, Bronze, Cobre, Latão, Negro, Ouro, Prata, Verde ou Vermelho.

A variação pode alterar deslocamento, visão e recursos raciais usados pela plataforma.

## Sopro Dracônico

O Sopro Dracônico é tratado como **Ação racial**, não como magia. Ele é exibido no painel de ações do personagem e usa área visual de cone ou linha conforme o ancestral escolhido.

A plataforma não rola dano, não calcula CD e não controla automaticamente a recarga por descanso. Ela mostra a área, tipo de dano, teste indicado e dado de dano de referência conforme o nível, registrando o uso no histórico.
