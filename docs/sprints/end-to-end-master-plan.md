# End-to-End Master Plan: Tank Shooter Pro

## 1. Visão Geral e Visão de Produto
**Tank Shooter Pro** evoluirá de um protótipo single-player em um jogo multiplayer competitivo, altamente escalável, e focado em engajamento a longo prazo e monetização ética (cosmética). O jogo rodará em navegadores com performance de ponta, permitindo acessibilidade máxima e retenção contínua através de atualizações sazonais.

**Meta Final:** Tornar-se o padrão de excelência na indústria de jogos multiplayer para navegador, competindo em qualidade mecânica e metagame com clássicos como *Tanki Online*, *Diep.io* e *Krunker.io*.

## 2. Princípios Arquiteturais e de Design (Clean Code & S.O.L.I.D.)
Para garantir sustentabilidade e velocidade de desenvolvimento ao longo de múltiplas "sprints", a arquitetura do projeto deve ser rígida:

- **S (Single Responsibility):** Cada classe terá um papel único. Ex: `Tank.ts` gerencia propriedades lógicas, `TankRenderer.ts` gerencia apenas a representação gráfica, e `TankInput.ts` gerencia apenas o parsing de comandos.
- **O (Open/Closed):** O sistema de armas, power-ups e modos de jogo usará interfaces genéricas (ex: `IWeaponBehavior`, `IPowerUpEffect`). Novas armas não modificarão a classe base do tanque, mas estenderão a interface.
- **L (Liskov Substitution):** Entidades polimórficas (ex: `HeavyTank`, `LightTank` herdando de uma classe/interface abstrata `Vehicle`) funcionarão em todos os sistemas (matchmaking, dano) sem requerer type-checking rígido.
- **I (Interface Segregation):** Interfaces pequenas (ex: `IDamageable`, `IHealable`) ao invés de grandes interfaces genéricas.
- **D (Dependency Inversion):** Serviços de baixo nível (como WebSocket ou Analytics) serão injetados em serviços de alto nível, permitindo o mock de servidores em ambiente de testes ou a troca fluída da stack de rede sem quebrar o core de jogo.

## 3. Fase 1: Fundação Multiplayer & Servidor Autoritativo
O jogo não pode confiar no cliente (para evitar cheaters). O servidor deve processar a lógica crítica e enviar o estado ao cliente.

- **3.1. Arquitetura de Rede:**
  - **Servidor:** Node.js (com WebSockets via `ws` ou `Socket.io`) ou Go (para altíssima performance UDP via WebRTC se possível, fallback para WS).
  - **Protocolo de Comunicação:** Snapshot Interpolation / Client-Side Prediction. O servidor roda o loop a 20-30 ticks per second (TPS) e envia *snapshots* para os clientes, que interpolam o movimento visual.
- **3.2. Sincronização e Estado:**
  - Inputs do cliente são enviados com *timestamps*.
  - O servidor simula a física, resolve conflitos, valida os disparos e faz broadcasting do estado mundial (State Synchronization).
  - **Matchmaking Básico:** Sistema de salas (Rooms). Cada sala é uma instância separada rodando em threads isoladas ou *Worker Threads*.
- **3.3. Deploy e Escalabilidade:**
  - Containerização via **Docker** e orquestração via **Kubernetes** (ou Auto Scaling em Cloud), escalando dinamicamente de acordo com CCU (Concurrent Users).

## 4. Fase 2: Core Gameplay Loop e Física
- **4.1. Refinamento de Movimentação e Tiro:**
  - Substituição ou aprimoramento da física atual por um motor físico (ex: Cannon.js/Ammo.js para 3D) para lidar com colisões, peso de blindagem, aceleração, atrito e gravidade.
  - Implementar *Server-Side Raycasting* ou *Hitbox verification* para validar tiros.
- **4.2. Classes de Tanques e Atributos:**
  - Introduzir arquitetura de dados orientada a configuração (arquivos JSON/TS gerenciando balanceamento).
  - **Leve:** Rápido, frágil, cadência alta.
  - **Médio:** Balanceado.
  - **Pesado:** Lento, robusto, alto dano, canhão de carregamento demorado.
- **4.3. Entity-Component-System (ECS) e Otimizações:**
  - Uso de *Object Pools* para projéteis, partículas de explosão e *Damage Numbers* para manter 60 FPS estritamente independente de hardware.

## 5. Fase 3: Progressão, Economia e Customização
Sistemas de progressão que mantêm os jogadores engajados e focados na expressão e identidade visual.

- **5.1. Sistema de Progressão e Níveis (XP):**
  - Eliminações, capturas de objetivo e assistências geram XP.
  - Subir de Nível (Player Level) libera badges (emblemas) e permissões de acesso a modos competitivos/clãs.
- **5.2. Duplo Sistema de Moedas:**
  - **Soft Currency (Coins/Credits):** Ganho ao completar partidas, desafios diários. Usado para comprar itens básicos e abrir *Loot Boxes* de raridade menor.
  - **Hard Currency (Gems/Premium):** Comprado com dinheiro real. Usado para cosméticos premium e passes sazonais.
- **5.3. Customização Modular (Visual Apenas):**
  - **Skins:** Texturas/Materiais diferentes para o casco.
  - **Decalques / Acessórios:** Chapéus, bandeiras e pinturas de neon.
  - **Efeitos Especiais:** Rastro de movimento, partículas customizadas na destruição.
  - *Toda a customização será estritamente estética, seguindo o padrão Fortnite para evitar o "Pay-to-Win".*

## 6. Fase 4: Metagame, Modos de Jogo e Ambientes
A expansão de conteúdo e rejogabilidade.

- **6.1. Modos de Jogo Essenciais:**
  - **Free-For-All (Deathmatch):** Partidas curtas de caos total (ex: 5 minutos, limite de 20 eliminações).
  - **Team Deathmatch (TDM):** Equipe Vermelha vs Equipe Azul (ex: 8v8 ou 10v10).
  - **Capture the Flag (CTF) / Domination:** Para jogadores que gostam de jogo tático em equipe.
- **6.2. Level Design Modular:**
  - Criar "Biomas" com diferentes influências físicas:
    - *Deserto:* Menos atrito para tanques leves.
    - *Ártico (Neve):* Tanques deslizam mais ao frear.
    - *Cyber/Urbano:* Foco em combates de curta distância (CQC), becos, coberturas altas.
- **6.3. Power-ups e Dinâmicas In-Game:**
  - Itens spawnando randomicamente (Health Kits, Boost de Dano, Escudo Temporário) para controlar o fluxo da partida (map control).

## 7. Fase 5: Monetização Ética & Eventos Sazonais
- **7.1. Battle Pass (Passe de Batalha):**
  - Temporadas de 2 a 3 meses.
  - Progressão de níveis de passe (1 a 50) desbloqueando cosméticos exclusivos (modelos 3D de tanques, moedas, decalques).
  - Passagem Free (recompensas espaçadas) e Passagem Premium.
- **7.2. Loja Rotativa (Item Shop):**
  - Loja atualizando diariamente/semanalmente para criar senso de urgência (FOMO) estético, inspirado em Valorant/Fortnite/Krunker.
- **7.3. Funcionalidades Sociais e de Clãs:**
  - Sistema de "Guildas" ou "Clãs", com tag (ex: `[PRO] PlayerName`) permitindo batalhas de clãs (Clan Wars) para engajar influenciadores e grupos fechados.

## 8. Fase 6: Otimização, Analytics e LiveOps (Scale)
- **8.1. Telemetria e Analytics Estruturados:**
  - Coleta de métricas chave via integração (Mixpanel/GameAnalytics):
    - *DAU/MAU (Daily/Monthly Active Users)*.
    - *Churn Rate (Taxa de abandono do tutorial/partidas).*
    - Mapa de Calor (Heatmaps) de mortes e tempo gasto em setores da tela (para equilibrar mapas e UI).
- **8.2. Qualidade e Segurança (Anti-Cheat):**
  - Validação absoluta de movimento e cool-downs (rate limiting) no backend.
  - Ofuscação de código Web e bloqueio de injetores no browser.
- **8.3. Polimento de UI/UX:**
  - HUD responsivo, intuitivo (Mobile-friendly se o foco virar Cross-Platform).
  - Telas de loading dinâmicas, Game Feeds (Quem matou quem), Killcam (Câmera de abate).
  - Áudio espaciais (3D Sound Panning) para indicar posição dos inimigos.

## Próximos Passos (Ação Imediata)
Este plano cobre toda a trajetória rumo ao status de *AAA de Navegador*. 
**Para executar o plano item a item**, a ordem de desenvolvimento será:
1. Iniciar imediatamente a **Fase 1**, configurando a infraestrutura de servidor backend e a conexão de WebSockets com o client atual em TypeScript/Vite.
2. Migrar o gerenciamento de input (InputManager) para enviar comandos ao servidor, em vez de mover diretamente o tanque.
3. Ajustar o loop cliente para renderizar o estado proveniente da rede (Interpolation).

*Este documento servirá de guia-mestre. Novas funcionalidades devem ser comparadas contra a visão estruturada aqui presente, garantindo alinhamento de projeto.*