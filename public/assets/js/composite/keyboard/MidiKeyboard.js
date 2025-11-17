import { EventEmitter } from "https://esm.sh/events";
import WebMidi from "https://esm.sh/webmidi";

//the midi keyboard
//emits keyDown event and keyUp events
export class MidiKeyboard extends EventEmitter {
  constructor() {
    super();

    this.enabled = false;
    this.connections = [];
    this.currentNotes = new Map();
  }

  enable() {
    if (WebMidi.supported && !this.enabled) {
      return new Promise((done, error) => {
        WebMidi.enable((err) => {
          if (!err) {
            this.enabled = true;
            if (WebMidi.inputs) {
              WebMidi.inputs.forEach((input) => this._bindInput(input));
            }

            WebMidi.addListener("connected", (e) => {
              if (e.port.type === "input") {
                this._bindInput(e.port);
              }
            });

            WebMidi.addListener("disconnected", (e) => {
              const device = this.getDeviceById(e.port.id);
              if (device) {
                this.emit("disconnect", device);
                device.removeListener("noteon");
                device.removeListener("noteoff");
                this.removeDevice(e.port.id);
              }
            });
            done();
          } else {
            error(err);
          }
        });
      });
    } else {
      return Promise.reject();
    }
  }

  getDeviceById(id) {
    const index = this.connections.findIndex((d) => d.id === id);
    return this.connections[index];
  }

  connected() {
    if (this.connections.length) {
      return this.connections;
    } else {
      return new Promise((done) => {
        this.on("connect", () => {
          done(this.connections);
        });
      });
    }
  }

  removeDevice(id) {
    const index = this.connections.findIndex((d) => d.id === id);
    this.connections.splice(index, 1);
  }

  _bindInput(inputDevice) {
    if (this.enabled) {
      if (!this.getDeviceById(inputDevice.id)) {
        const device = WebMidi.getInputById(inputDevice.id);
        this.connections.push(device);
        this.emit("connect", device);

        device.addListener("noteon", this.channel, (e) => {
          //debounce duplicate notes
          if (
            (this.currentNotes.has(e.note.number) &&
              e.timestamp - this.currentNotes.get(e.note.number) > 5) ||
            !this.currentNotes.has(e.note.number)
          ) {
            this.currentNotes.set(e.note.number, e.timestamp);
            this.emit("keyDown", e.note.number, e.velocity, e.timestamp);
          }
        });
        device.addListener("noteoff", this.channel, (e) => {
          this.emit("keyUp", e.note.number, e.velocity, e.timestamp);
        });
        device.addListener("controlchange", this.channel, (e) => {
          if (e.controller.name === "holdpedal") {
            this.emit("pedal", e.value, e.timestamp);
          }
        });
      }
    }
  }
}
