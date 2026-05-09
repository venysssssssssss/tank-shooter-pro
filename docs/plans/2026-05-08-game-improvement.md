# Game Architecture and Gameplay Improvement Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve game architecture (SOLID), movement, graphics, and performance without losing FPS.

**Architecture:** We will decouple the input, camera, and game loop logic currently tangled in `main.js` and `Tank.js`. We will introduce `deltaTime` for framerate-independent physics, implement Object Pooling for bullets and UFOs to reduce garbage collection (Performance), and add simple particle systems for better visual feedback. 

**Tech Stack:** JavaScript, Three.js

---

### Task 1: Framerate-Independent Physics (Delta Time)

**Files:**
- Modify: `src/main.js`
- Modify: `src/Tank.js`
- Modify: `src/Ufo.js`
- Modify: `src/Bullet.js`

**Step 1: Update main.js loop**
Create a clock and pass `deltaTime` to update functions.

```javascript
// src/main.js
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    // ...
    tank.update(deltaTime);
    // ...
```

**Step 2: Update Tank movement**
Multiply speed and turn logic by `deltaTime` (constants need to be scaled up, e.g., 0.5 becomes 30 * deltaTime). Update `shootDelay` tracking to use `deltaTime` instead of `Date.now()`.

**Step 3: Update Ufo and Bullet**
Multiply velocities by `deltaTime`. Update any `Date.now()` logic (like the wobble effect in UFO) to use an accumulated `time` variable.

**Step 4: Commit**
```bash
git add src/main.js src/Tank.js src/Ufo.js src/Bullet.js
git commit -m "refactor: apply deltaTime for framerate-independent physics"
```

### Task 2: Dependency Inversion - InputManager

**Files:**
- Create: `src/InputManager.js`
- Modify: `src/input.js`
- Modify: `src/Tank.js`
- Modify: `src/main.js`

**Step 1: Refactor input.js into InputManager class**
Create an `InputManager` class to encapsulate the state.

**Step 2: Inject InputManager into Tank**
Update `Tank.js` to accept `inputManager` in its constructor instead of importing global `keys`.

**Step 3: Update main.js**
Instantiate `InputManager` and pass it to the `Tank` constructor. Delete the old `input.js` if entirely replaced.

**Step 4: Commit**
```bash
git add src/input.js src/InputManager.js src/Tank.js src/main.js
git commit -m "refactor: extract InputManager and inject into Tank (DIP)"
```

### Task 3: Single Responsibility - CameraController

**Files:**
- Create: `src/CameraController.js`
- Modify: `src/main.js`

**Step 1: Create CameraController**
Extract the 3rd person camera logic from `main.js` animate loop into a dedicated `CameraController` class that accepts the `camera` and the target (`tank`).

**Step 2: Use CameraController in main.js**
Initialize `const cameraController = new CameraController(camera, tank)` and call `cameraController.update(deltaTime)` in the animation loop.

**Step 3: Commit**
```bash
git add src/CameraController.js src/main.js
git commit -m "refactor: extract camera logic into CameraController (SRP)"
```

### Task 4: Performance - Object Pooling

**Files:**
- Create: `src/ObjectPool.js`
- Modify: `src/main.js`
- Modify: `src/Tank.js`
- Modify: `src/Bullet.js`
- Modify: `src/Ufo.js`

**Step 1: Create ObjectPool class**
A generic pool class that holds an array of inactive objects and instantiates new ones via a factory function only when empty.

**Step 2: Pool Bullets in Tank.js**
Instead of `new Bullet()`, fetch from a `bulletPool`. Add a `reset()` method to `Bullet`. When the bullet dies, return it to the pool and set its mesh to `visible = false` rather than `dispose()`.

**Step 3: Pool UFOs in main.js**
Instead of `new Ufo()`, fetch from a `ufoPool`. Add a `reset()` method to `Ufo`. When hit, return to pool.

**Step 4: Commit**
```bash
git add src/ObjectPool.js src/main.js src/Tank.js src/Bullet.js src/Ufo.js
git commit -m "perf: implement object pooling for bullets and UFOs"
```

### Task 5: Graphics - Particle System (Explosions)

**Files:**
- Create: `src/ParticleSystem.js`
- Modify: `src/main.js`

**Step 1: Create ParticleSystem class**
Implement a class that manages a group of small meshes (particles). It should have an `explode(position)` method that sets particle velocities outward, and an `update(deltaTime)` method to move and fade them out.

**Step 2: Trigger explosions**
In `main.js`, initialize `ParticleSystem`. Trigger an explosion at the UFO's position when a collision is detected.

**Step 3: Commit**
```bash
git add src/ParticleSystem.js src/main.js
git commit -m "feat: add particle explosions on UFO hit"
```

### Task 6: Movement - Tank Kinematics (Acceleration)

**Files:**
- Modify: `src/Tank.js`

**Step 1: Add velocity and friction**
Instead of static translation, give the Tank a `currentSpeed` variable. When moving forward/backward, increase/decrease `currentSpeed` up to a `maxSpeed` using an acceleration value. When no keys are pressed, apply friction to naturally slow down.

**Step 2: Commit**
```bash
git add src/Tank.js
git commit -m "feat: add acceleration and friction to tank movement"
```