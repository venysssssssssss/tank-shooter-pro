# Phase 1: Fundação Multiplayer (Batch 2 - Sincronização & Deploy)

## Sincronização e Estado (Servidor)
- [x] 1. Escrever teste RED: Servidor recebe `playerInput` (ex: direções de movimento), simula estado simples e emite `stateUpdate` contendo posições.
- [x] 2. Implementar lógica de simulação em `server.ts` e passar no teste (GREEN).
- [x] 3. Refatorar se necessário (REFACTOR).

## Integração de Inputs (Cliente)
- [x] 4. Escrever teste RED: `NetworkManager` deve possuir método `sendInput` e callback `onStateUpdate`.
- [x] 5. Implementar esses métodos no `NetworkManager.ts` e passar no teste (GREEN).

## Deploy e Escalabilidade
- [x] 6. Criar `Dockerfile` básico para rodar o servidor em um container Node.js.
- [x] 7. Rodar testes E2E/integração para garantir que toda a Fase 1 está 100% GREEN.