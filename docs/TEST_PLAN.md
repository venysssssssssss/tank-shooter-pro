# Verification & Test Plan — Tank Shooter Pro

A guide to the testing suite, mock configurations, and verification procedures of the game.

## Test Environment
- **Test Runner**: Vitest (v4.x)
- **Environment**: JSDOM (configured in `vitest.config.ts` to mock browser globals like `window`, `document`, and `localStorage`).
- **Commands**:
  - Run all tests once: `npm run test` (executes `vitest run`)
  - Watch mode for development: `npm run test:watch` (executes `vitest`)
  - Typecheck validation: `npm run typecheck` (executes `tsc --noEmit`)

## Test Coverage Modules

### 1. Tank Core Mechanics (`test/TankCore.test.ts`)
- **Initialization**: Verify max health, default cooldowns, and starting stats load correctly.
- **Upgrades**: Verify player profile upgrades apply successfully to tank HP and stats on instantiation.
- **Damage Mechanics**:
  - Validate that damage reduces health correctly.
  - Verify that taking damage sets an invulnerability window (1 second) and that subsequent hits during this window are ignored.
  - Confirm that depleting health triggers the death state.
- **Shield Handling**:
  - Test that picking up a shield power-up intercepts hits and absorbs damage fully.
  - Verify shield consumption post-hit and activation of a shorter (0.5s) grace period.
- **Abilities**:
  - Test activation of Light (dash), Medium (energy shield), and Heavy (overcharge) class abilities.
  - Verify correct duration, cooldown timers, stat multipliers, and activation limits.
  - Validate that holding down the ability key does not trigger abilities repeatedly (requires release).

### 2. Economy & Profiles (`test/PlayerProfileStore.test.ts`, `test/ItemShop.test.ts`)
- Test XP additions, level progression triggers, and Battle Pass credit calculations.
- Test shop transactions, credit validation, currency deduction safety, and upgrade purchases.

### 3. Physics & Boundaries (`test/Physics.test.ts`)
- Verify circle-circle overlap resolution.
- Verify clamp functions for boundaries.

### 4. Reward System (`test/TankCore.test.ts`)
- Verify calculated reward scaling based on defeated enemy types and combo multipliers.
- Verify integration with the player profile store to update XP, Credits, and Nanobytes.

## Manual Playtesting Verification Checklist
- Run the local development server (`npm run dev`) and open the game in the browser.
- Select different tank classes to check their aesthetic colors (magenta, cyan, orange).
- Click canvas to lock mouse pointer. Test movement and verify camera orbits behind tank.
- Aim at flying UFOs and observe the turret rotating in yaw and the barrel rotating in pitch (inclining vertically).
- Keep the special ability key (Q/Shift) held down and confirm it fires only once and doesn't loop activation.
- Deplete HP, click the Revive button, and verify that 200 Credits / 2 Nanobytes are deducted correctly.
