import { EventEmitter } from "https://esm.sh/events";
import "../../../css/composite/chrome/bottom.scss";
import { Transport } from "https://esm.sh/tone";
import { TempoSlider } from "./TempoSlider.js";
import { InstrumentToggle } from "./InstrumentToggle.js";
import { PitchModal } from "../modal/Pitch.js";
import { SongOptions } from "../data/SongOptions.js";
import { MidiModal } from "../modal/Midi.js";
import { GA } from "../functions/GA.js";

export class Bottom extends EventEmitter {
  constructor(container = document.body, options) {
    super();

    this.firstLoad = true;

    this.modals = {
      pitch: false,
      midi: false,
    };

    this.songChanged = false;

    this.container = document.createElement("div");
    this.container.id = "bottom";
    container.appendChild(this.container);
    this.bottomLeft = document.createElement("div");
    this.bottomLeft.id = "bottom-left";
    this.container.appendChild(this.bottomLeft);
    this.bottomRight = document.createElement("div");
    this.bottomRight.id = "bottom-right";
    this.container.appendChild(this.bottomRight);

    //the undo/redo
    this.options = options;

    //play button
    this.playButton = document.createElement("button");
    this.playButton.id = "play-button";
    this.playButton.textContent = "Play";
    this.playButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.toggle();
      GA.track({ eventCategory: "bottom", eventLabel: "play/pause" });
    });

    this.meterButton = document.createElement("button");
    this.meterButton.id = "meter-button";
    this.meterButton.classList.add("button");
    this.meterButton.textContent = "Tempo";
    this.meterButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.toggleMeter();

      GA.track({ eventCategory: "bottom", eventLabel: "tempo" });
    });

    this.bottomLeft.appendChild(this.playButton);

    this.instrumentTonalButton = new InstrumentToggle(this.bottomLeft, [
      {
        name: "Marimbaa",
        audioPath: "marimba",
      },
      {
        name: "Piano",
        audioPath: "piano",
      },
      {
        name: "Strings",
        audioPath: "strings",
      },
      {
        name: "Woodwind",
        audioPath: "woodwind",
      },
      {
        name: "Synth",
        audioPath: "synth",
      },
    ]);
    this.instrumentTonalButton.container.id = "instrument-toggle-button";
    this.instrumentTonalButton.on("change", (name) => {
      this.emit("instrument-change", name);
      this.songChanged = true;
      GA.track({
        eventCategory: "bottom",
        eventLabel: "instrument:tonal:" + name,
      });
    });

    this.percussionButton = new InstrumentToggle(this.bottomLeft, [
      {
        name: "Electronic",
        audioPath: "electronic",
      },
      {
        name: "Blocks",
        audioPath: "woodblock",
      },
      {
        name: "Kit",
        audioPath: "kit",
      },
      {
        name: "Conga",
        audioPath: "bongo",
      },
    ]);

    this.percussionButton.container.id = "percussion-toggle-button";
    this.percussionButton.on("change", (name) => {
      this.emit("percussion-change", name);
      this.songChanged = true;
      GA.track({
        eventCategory: "bottom",
        eventLabel: "instrument:percussion:" + name,
      });
    });

    //spacebar starts/stops
    window.addEventListener("keydown", (e) => {
      if (e.keyCode === 32) {
        this.toggle(false);
      }
    });

    //tempo slider
    this.tempoSlider = new TempoSlider(this.container);
    this.tempoSlider.on("change", (tempo) => {
      this.emit("tempo", tempo);
      if (this.firstLoad) {
        this.firstLoad = false;
      } else {
        this.disableSaveButton(false);
        this.songChanged = true;
      }
    });

    this.options.on("change", () => {
      this.tempoSlider.tempo = this.options.tempo;
    });

    this.options.on("change-instrument", () => {
      this.percussionButton.changeInstrumentByName(this.options.percussion);
      this.instrumentTonalButton.changeInstrumentByName(
        this.options.instrument
      );
    });

    this.undoButton = document.createElement("button");
    this.undoButton.id = "undo-button";
    this.undoButton.classList.add("button");
    this.undoButton.textContent = "Undo";
    this.undoButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.emit("undo");
      GA.track({ eventCategory: "bottom", eventLabel: "undo" });
    });

    this.resetButton = document.createElement("button");
    this.resetButton.id = "reset-button";
    this.resetButton.classList.add("button");
    this.resetButton.textContent = "Restart";
    this.resetButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.emit("stop");
      this.emit("restart");
      this.emit("settings-update", new SongOptions().toJSON(), true);
      GA.track({ eventCategory: "bottom", eventLabel: "restart" });
    });

    this.settingsButton = document.createElement("button");
    this.settingsButton.id = "settings-button";
    this.settingsButton.classList.add("button");
    this.settingsButton.textContent = "Settings";
    this.settingsButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.emit("settings");
      GA.track({ eventCategory: "bottom", eventLabel: "settings" });
    });

    this.saveButton = document.createElement("button");
    this.saveButton.id = "save-button";
    this.saveButton.classList.add("button");
    this.saveButton.textContent = "Save";
    this.saveButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.emit(this.songChanged ? "save" : "share");
      this.songChanged = false;
      GA.track({ eventCategory: "bottom", eventLabel: "save" });
    });

    this.midiButton = document.createElement("button");
    this.midiButton.id = "midi-button";
    this.midiButton.classList.add("button");
    this.midiButton.textContent = "Midi";
    this.midiButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.emit("midi");

      GA.track({ eventCategory: "bottom", eventLabel: "midi" });
    });

    this.micButton = document.createElement("button");
    this.micButton.id = "mic-button";
    this.micButton.classList.add("button");
    this.micButton.textContent = "Mic";
    this.micButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.emit("mic");
      GA.track({ eventCategory: "bottom", eventLabel: "microphone" });
    });

    // Button Order
    this.bottomRight.appendChild(this.midiButton);
    this.bottomRight.appendChild(this.micButton);
    this.bottomRight.appendChild(this.resetButton);
    this.bottomRight.appendChild(this.settingsButton);
    this.bottomRight.appendChild(this.undoButton);
    this.bottomRight.appendChild(this.saveButton);

    this.bottomLeft.appendChild(this.meterButton);
    this.disableSaveButton(true);

    Transport.on("start", () => {
      this.playButtonPlaying(true);
    });
    Transport.on("stop", () => {
      this.playButtonPlaying(false);
    });
  }

  disableSaveButton(bool) {
    if (bool) {
      this.saveButton.disabled = true;
    } else {
      this.saveButton.removeAttribute("disabled");
    }
  }

  toggleMeter() {
    if (this.meterButton.classList.contains("expand")) {
      this.meterButton.classList.remove("expand");
      document.getElementById("tempo-slider").classList.remove("show");
    } else {
      this.meterButton.classList.add("expand");
      document.getElementById("tempo-slider").classList.add("show");
    }
  }

  toggle(fromStart = true) {
    this.playButtonPlaying(!this.playButton.classList.contains("playing"));

    //pass a callback method which is invoked with the transport state
    if (fromStart) {
      this.emit("play", this.playButton.classList.contains("playing"));
    } else {
      this.emit(
        "play-from-selector",
        this.playButton.classList.contains("playing")
      );
    }
  }

  playButtonPlaying(bool) {
    if (bool) {
      this.playButton.classList.add("playing");
      this.playButton.textContent = "Stop";
    } else {
      this.playButton.classList.remove("playing");
      this.playButton.textContent = "Play";
    }
  }

  enableKeyboard() {
    this.midiButton.classList.add("visible");
    this.tempoSlider.container.classList.add("has-midi");
  }

  enableMicrophone() {
    this.micButton.classList.add("visible");
  }

  midiModal(showModal) {
    if (showModal && !this.modals.midi) {
      if (this.modals.pitch && this.modals.pitch !== true) {
        this.modals.pitch.closeModal();
      }
      this.modals.midi = new MidiModal();
      this.modals.midi.on("cancel", () => {
        this.modals.midi = false;
      });
    } else if (this.modals.midi && !showModal && this.modals.midi !== true) {
      this.modals.midi.close();
      this.modals.midi = true;
    }
  }

  pitchModal(showModal) {
    if (showModal && !this.modals.pitch) {
      if (this.modals.midi && this.modals.midi !== true) {
        this.modals.midi.closeModal();
      }
      this.modals.pitch = new PitchModal();
      this.modals.pitch.on("cancel", () => {
        this.modals.pitch = false;
      });
    } else if (this.modals.pitch && !showModal && this.modals.pitch !== true) {
      this.modals.pitch.close();
      this.modals.pitch = true;
    }
  }

  set micRecording(recording) {
    if (recording) {
      this.micButton.classList.add("recording", "mobile-pointer-none");
    } else {
      this.micButton.classList.remove("recording");

      setTimeout(() => {
        this.micButton.classList.remove("mobile-pointer-none");
      }, 100);
    }
    this._micRecording = recording;
    this.pitchModal(recording);
  }

  get micRecording() {
    return this._micRecording;
  }

  set midiRecording(recording) {
    if (recording) {
      this.midiButton.classList.add("recording");
    } else {
      this.midiButton.classList.remove("recording");
    }
    this.midiModal(recording);
  }
}
