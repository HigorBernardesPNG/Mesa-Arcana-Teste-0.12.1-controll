# Etapa 4.9 - Salvamento, carregamento e transporte da campanha

## Implementado

- botão **Salvar** no topo da tela do Mestre;
- listagem e carregamento de campanhas locais;
- botão **Exportar** para gerar um arquivo `.mesaarcana`;
- botão **Importar** para abrir uma campanha exportada em outro computador;
- opção **Carregar campanha** habilitada na tela inicial;
- opção **Nova campanha** reinicia o estado atual quando não há jogadores conectados;
- salvamento automático após o primeiro salvamento explícito;
- backup do arquivo anterior antes de sobrescrever;
- restauração de mapa, grid, iluminação, peças, personagens, magias selecionadas, efeitos persistentes, fontes de luz, rodada e histórico;
- reconexão por nome para recuperar um personagem persistido;
- bloqueio de carregamento/importação enquanto houver jogadores conectados;
- versão própria do formato de persistência.

## Local dos salvamentos

Durante o desenvolvimento, o servidor usa por padrão:

- Windows: pasta do usuário `~/.mesa-arcana/campanhas`;
- Linux/macOS: equivalente dentro da pasta pessoal.

O caminho pode ser substituído pela variável de ambiente `DIRETORIO_DADOS_MESA_ARCANA`. Essa possibilidade será usada pelo aplicativo instalável do Mestre.

## Formato

Extensão: `.mesaarcana`

Nesta etapa, o arquivo é JSON autocontido. A extensão própria existe para o usuário tratar a campanha como um documento da Mesa Arcana, sem precisar manipular seu conteúdo interno.

## Próxima validação manual

1. montar uma campanha com mapa, tokens e efeitos;
2. salvar;
3. alterar a campanha;
4. carregar o salvamento e confirmar a restauração;
5. fechar/reabrir o servidor e carregar novamente;
6. exportar a campanha;
7. importar o arquivo exportado;
8. selecionar um personagem salvo na tela de entrada e confirmar a recuperação de token e configurações.
