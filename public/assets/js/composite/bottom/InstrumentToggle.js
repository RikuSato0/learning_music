import { EventEmitter } from "https://esm.sh/events";

export class InstrumentToggle extends EventEmitter {
  constructor(container, instruments) {
    super();

    this.currentInstrument = 0;
    this.instruments = instruments;

    this.container = document.createElement("button");
    this.container.classList.add("button");
    container.appendChild(this.container);

    this.changeInstrument(this.currentInstrument, true);

    this.container.addEventListener("click", () => {
      this.changeInstrument();
    });
  }

  changeInstrument(num, firstTime = false) {
    var newInstrument = this.currentInstrument;
    if (num !== undefined) {
      if (num > -1 && num < this.instruments.length) {
        newInstrument = num;
      }
    } else {
      newInstrument++;
      if (newInstrument >= this.instruments.length) {
        newInstrument = 0;
      }
    }
    if (newInstrument !== this.currentInstrument || firstTime) {
      this.container.textContent = this.instruments[newInstrument].name;
      this.container.classList.remove(
        "instrument-" +
          this.instruments[this.currentInstrument].name.toLowerCase()
      );
      this.currentInstrument = newInstrument;
      this.container.classList.add(
        "instrument-" +
          this.instruments[this.currentInstrument].name.toLowerCase()
      );
      if (!firstTime) {
        this.emit("change", this.instruments[this.currentInstrument].audioPath);
      }
    }
  }

  changeInstrumentByName(str) {
    if (!str) return false;
    var index = this.instruments.findIndex(function (instrument) {
      return instrument.audioPath == str;
    });

    if (index > -1) {
      this.changeInstrument(index);
    }
  }
}
