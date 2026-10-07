# Visão geral da arquitetura

**Produto:** Mesa Arcana. Os nomes técnicos internos `mesa-rpg` permanecem nesta fase para evitar migração estrutural durante o refino visual.

A plataforma terá duas experiências visuais sobre a mesma sessão.

- Mestre: administra campanha, mapas, entidades, NPCs, monstros, ações e sessão.
- Jogador: controla apenas seus personagens e ações autorizadas.

A máquina do mestre hospeda o servidor local e mantém o estado oficial da sessão. Os jogadores acessam a interface pelo navegador na mesma rede local.

## Direção técnica

- Interface: React + TypeScript.
- Aplicativo do mestre: Electron.
- Servidor local: Node.js + Socket.IO.
- Validação de dados: Zod.
- Persistência inicial: arquivos locais versionados.
- Comunicação: comandos enviados pelos clientes e eventos confirmados pelo servidor.

## Regra estrutural

A interface não é a fonte da verdade. O servidor mantém o estado oficial e redistribui as alterações aprovadas aos participantes.


## Preferências locais de interface

As proporções dos painéis redimensionáveis pertencem ao dispositivo e são armazenadas no navegador. Elas não fazem parte do estado oficial da sessão e não são sincronizadas entre participantes.

## Regras espaciais atuais

O domínio preserva deslocamento base racial e deslocamento efetivo separadamente. Alcance e visão de magias são validados no servidor usando a escala de 1,5 m por casa e o estado de iluminação percebido pelo conjurador.
