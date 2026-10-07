# 030 — Diagnóstico e observabilidade do aplicativo

## Decisão
A Mesa Arcana terá uma tela interna de diagnóstico no aplicativo do Mestre.

## Objetivo
Permitir validar o funcionamento do produto sem depender de terminal, VS Code ou conhecimento técnico, além de criar uma base útil para suporte, distribuição futura e eventual licenciamento.

## O diagnóstico verifica
- versão do aplicativo;
- modo desenvolvimento ou empacotado;
- processo do servidor da sessão;
- servidor da interface;
- resposta HTTP local;
- diretório de campanhas e capacidade de leitura/escrita;
- endereços IPv4 detectados para uso em LAN;
- versões do Electron, Node e Chromium.

## Relatório
A tela permite exportar um JSON com o estado coletado. Esse arquivo não contém campanhas, tokens, mapas ou conteúdo privado da sessão; registra apenas dados técnicos necessários para diagnóstico.

## Evolução futura
O mesmo mecanismo poderá alimentar validação de atualização, compatibilidade de versão, suporte e telemetria opcional, se o projeto evoluir de hobby para produto distribuído.
