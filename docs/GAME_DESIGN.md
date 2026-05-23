# Game Design Document — Tank Shooter Pro

A high-performance, single-player vertical slice of a cyberpunk-themed 3D third-person arena tank shooter.

## Core Gameplay Mechanics
- **3D Third-Person Perspective**: Camera orbits behind the tank, following movement and allowing mouse aim.
- **Physics-Based Movement**: Grid boundaries mapped to `[-60, 60]`, with elastic circle collisions for central pillars and obstacles.
- **Weapon System**: Standard primary fire with upgrades, plus a class-colored holographic laser sight projecting onto targets/ground.
- **Ability System**: Non-spammable special abilities triggered via Q/Shift, unique to each tank class.
- **Wave System**: Hands-authored waves scaling from Wave 1 up to Wave 5 Boss Battle, transitioning to procedurally scaling Endless gameplay upon victory.
- **Currency & Upgrades**: Credits (soft currency) and Nanobytes (hard currency) earned from enemy kills, spendable on revives and permanent tank stat upgrades.

## Tank Classes
1. **Light Tank**
   - **Color Theme**: Magenta (`0xff00ff`)
   - **Special Ability**: Phase Dash (invulnerable dash forward at 3x speed, 6s cooldown).
   - **Attributes**: Lower HP, highest speed and maneuverability.

2. **Medium Tank**
   - **Color Theme**: Cyan (`0x00f2ff`)
   - **Special Ability**: Energy Shield (blocks all incoming projectile/collision damage, 15s cooldown).
   - **Attributes**: Balanced stats.

3. **Heavy Tank**
   - **Color Theme**: Orange (`0xff8800`)
   - **Special Ability**: Overcharge (+100% damage, +50% fire rate, -40% speed penalty for 6s, 20s cooldown).
   - **Attributes**: Highest HP, slow speed.

## Enemy Behaviors
All enemy behavior statistics are managed in `src/config/balance.ts`.

- **NORMAL**: Weaves and orbits around the player at medium range.
- **KAMIKAZE**: Rushes directly at the player in a wild zig-zag pattern, exploding on contact.
- **TANK**: Moves slowly but charges forward at extreme speed when the player comes within range.
- **SNIPER**: Orbits at long range, firing a projectile every 3 seconds.
- **SPAWNER**: Flees the player to maintain distance, spawning NORMAL enemy minions every 6 seconds.
- **BOSS**: Massive HP target hovering high above, orbiting the arena.

## Controls
- **Movement**: `W`, `A`, `S`, `D` or `Arrow Keys`
- **Aiming**: Mouse Orbit (requires pointer-lock, activated by clicking on the game canvas)
- **Primary Fire**: `Left Click` or `Spacebar`
- **Class Ability**: `Q`, `Left Shift`, or `Right Shift`
- **Pause/Menu**: Escape (releases mouse pointer lock)
