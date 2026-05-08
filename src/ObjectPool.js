export class ObjectPool {
    constructor(factoryFunc) {
        this.factoryFunc = factoryFunc;
        this.pool = [];
    }

    get() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return this.factoryFunc();
    }

    release(obj) {
        this.pool.push(obj);
    }
}