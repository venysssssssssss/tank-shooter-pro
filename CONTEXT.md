# Context - Tank Shooter Pro

## Current Task
- Completed the single-player vertical slice stabilization, resolving input ability spam, currency mismatch bugs, and adding comprehensive test coverage.

## Key Decisions
- **Ability Triggers**: Modified the input detection to trigger class abilities exactly once per keydown action, requiring a key release.
- **Nanobytes Integration**: Added `spendNanobytes` and `addNanobytes` methods to `PlayerProfileStore` to resolve the currency deduction bug in `revivePlayer`.
- **Core Tests & Docs**: Created a complete unit testing suite for the Tank entity's core loop, alongside game design, architecture, and verification documentation.

## Next Steps
- Implement online multiplayer synchronization (socket.io communication with server backend).
- Design and integrate the multiplayer matchmaking screen and lobby system.
- Build visual models or custom shaders for cyberpunk enemies and arena effects.
