# 005 - Validar LAN antes do empacotamento do instalador

## Decisão

A primeira execução funcional será validada com servidor Node e interface Vite antes do empacotamento definitivo do Electron.

## Motivo

O risco principal desta etapa é comunicação entre dispositivos na rede local. Validar esse fluxo primeiro evita misturar problemas de rede com problemas de instalação e empacotamento.
