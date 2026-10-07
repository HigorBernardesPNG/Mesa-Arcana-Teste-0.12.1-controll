# Etapa 5.0 — Aplicativo e instalador do Mestre

## Objetivo

Eliminar a necessidade de terminal durante o uso normal da Mesa Arcana.

## Implementado

- Electron passa a inicializar o servidor da sessão automaticamente;
- a interface React compilada é servida diretamente pelo aplicativo na porta 5173;
- jogadores continuam acessando pelo navegador na mesma LAN;
- o aplicativo usa instância única;
- campanhas passam a usar o diretório de dados do aplicativo instalado;
- janela do Mestre recebe identidade e ícone da Mesa Arcana;
- o build Windows é configurado com NSIS;
- atalhos de Menu Iniciar e Área de Trabalho são criados pelo instalador;
- dados de campanha não são apagados automaticamente durante desinstalação.

## Portas

- `3210`: sincronização/servidor da sessão;
- `5173`: interface web servida aos jogadores.

## Validação necessária em Windows

1. gerar o instalador com `npm run instalador:windows`;
2. instalar em uma máquina sem ambiente de desenvolvimento aberto;
3. iniciar pelo atalho;
4. autorizar rede privada no Firewall quando solicitado;
5. entrar por outro dispositivo via QR Code/link;
6. salvar, fechar e reabrir uma campanha;
7. exportar/importar `.mesaarcana`;
8. validar desinstalação sem perda deliberada das campanhas locais.
