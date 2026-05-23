# Phase 5: Monetização Ética & Eventos Sazonais (Batch 1 - Battle Pass e Loja)

## Passe de Batalha (Battle Pass)
- [x] 1. Escrever teste RED: `BattlePass.ts` deve progredir de *Tier* conforme a experiência recebida e liberar recompensas visuais (Free e Premium) corretamente baseadas na posse do Passe Premium.
- [x] 2. Implementar lógica de Tiers, Recompensas e Premium Flag em `BattlePass.ts`.
- [x] 3. Garantir testes de progressão do Passe GREEN.

## Loja Rotativa (Item Shop)
- [x] 4. Escrever teste RED: `ItemShop.ts` deve ser capaz de receber um *pool* de itens e rotacioná-los baseando-se no tempo (simulado), alterando a disponibilidade diária. Testar limite de compras e dedução monetária via `PlayerProfileStore`.
- [x] 5. Implementar `ItemShop.ts` e integração com a economia existente.
- [x] 6. Garantir testes GREEN para a loja rotativa e integração de carteira (REFACTOR).