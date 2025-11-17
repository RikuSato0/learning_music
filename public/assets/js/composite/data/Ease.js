export class Ease {
    constructor(v, coef = 0.03, onUpdate = () => { }) {
        this.coef = coef
        this.onUpdate = onUpdate
        this._goal = v
        this._val = v
    }

    get value() {
        return this._val
    }

    set value(v) {
        this._val = v
    }

    get goal() {
        return this._goal
    }

    set goal(v) {
        this._goal = v
    }

    get diff() {
        return this._goal - this._val
    }

    skip() {
        this._val = this._goal
    }

    step() {
        this._val = this._val + this.diff * this.coef
    }
}
