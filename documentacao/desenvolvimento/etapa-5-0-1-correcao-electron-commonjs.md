# Etapa 5.0.1 — correção do processo principal do Electron

## Problema identificado

Ao executar `npm run executar:aplicativo`, o processo principal do Electron falhava antes de abrir a janela com a mensagem `Dynamic require of "http" is not supported`.

A causa era o empacotamento do processo principal em ESM. O servidor local e dependências como Socket.IO utilizam módulos nativos do Node que podem recorrer a `require()` internamente. Quando todo o grafo era agrupado em um bundle ESM, essas chamadas dinâmicas eram incompatíveis com o formato gerado.

## Decisão

O frontend e os demais pacotes continuam em ESM. Apenas os dois arquivos executados diretamente pelo Electron passam a ser gerados em CommonJS:

- `dist/principal/principal.cjs`
- `dist/preload/preload.cjs`

O Electron suporta esse formato normalmente e módulos nativos do Node, como `http`, `fs` e `path`, permanecem compatíveis dentro do bundle do processo principal.

## Impacto funcional

Nenhuma regra de negócio foi alterada. Servidor LAN, persistência, interface, sincronização, campanhas e jogadores permanecem iguais à Etapa 5.0.
