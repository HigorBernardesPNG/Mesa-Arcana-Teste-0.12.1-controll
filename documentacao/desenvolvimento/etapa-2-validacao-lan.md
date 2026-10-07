# Etapa 2 - Validação LAN

## Entrega

- servidor HTTP local na porta 3210;
- Socket.IO preparado para sincronização;
- código de sessão gerado ao iniciar;
- entrada de jogador validada pelo servidor;
- atualização da lista de jogadores conectados;
- histórico central registrando entrada e saída;
- interface inicial, mestre e jogador;
- shell visual alinhado à direção dark fantasy aprovada.

## Validação manual

1. Instalar Node.js LTS em uma máquina de desenvolvimento.
2. Executar `npm install` na raiz.
3. Executar `npm run desenvolvimento`.
4. No computador do mestre abrir `http://localhost:5173/mestre`.
5. Em outro dispositivo da mesma rede abrir `http://IP-DO-MESTRE:5173/entrar`.
6. Informar o código exibido na tela do mestre.
7. Confirmar se o jogador aparece na lista e no histórico.

Se outro dispositivo não conseguir acessar, verificar se a rede permite comunicação entre clientes e se o firewall do sistema liberou as portas 5173 e 3210 para rede privada.
