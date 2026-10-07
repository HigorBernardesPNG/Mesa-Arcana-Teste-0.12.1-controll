# Requisitos funcionais

## Campanha

- Criar nova campanha.
- Carregar campanha existente.
- Salvar campanha localmente.
- Manter salvamento automático após a campanha possuir um arquivo local.
- Carregar campanhas salvas no computador do Mestre.
- Exportar e importar campanha em arquivo `.mesaarcana` para transporte entre computadores.
- Restaurar personagens persistidos quando o mesmo jogador retornar à campanha.

## Sessão

- Mestre iniciar sessão em rede local.
- Gerar código, link e QR Code de acesso.
- Jogador entrar pelo navegador sem configuração técnica de rede.
- Exibir participantes conectados.

## Mestre

- Alterar mapa de fundo e configurar grid.
- Inserir e controlar NPCs e monstros.
- Manter dados privados de NPCs e monstros fora da visão dos jogadores.
- Executar ações visuais usando NPCs e monstros.
- Marcar uma peça como morta ou ativa.
- Consultar histórico da sessão.
- Redimensionar os painéis principais sem sobrepor o mapa.
- Dispor de uma central de ações de combate visual com movimentação e ataques em destaque.
- Manter PV, CA, bônus e dano como apoio opcional/recolhido, sem competir com o mapa e a movimentação.
- Definir o nível de iluminação ambiente do mapa.
- Pré-visualizar a iluminação percebida pelos jogadores sem limitar a visão administrativa do mestre.
- Acender ou apagar tochas vinculadas às entidades sob seu controle.

## Jogador

- Visualizar mapa e grid.
- Controlar apenas a própria peça.
- Visualizar o deslocamento base racial e ajustar o deslocamento efetivo usado pela sessão.
- Restaurar o deslocamento efetivo ao padrão racial quando necessário.
- Informar raça, eventual sub-raça/ancestral, classe e nível somente para recursos visuais dependentes dessas informações.
- Executar ações visuais do próprio personagem.
- Selecionar sub-raça quando a raça possuir essa escolha.
- Selecionar Ancestral Dracônico quando usar Draconato.
- Pré-visualizar e executar visualmente o Sopro Dracônico conforme o ancestral escolhido.
- Visualizar magias compatíveis com sua classe, nível e raça.
- Pesquisar no catálogo elegível e escolher quais magias permanecem visíveis durante a sessão.
- Identificar visualmente Truques, Magias, Ações bônus e Magias raciais.
- Redimensionar os painéis principais sem sobrepor o mapa.
- Dispor de uma área ampla de Ações e Magias, priorizando leitura de alcance, área e categoria.
- Pré-visualizar alcance e área de magias no grid.
- Impedir conjuração fora do alcance definido pela magia.
- Quando a magia exigir visão do alvo/ponto, validar a conjuração conforme iluminação e capacidade de visão do personagem.
- Manter efeitos de magias não instantâneas visíveis enquanto estiverem ativos.
- Exibir tempo de jogo restante dos efeitos persistentes.
- Conjurar visualmente uma magia sem cálculo automático de dano, acerto ou recursos da ficha.
- Consultar histórico permitido da sessão.
- Encerrar efeitos mágicos conjurados pelo próprio personagem quando aplicável.
- Visualizar o mapa de acordo com a iluminação ambiente, fontes de luz, visão racial e efeitos mágicos ativos.
- Acender ou apagar uma tocha vinculada ao próprio personagem.

## Histórico

Registrar, no mínimo:

- entrada e saída de jogadores;
- movimentações;
- ataques e ações visuais;
- uso de magias;
- alterações relevantes realizadas pelo mestre;
- detalhes de conjuração, alvo/origem, área, duração e encerramento de efeitos mágicos;
- mudanças de iluminação, tochas acesas/apagadas e encerramento de fontes temporárias.

## Fora do escopo atual

- ficha digital completa;
- rolagem de dados;
- controle de espaços de magia, magias preparadas ou conhecidas;
- controle automático de recarga por descanso de habilidades raciais;
- cálculo de dano, acerto ou testes de resistência.

- A campanha deve persistir os personagens dos jogadores e oferecer seleção explícita desses personagens na entrada da sessão.
- O Mestre deve poder excluir da campanha um personagem de jogador que esteja desconectado.

## Biblioteca de entidades da campanha
- O Mestre pode retirar personagens, NPCs e monstros do grid sem excluí-los da campanha.
- Entidades fora do grid ficam disponíveis em uma biblioteca para reinserção posterior.
- A exclusão definitiva da campanha é separada da retirada do grid.
- NPCs e monstros podem ser criados em lote, de 1 a 20 unidades, reutilizando nome-base e token.
- Ao criar várias unidades, cada entidade recebe identificação numérica e é posicionada automaticamente quando houver espaço.
- Entidades que não couberem no mapa permanecem na biblioteca.
