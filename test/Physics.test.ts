import { describe, it, expect } from 'vitest';
import { PhysicsManager } from '../src/physics/PhysicsManager';
import { Vector3, Box3 } from 'three';

describe('PhysicsManager', () => {
  it('should calculate new velocity with acceleration and friction', () => {
    const manager = new PhysicsManager();
    const result = manager.calculateVelocity(0, 100, 50, 0.1, true, false, 40);
    // acc = 100 * 0.1 = 10 -> velocity = -10 (forward is negative Z)
    expect(result).toBe(-10);
  });

  it('should prevent moving past an obstacle using BoundingBoxes', () => {
    const manager = new PhysicsManager();
    const tankBox = new Box3(new Vector3(0, 0, 0), new Vector3(2, 2, 2));
    const wallBox = new Box3(new Vector3(0, 0, -2), new Vector3(2, 2, 0));
    
    // Tank wants to move forward (-Z by 5 units)
    const proposedMove = new Vector3(0, 0, -5);
    const actualMove = manager.resolveCollision(tankBox, [wallBox], proposedMove);
    
    // It should hit the wall at -2, so it shouldn't move fully -5.
    // Tank min Z is 0, wall max Z is 0. Wait, they are touching.
    // Let's position tank at Z=5, wall at Z=1.
    const tankBox2 = new Box3(new Vector3(0, 0, 3), new Vector3(2, 2, 5));
    const wallBox2 = new Box3(new Vector3(0, 0, 0), new Vector3(2, 2, 1));
    const proposedMove2 = new Vector3(0, 0, -5); // wants to go to Z=-2
    
    const actualMove2 = manager.resolveCollision(tankBox2, [wallBox2], proposedMove2);
    expect(actualMove2.z).toBeGreaterThan(-5); // Collision handled
  });
});