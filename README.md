# Mesa Arcana Teste — 0.12.1-teste.1

Esta distribuição é a versão de teste controlada da Mesa Arcana. Antes de abrir, o aplicativo consulta obrigatoriamente:

`https://mesa-arcana-controle.vercel.app/controle.json`

A versão interna `0.12.0` permanece separada e não depende desse controle remoto.

## Regra de abertura

O aplicativo abre somente quando o JSON estiver acessível, `aplicativoAtivo` estiver como `true` e a chave `0.12.1-teste.1` existir em `versoes` com `ativo: true`. Em falha de internet ou de leitura, a aplicação não abre. A validação ocorre somente na abertura; depois disso a sessão permanece LAN.

---

# Mesa Arcana — MVP 0.12.0

Primeira versão estável distribuível da Mesa Arcana, plataforma LAN de apoio visual para RPG de mesa.

## Uso em desenvolvimento

```bash
npm install
npm run executar:aplicativo
```

## Validar antes de gerar o instalador

```bash
npm run validar:mvp
```

## Gerar instalador Windows

```bash
npm run instalador:windows
```

O instalador será criado em `dist-instalador/` com nome semelhante a:

```text
Mesa-Arcana-Setup-0.12.0.exe
```

O computador do Mestre que instalar o `.exe` **não precisa ter Node.js, npm, Vite ou as dependências do projeto**. O Electron e o servidor local são empacotados com o aplicativo.

A instalação é por usuário, cria atalhos no Menu Iniciar e na Área de Trabalho e mantém os dados das campanhas ao desinstalar.

> Esta primeira entrega é sem assinatura digital e sem controle de licença. Em computadores com políticas mais rígidas do Windows, a execução de programas não assinados pode ser bloqueada. A futura camada de controle de uso será independente do funcionamento LAN das partidas.

## Diagnóstico

No aplicativo do Mestre, use **Diagnóstico** para verificar interface, servidor, rede e persistência e gerar um relatório JSON.

## Escopo desta entrega

Esta versão congela a base funcional já validada. Melhorias visuais, atualização remota, distribuição pública e controle/licenciamento ficam para versões posteriores.
