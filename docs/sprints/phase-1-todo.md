# Phase 1: Fundação Multiplayer (Batch 1)

## Setup e Testes
- [x] 1. Instalar framework de testes (`vitest` e `@types/node`).
- [x] 2. Escrever teste E2E/Integração falho (RED) que tenta conectar a um servidor WebSocket local usando `socket.io-client`.

## Implementação Servidor
- [x] 3. Instalar `socket.io` (server) e `socket.io-client` (client).
- [x] 4. Criar o servidor Node.js básico em `server/server.ts` que aceite conexões na porta 3001.
- [x] 5. Rodar o teste e garantir que passe (GREEN). Refatorar se necessário.

## Integração Cliente
- [x] 6. Escrever teste falho para a integração da classe de Rede (NetworkManager) no cliente.
- [x] 7. Implementar `src/NetworkManager.ts` para conectar o cliente do jogo (Vite) ao servidor Node.js.
- [x] 8. Garantir que os testes de integração do cliente estejam passando (GREEN).