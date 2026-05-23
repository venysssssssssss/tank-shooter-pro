import { describe, it, expect } from 'vitest';
import { LightTank, MediumTank, HeavyTank } from '../src/tanks/TankClasses';

describe('Tank Classes and Attributes', () => {
  it('should have correct base stats for LightTank', () => {
    const tank = new LightTank();
    expect(tank.maxSpeed).toBeGreaterThan(45);
    expect(tank.maxHealth).toBeLessThan(100);
    expect(tank.damage).toBeLessThan(20);
  });

  it('should have correct base stats for MediumTank', () => {
    const tank = new MediumTank();
    expect(tank.maxSpeed).toBe(35);
    expect(tank.maxHealth).toBe(100);
    expect(tank.damage).toBe(20);
  });

  it('should have correct base stats for HeavyTank', () => {
    const tank = new HeavyTank();
    expect(tank.maxSpeed).toBeLessThan(35);
    expect(tank.maxHealth).toBeGreaterThan(100);
    expect(tank.damage).toBeGreaterThan(20);
  });
});