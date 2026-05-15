# Phase 2: Core Gameplay Loop e Física (Batch 1 - Classes de Tanques)

## Refatoração de Arquitetura e Atributos (S.O.L.I.D.)
- [x] 1. Escrever teste RED: Testar configurações base de diferentes tipos de tanques (Light, Medium, Heavy) assegurando atributos corretos (speed, health, damage).
- [x] 2. Criar `src/tanks/TankConfig.ts` e classes específicas (`LightTank`, `MediumTank`, `HeavyTank`) que herdam ou compõem a lógica do tanque.
- [x] 3. Garantir que o teste passa (GREEN).
- [x] 4. Refatorar o antigo `src/Tank.ts` para separar as propriedades de lógica de jogo (status/física) do renderizador visual (SRP), mantendo testes existentes passando (REFACTOR).