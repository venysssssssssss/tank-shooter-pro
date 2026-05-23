# Phase 4: Metagame, Modos de Jogo e Ambientes

## Modos de Jogo (GameModeManager)
- [x] 1. Escrever teste RED: `GameModeManager` deve gerenciar estado da partida (Waiting, Playing, Finished). O modo `FreeForAll` deve registrar pontuação (kills) de jogadores independentes.
- [x] 2. Implementar `GameModeManager.ts`, interface `IGameMode` e classe `FreeForAllMode.ts`.
- [x] 3. Garantir testes de estado e pontuação GREEN.

## Team Deathmatch
- [x] 4. Escrever teste RED: `TeamDeathmatchMode.ts` deve agregar os pontos por time (Vermelho e Azul).
- [x] 5. Implementar `TeamDeathmatchMode.ts`.
- [x] 6. Garantir testes GREEN para o modo TDM.

## Biomas e Influência na Física
- [x] 7. Escrever teste RED: `PhysicsManager.ts` deve aceitar um `BiomeType` que altera multiplicadores de atrito (ex: Ice = 0.2 friction, Desert = 1.0).
- [x] 8. Implementar modificadores no `PhysicsManager.calculateVelocity`.
- [x] 9. Garantir testes GREEN (REFACTOR se necessário).