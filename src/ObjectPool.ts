export class ObjectPool<T> {
    factoryFunc: () => T;
    pool: T[];

    constructor(factoryFunc: () => T) {
        this.factoryFunc = factoryFunc;
        this.pool = [];
    }

    get(): T {
        if (this.pool.length > 0) {
            return this.pool.pop() as T;
        }
        return this.factoryFunc();
    }

    release(obj: T): void {
        this.pool.push(obj);
    }
}