import { EventEmitter } from "https://esm.sh/events";
import { MidiKeyboard } from "./MidiKeyboard.js";

function delay(t) {
  return new Promise(function (resolve) {
    setTimeout(resolve, t);
  });
}

//the midi keyboard
//emits keyDown event and keyUp events
export class Keyboard extends EventEmitter {
  constructor(songOptions, inputManager) {
    super();

    this.songOptions = songOptions;
    this.inputManager = inputManager;

    this.midi = new MidiKeyboard();
    this.midi.on("keyDown", (note) => this.noteOn(note));

    this.inputManager.on("outofbounds", () => {
      if (this.recording) this.recording = false;
    });

    this._recording = false;
    this._active = false;
  }

  async connected() {
    await this.midi.enable();
    return await this.midi.connected();
  }

  set recording(r) {
    let changed = r !== this._recording;
    this._recording = r;
    this._active = r;
    if (changed) {
      if (r) {
        this.emit("start");
      } else {
        this.inputManager.selector.hide();
        this.emit("end");
      }
    }
  }

  get recording() {
    return this._recording;
  }

  async noteOn(note) {
    if (!this._recording) return;

    if (this._active) {
      let pitchIndex = this.inputManager.selectDefaultInstrument(note);
      if (isNaN(pitchIndex) || note > this.songOptions.highestNote) {
        this.emit("outofbounds");
        return;
      }
      this.inputManager.selector.add();
      this._active = false;
      await delay(100);
      this.inputManager.selector.moveRight();
      this._active = true;
    }
  }
}
