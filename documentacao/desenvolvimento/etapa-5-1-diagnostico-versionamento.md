# Etapa 5.1 — Diagnóstico e versionamento

Implementada uma camada de observabilidade local para a versão desktop da Mesa Arcana.

## Entrega
- versão do aplicativo passa para 0.11.0;
- tela `/diagnostico` exclusiva para validação do aplicativo desktop;
- botão Diagnóstico no cabeçalho do Mestre quando executado pelo Electron;
- testes de servidor de jogo, interface, sessão, persistência e rede;
- relatório JSON exportável;
- informações de runtime para facilitar suporte futuro.

## Validação manual recomendada
1. executar `npm run executar:aplicativo`;
2. abrir Diagnóstico;
3. confirmar todos os itens em OK;
4. baixar o relatório JSON;
5. fechar e abrir novamente o aplicativo;
6. repetir o diagnóstico após carregar uma campanha.

## Próximo passo sugerido
Depois da validação desta etapa, preparar estratégia de atualização/versionamento e, em seguida, distribuição MSIX/Store ou build interno conforme o estágio do projeto.
