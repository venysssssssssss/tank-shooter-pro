export interface ITankStats {
    maxSpeed: number;
    maxHealth: number;
    damage: number;
    acceleration: number;
    friction: number;
    turnSpeed: number;
    shootDelay: number;
}

export abstract class BaseTank implements ITankStats {
    public abstract maxSpeed: number;
    public abstract maxHealth: number;
    public abstract damage: number;
    public abstract acceleration: number;
    public abstract friction: number;
    public abstract turnSpeed: number;
    public abstract shootDelay: number;
}

export class LightTank extends BaseTank {
    public maxSpeed = 50;
    public maxHealth = 70;
    public damage = 10;
    public acceleration = 120;
    public friction = 50;
    public turnSpeed = 4.5;
    public shootDelay = 0.15;
}

export class MediumTank extends BaseTank {
    public maxSpeed = 35;
    public maxHealth = 100;
    public damage = 20;
    public acceleration = 80;
    public friction = 60;
    public turnSpeed = 3.5;
    public shootDelay = 0.25;
}

export class HeavyTank extends BaseTank {
    public maxSpeed = 20;
    public maxHealth = 150;
    public damage = 35;
    public acceleration = 50;
    public friction = 80;
    public turnSpeed = 2.0;
    public shootDelay = 0.50;
}