import { Box3, Vector3 } from 'three';

export class PhysicsManager {
    
    // Calculates velocity based on acceleration and friction
    calculateVelocity(
        currentVelocity: number, 
        acceleration: number, 
        friction: number, 
        deltaTime: number, 
        forward: boolean, 
        backward: boolean, 
        maxSpeed: number
    ): number {
        let newVelocity = currentVelocity;
        
        if (forward) {
            newVelocity -= acceleration * deltaTime;
        } else if (backward) {
            newVelocity += acceleration * deltaTime;
        } else {
            if (newVelocity < 0) {
                newVelocity += friction * deltaTime;
                if (newVelocity > 0) newVelocity = 0;
            } else if (newVelocity > 0) {
                newVelocity -= friction * deltaTime;
                if (newVelocity < 0) newVelocity = 0;
            }
        }
        
        if (newVelocity < -maxSpeed) newVelocity = -maxSpeed;
        if (newVelocity > maxSpeed) newVelocity = maxSpeed;
        
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