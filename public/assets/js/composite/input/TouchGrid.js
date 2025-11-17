import { EventEmitter } from "https://esm.sh/events";

const MOUSE = "mouse";
const TOUCH = "touch";

export class TouchGrid extends EventEmitter {
  constructor(instrument) {
    super();

    this.instrument = instrument;
    this.el = instrument.canvas;
    this.lastTouch = new Map();
    this.inputMode = new Map();
    this.tileWidth = 0;
    this.tileHeight = 0;
    this.rows = 0;
    this.cols = 0;
    this.offsetY = 0;
    this.scroll = {
      x: instrument.scroll.x,
      y: instrument.scroll.y,
    };

    // Instrument Events
    this.onInstrumentResize();
    this.onInstrumentReset();
    this.instrument.on("reset", () => this.onInstrumentReset());
    this.instrument.on("resize", () => this.onInstrumentResize());
    this.instrument.on("scroll", (opts) => this.onInstrumentScroll(opts));

    // Mouse Events
    this.el.addEventListener("mousedown", (e) => this.onMouseDown(e));
    this.el.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("mouseup", (e) => this.onMouseUp(e));

    // Touch Events
    this.el.addEventListener("touchstart", (e) => this.onTouchStart(e));
    this.el.addEventListener("touchmove", (e) => this.onTouchMove(e));
    window.addEventListener("touchend", (e) => this.onTouchEnd(e));
  }

  onInstrumentReset() {
    this.rows = this.instrument.rows;
    this.cols = this.instrument.cols;
  }

  onInstrumentResize() {
    if (this.instrument.tileWidth !== undefined)
      this.tileWidth = this.instrument.tileWidth;
    if (this.instrument.tileHeight !== undefined)
      this.tileHeight = this.instrument.tileHeight;
  }

  onInstrumentScroll(opts) {
    this.scroll.x = opts.x;
    this.scroll.y = opts.y;
  }

  getPosition(pointerX, pointerY, key) {
    const x = Math.floor((this.scroll.x + pointerX) / this.tileWidth);
    let y = Math.floor((this.scroll.y + pointerY) / this.tileHeight);
    // Makes sure x,y are within the grid bounds
    if (x < 0 || this.cols <= x) return false;
    if (y < 0 || this.rows <= y) return false;
    // Flip coordinates
    y = this.rows - 1 - y;
    // Add in global offset
    y += this.offsetY;

    if (this.lastTouch.has(key)) {
      const lastPosition = this.lastTouch.get(key);
      if (lastPosition.x === x && lastPosition.y === y) {
        return false;
      }
    }

    this.lastTouch.set(key, { x, y });
    return { x, y };
  }

  down(x, y, key) {
    const pos = this.getPosition(x, y, key);
    if (pos) {
      //test if there is an element at that position
      this.emit("pointerdown");
      this.emit("testPosition", pos, (exists) => {
        if (!exists) {
          this.inputMode.set(key, "add");
          this.emit("add", pos);
        } else {
          this.inputMode.set(key, "remove");
          this.emit("remove", pos);
        }
      });
    }
  }

  move(x, y, key) {
    const mode = this.inputMode.get(key);
    const pos = this.getPosition(x, y, key);
    if (pos && mode) {
      //get the input mode for that key
      this.emit(mode, pos);
    }
  }

  up(key) {
    // remove the last touch and input mode
    this.emit("pointerup");
    this.lastTouch.delete(key);
    this.inputMode.delete(key);
  }

  onMouseDown(e) {
    this.down(e.offsetX, e.offsetY, MOUSE);
  }

  onMouseMove(e) {
    let buttons = e.buttons;
    // Safari does not support the standard e.buttons, but does have a similar e.which
    if (buttons === undefined) buttons = e.which;
    if (buttons === 1) {
      this.move(e.offsetX, e.offsetY, MOUSE);
    }
  }

  onMouseUp() {
    this.up(MOUSE);
  }

  touchToOffsetX(target, touch) {
    var rect = target.getBoundingClientRect();
    return {
      x: touch.pageX - rect.left,
      y: touch.pageY - rect.top,
    };
  }

  onTouchStart(e) {
    if (e.targetTouches.length > 1) return; // Ignore multi touches
    e.preventDefault(); // Stop mouse events from occuring
    let pos = this.touchToOffsetX(e.target, e.targetTouches[0]);
    this.down(pos.x, pos.y, TOUCH);
  }

  onTouchMove(e) {
    if (e.targetTouches.length > 1) return; // Ignore multi touches
    let pos = this.touchToOffsetX(e.target, e.targetTouches[0]);
    this.move(pos.x, pos.y, TOUCH);
  }

  onTouchEnd(e) {
    if (e.targetTouches.length > 1) return; // Ignore multi touches
    this.up(TOUCH);
  }
}
