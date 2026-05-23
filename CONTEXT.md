# Context - Tank Shooter Pro

## Current Task
- Completed gameplay polish sprint, resolving movement boundaries/collision, laser sight alignment, holographic borders, floating dust, dual-lighting, and enemy hit flash feedbacks.

## Key Decisions
- **3rd-Person Aiming & Laser**: decopuled steering from mouse-orbit aiming, adding a class-colored laser line from muzzle to ground aim point.
- **Arena Physics & Boundaries**: added circle-circle collision resolution for pillars and clamped coordinate boundaries to [±60, ±60].
- **Cyberpunk Visuals**: added floating ambient neon dust and a magenta fill light opposite to the cyan key light.

## Next Steps
- Implement online multiplayer sync (restoring `NetworkManager.ts` & finishing Express+Socket.IO server in `server/`).
- Conduct performance profiling on mobile/low-end target platforms.
