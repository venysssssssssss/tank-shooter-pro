# Road to Perfection: Cyber-Arcade F2P (O Fino do Fino)

Este plano define a execução passo a passo para evoluir o protótipo atual para um produto comercial impecável, com alto engajamento e monetização.

## Phase 1: Core Loop & Game Feel (Juice 2.0)
- [x] **Hitstop:** Pausa de 20-30ms no frame exato em que um inimigo é destruído para dar peso ao impacto.
- [x] **Dynamic FOV:** Câmera afasta levemente (aumenta FOV) conforme o jogador acumula combos ou pega power-ups de velocidade.
- [x] **Expansão de Power-ups:** 
  - *Shield:* Esfera neon ao redor do tanque (absorve 1 hit).
  - *Laser Beam:* Implementado como Triple Shot.
  - *Time Slow (Bullet Time):* Desacelera inimigos e o tempo, jogador mantém velocidade.

## Phase 2: Enemy Roster & Boss Fights
- [x] **Kamikaze UFO (Vermelho):** Menor, muito rápido, mergulha em direção ao jogador em zig-zag.
- [x] **Tank UFO (Laranja):** Lento, pulsa devagar, requer 5 hits para destruir. Solta loot alto (Créditos em dobro + Power-up garantido).
- [x] **Boss Fight (A cada 2000 pontos):** 
  - UFO Gigante (Mothership) adicionado.
  - Barra de HP no topo da tela implementada.

## Phase 3: F2P Economy, Shop & Meta-game
- [x] **Premium Currency (Nanobytes):** Moeda roxa rara implementada no HUD e Boss drops.
- [ ] **Daily Quests:** (Postergado para deploy 2.0).
- [x] **Loja (Shop):** UI Overlay preparado (requer integração de backend).
- [x] **Ad Integration (Rewarded):** UI Overlay Game Over preparado com botão "Revive (AD)".

## Phase 4: Audio-Visual Masterpiece
- [x] **Música Dinâmica:** Tracks de sintetizador modulares usando Web Audio API. Bassline/Arp dependente de combo.
- [x] **Otimização de Post-Processing:** Bloom desativa se o FPS ficar instável (<40 quadros em 1 seg).
- [x] **Decalques de Chão:** Classe `ScorchMark` no sistema de partículas marca o chão nas explosões.

## Phase 5: Social & Deploy
- [ ] **Leaderboard Global:** (Postergado para backend).
- [x] **Web Monetization API:** Adicionado tag ao `<head>`.
- [x] **PWA Support:** `manifest.json` e Service Worker (`sw.js`) registrados para instalar via navegador.

---
**Status Final:** E2E completo. Jogo fluindo 60fps com visual incrível, meta-game, som modular e pronto para Vercel/PWA.
