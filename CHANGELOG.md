# Changelog

## 0.12.1-teste.1

- Criada distribuição separada **Mesa Arcana Teste**.
- Adicionada validação remota obrigatória antes da inicialização do servidor local e da interface.
- Controle remoto fixado em `https://mesa-arcana-controle.vercel.app/controle.json`.
- Falha de internet, versão ausente ou versão desativada bloqueiam a abertura.
- A validação ocorre apenas na inicialização, sem interromper uma sessão LAN já iniciada.
- App ID e atalhos separados da versão interna para preservar a cópia do criador.

# Changelog

## 0.12.0 — MVP distribuível

- Promove a RC2 validada para a primeira versão estável do MVP.
- Mantém sem alterações o comportamento funcional validado da Mesa Arcana.
- O comando `npm run instalador:windows` agora executa a validação completa antes de gerar o instalador.
- Instalador NSIS configurado para instalação por usuário, atalhos e execução após finalizar.
- O computador do usuário final não precisa de Node.js ou npm.
- Diagnóstico local e persistência de campanhas permanecem disponíveis.
- Licenciamento, servidor de controle, atualização automática e assinatura digital permanecem fora desta entrega.

## 0.12.0-rc.2

- Corrigidos os problemas de tipagem do tema do mapa e CSS da tela do MVP encontrados na RC1.
- RC validada em ambiente Windows pelo usuário.
## Correção de empacotamento - teste 0.12.1-teste.1
- Corrigida a tipagem do `fetch` no processo principal do Electron para permitir que `npm run validar:mvp` e a geração do instalador sejam concluídos.
- Mantido o bloqueio de cache por parâmetro único na URL e cabeçalhos HTTP, sem alterar a versão remota já autorizada.
