import { describe, it, expect } from 'vitest';
import { PhysicsManager, BiomeType } from '../src/physics/PhysicsManager';
import { Vector3, Box3 } from 'three';

describe('PhysicsManager', () => {
  it('should calculate new velocity with acceleration and friction', () => {
    const manager = new PhysicsManager();
    const result = manager.calculateVelocity(0, 100, 50, 0.1, true, false, 40, BiomeType.NORMAL);
    // acc = 100 * 0.1 = 10 -> velocity = -10 (forward is negative Z)
    expect(result).toBe(-10);
  });

  it('should modify friction and maxSpeed based on ICE biome', () => {
    const manager = new PhysicsManager();
    const result = manager.calculateVelocity(0, 100, 50, 0.1, true, false, 40, BiomeType.ICE);
    // ICE multiplier: friction * 0.2, maxSpeed * 1.5, acceleration * 0.8
    // Result forward: acc(100) * 0.8 * 0.1 = 8 -> -8
    expect(result).toBe(-8);
    
    // Test friction slide
    const slideResult = manager.calculateVelocity(-8, 100, 50, 0.1, false, false, 40, BiomeType.ICE);
    // Friction base is 50. Ice friction = 50 * 0.2 = 10.
    // deceleration = 10 * 0.1 = 1.
    // original velocity is -8, it moves towards 0 by 1 = -7
    expect(slideResult).toBe(-7);
  });

  it('should prevent moving past an obstacle using BoundingBoxes', () => {
    const manager = new PhysicsManager();
    const tankBox = new Box3(new Vector3(0, 0, 0), new Vector3(2, 2, 2));
    const wallBox = new Box3(new Vector3(0, 0, -2), new Vector3(2, 2, 0));
    
    // Tank wants to move forward (-Z by 5 units)
    const proposedMove = new Vector3(0, 0, -5);
    const actualMove = manager.resolveCollision(tankBox, [wallBox], proposedMove);
    
    const tankBox2 = new Box3(new Vector3(0, 0, 3), new Vector3(2, 2, 5));
    const wallBox2 = new Box3(new Vector3(0, 0, 0), new Vector3(2, 2, 1));
    const proposedMove2 = new Vector3(0, 0, -5); // wants to go to Z=-2
    
    const actualMove2 = manager.resolveCollision(tankBox2, [wallBox2], proposedMove2);
    expect(actualMove2.z).toBeGreaterThan(-5); // Collision handled
  });
});