import { Box3, Vector3 } from 'three';

export enum BiomeType {
    NORMAL,
    ICE,
    DESERT,
    CYBER
}

interface BiomeModifiers {
    frictionMul: number;
    speedMul: number;
    accelMul: number;
}

const biomeMods: Record<BiomeType, BiomeModifiers> = {
    [BiomeType.NORMAL]: { frictionMul: 1.0, speedMul: 1.0, accelMul: 1.0 },
    [BiomeType.ICE]: { frictionMul: 0.2, speedMul: 1.5, accelMul: 0.8 },
    [BiomeType.DESERT]: { frictionMul: 0.8, speedMul: 0.9, accelMul: 0.9 },
    [BiomeType.CYBER]: { frictionMul: 1.2, speedMul: 1.1, accelMul: 1.2 },
};

export class PhysicsManager {
    
    // Calculates velocity based on acceleration and friction
    calculateVelocity(
        currentVelocity: number, 
        acceleration: number, 
        friction: number, 
        deltaTime: number, 
        forward: boolean, 
        backward: boolean, 
        maxSpeed: number,
        biome: BiomeType = BiomeType.NORMAL
    ): number {
        const mods = biomeMods[biome];
        
        const finalAccel = acceleration * mods.accelMul;
        const finalFric = friction * mods.frictionMul;
        const finalSpeed = maxSpeed * mods.speedMul;

        let newVelocity = currentVelocity;
        
        if (forward) {
            newVelocity -= finalAccel * deltaTime;
        } else if (backward) {
            newVelocity += finalAccel * deltaTime;
        } else {
            if (newVelocity < 0) {
                newVelocity += finalFric * deltaTime;
                if (newVelocity > 0) newVelocity = 0;
            } else if (newVelocity > 0) {
                newVelocity -= finalFric * deltaTime;
                if (newVelocity < 0) newVelocity = 0;
            }
        }
        
        if (newVelocity < -finalSpeed) newVelocity = -finalSpeed;
        if (newVelocity > finalSpeed) newVelocity = finalSpeed;
        
        return newVelocity;
    }

    // Resolves collision by returning the corrected movement vector
    resolveCollision(entityBox: Box3, obstacles: Box3[], proposedMove: Vector3): Vector3 {
        // Clone the box and apply proposed move
        const futureBox = entityBox.clone().translate(proposedMove);
        let actualMove = proposedMove.clone();

        for (const obstacle of obstacles) {
            if (futureBox.intersectsBox(obstacle)) {
                // Simplistic collision: just cancel movement on the colliding axis
                // A better approach would be sliding, but this satisfies the current RED test
                actualMove.z = 0; 
                actualMove.x = 0;
                break;
            }
        }

        return actualMove;
    }
}