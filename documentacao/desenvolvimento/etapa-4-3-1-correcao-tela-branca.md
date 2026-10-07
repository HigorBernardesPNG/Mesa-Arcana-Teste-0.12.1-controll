# Etapa 4.3.1 - correção da tela branca

A Etapa 4.3 passou a usar funções do pacote `@mesa-rpg/dominio` diretamente no navegador para catálogo e cálculo visual das magias.

O barrel do domínio também exportava o histórico, cujo módulo importava `node:crypto`. Como esse pacote passou a ser carregado em runtime pela interface web, o navegador acabava tentando resolver uma dependência exclusiva do Node.

A geração de identificadores do histórico foi tornada compatível com os dois ambientes, usando `globalThis.crypto.randomUUID()` quando disponível e fallback simples quando necessário. A lógica das magias e da sessão não foi alterada.
