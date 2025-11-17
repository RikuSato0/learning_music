import { EventEmitter } from "https://esm.sh/events";
import { Selector } from "../input/Selector.js";
import { TouchGrid } from "./TouchGrid.js";
import { bus } from "../data/EventBus.js";

export class InputManager extends EventEmitter {
  constructor() {
    super();
    this.instruments = [];
    this.offsets = [];
    this.touches = [];
    this.defaultInstrumentIndex = 0;

    // Setup Selector
    this.selector = new Selector();
    this.selector.on("start", (pos) => this.onInteractionStart());
    this.selector.on("change", (pos) => this.onSelectorChange(pos));
    this.selector.on("outofbounds", () => this.onSelectorOutOfBounds());
    this.selector.on("add", (pos) => this.onAddNote(pos));
    this.selector.on("toggle", (pos) => this.onSelectorToggle(pos));
    this.selector.on("delete", (pos, args = {}) => {
      this.onSelectorDelete(pos, args);
    });
  }

  computeOffsets() {
    // Input manager 'stacks' instrument rows on top of each other to get a single grid that covers all interactable cells
    // global y:    0 1   2 3 4 ...
    // instrumet y: 0 1 | 0 1 2 ...
    // offsets keeps track of how hight in globaly y coordinates does it start
    this.offsets = [];
    this.instruments.forEach((instrument, i) => {
      this.offsets[i] =
        (this.instruments[i - 1] ? this.instruments[i - 1].rows : 0) +
        (this.offsets[i - 1] ? this.offsets[i - 1] : 0);
      this.touches[i].offsetY = this.offsets[i];
    });
  }

  updateSelector() {
    const rows = this.instruments.reduce(
      (acc, instrument) => acc + instrument.rows,
      0
    );
    this.selector.update({
      defaultY: this.offsets[this.defaultInstrumentIndex],
      rows: rows,
      cols: this.instruments[0] ? this.instruments[0].cols : 0,
    });
  }

  update() {
    this.computeOffsets();
    this.updateSelector();
  }

  registerInstrument(instrument, isDefault = false) {
    this.instruments.push(instrument);
    instrument.on("reset", () => this.update());
    if (isDefault) this.defaultInstrumentIndex = this.instruments.length - 1;
    const touch = new TouchGrid(instrument);
    touch.on("testPosition", (...args) => this.onTestPosition(...args));
    touch.on("pointerdown", (...args) => this.onInteractionStart(...args));
    touch.on("add", (...args) => this.onAddNote(...args));
    touch.on("remove", (...args) => this.onRemoveNote(...args));
    this.touches.push(touch);
    this.update();
  }

  indexToInstrument(pos) {
    // Converts global coordinate to particular instrument coordinate
    // Returns new position and the instrument object it belongs to
    let index = 0;
    for (let i = this.offsets.length - 1; i >= 0; i--) {
      if (this.offsets[i] <= pos.y) {
        index = i;
        break;
      }
    }
    return {
      instrument: this.instruments[index],
      pos: {
        x: pos.x,
        y: pos.y - this.offsets[index],
      },
    };
  }

  onInteractionStart() {
    bus.emit("history:push", { type: "start" });
  }

  onSelectorOutOfBounds() {
    // Forward the outofbounds event
    this.emit("outofbounds");
  }

  onSelectorChange(globalPos, broadcast = true) {
    let { instrument, pos } = this.indexToInstrument(globalPos);
    let positions = [];
    this.instruments.forEach((instr) => {
      let localPos = {
        x: pos.x,
        y: instr === instrument ? pos.y : -1,
      };
      instr.select(localPos);
      positions.push({
        instrument: instr,
        position: localPos,
      });
    });
    // Forward the selection change event
    if (broadcast) this.emit("select", positions);
  }

  onSelectorToggle(globalPos) {
    let { instrument, pos } = this.indexToInstrument(globalPos);
    if (instrument.has(pos)) {
      this.onRemoveNote(globalPos);
    } else {
      this.onAddNote(globalPos);
    }
  }

  onSelectorDelete(globalPos, args = {}) {
    for (let i = 0; i < this.selector.rows; i++) {
      this.onRemoveNote({ x: globalPos.x, y: i }, args);
    }
  }

  onTestPosition(globalPos, cb) {
    let { instrument, pos } = this.indexToInstrument(globalPos);
    cb(instrument.has(pos));
    // Hide selection
    this.selector.hide();
  }

  onAddNote(globalPos) {
    let { instrument, pos } = this.indexToInstrument(globalPos);
    let success = instrument.addNote(pos);
    if (success) {
      this.emit("song-changed");
    }
  }

  onRemoveNote(globalPos, args = {}) {
    let { instrument, pos } = this.indexToInstrument(globalPos);
    let success = instrument.removeNote(pos);
    if (success) {
      if (args && args.isDeleteKey) {
        this.emit("play-delete-sound");
      }
      this.emit("song-changed");
    }
  }

  selectDefaultInstrument(pitch) {
    try {
      let pitchIndex =
        this.instruments[this.defaultInstrumentIndex].pitchToIndex(pitch);
      let y = pitchIndex + this.offsets[this.defaultInstrumentIndex];
      this.selector.set({ y });
      return pitchIndex;
    } catch (err) {
      return NaN;
    }
  }
}
