# 028 — Aplicativo desktop autossuficiente

## Decisão

O aplicativo do Mestre será distribuído com Electron e levará junto tudo o que é necessário para executar a Mesa Arcana.

O usuário final não deverá instalar Node.js, npm, Vite ou dependências do projeto.

## Funcionamento

Ao abrir o aplicativo:

1. o servidor da sessão é iniciado na própria máquina do Mestre;
2. um servidor HTTP interno disponibiliza a interface web aos jogadores na LAN;
3. a janela desktop do Mestre acessa essa mesma interface;
4. os links e QR Code continuam apontando para a máquina do Mestre;
5. ao fechar o aplicativo, os servidores locais são encerrados.

## Persistência

Na versão instalada, campanhas locais serão gravadas no diretório de dados do aplicativo, e não dentro da pasta de instalação.

Isso evita perda de dados ao atualizar ou reinstalar a aplicação.

## Instância única

Somente uma instância da Mesa Arcana deve permanecer aberta por vez, evitando conflitos nas portas do servidor local.
