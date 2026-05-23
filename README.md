# Cyber-Arcade UFO Shooter (Tank Shooter Pro)

Um jogo de tiro de tanque em terceira pessoa feito com **Three.js**, **Vite** e **TypeScript**.

> [!IMPORTANT]
> **Nota de Ramo Ativo**: O desenvolvimento moderno e a versão com TypeScript do jogo estão no ramo **`feat/phase-5-monetization`**. O ramo `master` contém a versão antiga em JavaScript com importmaps. Certifique-se de trabalhar e buildar a partir de `feat/phase-5-monetization`.

## 🎮 Controles de Gameplay

- **W, A, S, D** ou **Setas**: Movimentação do chassi (W/S move para frente/trás, A/D rotaciona o tanque).
- **Movimento do Mouse**: Orbita a câmera ao redor do tanque (quando o ponteiro do mouse estiver travado na tela).
- **Clique Esquerdo** ou **Espaço**: Dispara o canhão principal.
- **Tecla Q** ou **Shift**: Ativa a habilidade especial da classe do tanque.

## 🛠️ Comandos de Desenvolvimento

### Instalação de Dependências
```bash
npm install
```

### Rodar Dev Server Local
```bash
npm run dev
```

### Compilar para Produção (Build)
```bash
npm run build
```

### Checagem de Tipos (Typecheck)
```bash
npm run typecheck
```

### Executar Testes Unitários
```bash
npm run test
```

## ⚠️ Limitações Conhecidas
- O modo multiplayer online ainda está em fase de stub (não integrado no loop principal).
- A interface de loja e passes é persistida localmente (localStorage) e não possui autoridade de servidor nesta versão de slice vertical.
