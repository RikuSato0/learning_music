import { EventEmitter } from "https://esm.sh/events";

export const START_EACH_NOTE = true;

export const DEFAULT_SELECTION = {
  x: -1,
  y: -1,
};

export class Selector extends EventEmitter {
  constructor() {
    super();
    this.rows = 0;
    this.cols = 0;
    this.defaultY = 0;
    this.position = DEFAULT_SELECTION;
  }

  update(opts = {}) {
    if (opts.rows !== undefined) this.rows = opts.rows;
    if (opts.cols !== undefined) this.cols = opts.cols;
    if (opts.defaultY !== undefined) this.defaultY = opts.defaultY;
  }

  set(pos = {}, broadcast = true) {
    // console.log('selector set', pos)
    let clonedPos = {
      x: this.position.x,
      y: this.position.y,
    };
    if (pos.x !== undefined) clonedPos.x = pos.x;
    if (pos.y !== undefined) clonedPos.y = pos.y;
    // If selector is hidden do not allow to change y position
    if (clonedPos.x === -1) clonedPos.y = -1;
    // When selector is about to appear set y to the default instrument's first note
    // else if (clonedPos.x > -1 && clonedPos.y === -1) clonedPos.y = this.defaultY

    // Update position if it has changed
    if (clonedPos.x !== this.position.x || clonedPos.y !== this.position.y) {
      this.position = clonedPos;
      this.emit("change", this.position, broadcast);
    }
  }

  moveUp() {
    if (this.position.x === -1 && this.position.y === -1) return this.show();
    if (this.position.y === this.rows - 1) return this.emit("outofbounds");
    let y = this.position.y + 1;
    this.set({ y });
  }

  moveDown() {
    if (this.position.x === -1 && this.position.y === -1) return this.show();
    if (this.position.y === 0) return this.emit("outofbounds");
    let y = this.position.y - 1;
    this.set({ y });
  }

  moveLeft() {
    if (this.position.x === -1 && this.position.y === -1) return this.show();
    if (this.position.x === 0) return this.emit("outofbounds");
    let x = this.position.x - 1;
    if (this.position.x < 0) x = -1;
    this.set({ x });
  }

  moveRight() {
    if (this.position.x === -1 && this.position.y === -1) return this.show();
    if (this.position.x === this.cols - 1) return this.emit("outofbounds");
    let x = this.position.x + 1;
    this.set({ x });
  }

  add() {
    if (START_EACH_NOTE) this.emit("start");
    this.emit("add", this.position);
  }

  delete(args = {}) {
    if (START_EACH_NOTE) this.emit("start");
    this.emit("delete", this.position, args);
  }

  toggle() {
    if (START_EACH_NOTE) this.emit("start");
    this.emit("toggle", this.position);
  }

  showNoPick() {
    this.set({ x: 0, y: Math.floor((this.rows - this.defaultY) * 0.5) }, false);
    if (!START_EACH_NOTE) this.emit("start");
  }

  show() {
    this.set({ x: 0, y: this.defaultY }, false);
    if (!START_EACH_NOTE) this.emit("start");
  }

  hide() {
    this.set(DEFAULT_SELECTION);
  }
}
