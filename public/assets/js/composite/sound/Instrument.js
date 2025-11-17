import * as Tone from "https://esm.sh/tone";
import {
  Sampler,
  Frequency,
  Players,
  ToneAudioBuffers,
  ToneAudioBuffer,
} from "https://esm.sh/tone";
import {
  TONAL_URLS,
  PERCUSSION_URLS,
  cachedBuffers,
} from "../data/SoundPalettes.js";

let cachedToneAudioBuffers = {};
let cachedSamplers = {};

export class Instrument {
  constructor(options, isPercussion, onload, ignoreEvents = false) {
    this.options = options;
    this.isPercussion = isPercussion;
    this.samplerArray = {};
    this.defaultVolume = ignoreEvents ? -11 : -6;
    this.onload = onload;
    this.ignoreEvents = ignoreEvents;
    this.currentInstrument = null;

    this.options.on("change-instrument", () => {
      this.setInstrument();
    });
    this.setInstrument();
  }

  reset() {
    //this.samplerArray = {}
    //cachedToneAudioBuffers = {}
    //this.currentInstrument = null
  }

  setInstrument() {
    const instrument =
      this.options[this.isPercussion ? "percussion" : "instrument"];
    if (this.currentInstrument === instrument) {
      return;
    }
    if (!this.samplerArray[instrument]) {
      this.samplerArray[instrument] = new Sampler();
    }
    this.currentInstrument = instrument;
    this.sampler = this.samplerArray[instrument].toDestination();

    Object.entries(cachedBuffers[instrument]).forEach((item) => {
      const note = item[0];
      const buffer = item[1];
      this.sampler.add(note, buffer);
    });

    this.sampler.volume.value = this.defaultVolume;
    if (!this.isPercussion) {
      this.sampler.release = 0.4;
    } else {
      this.sampler.fadeOut = 0.015;
    }

    // There's callstack issue, so we'll do this for now
    setTimeout(() => {
      if (this.onload) this.onload();
      this.options.emit("load-success");
    }, 100);
  }

  keyDown(note, time = Tone.now(), velocity = 1) {
    // if (this.sampler) {
    //   if (this.isPercussion) {
    //     if (velocity === "soften") {
    //       this.sampler.volume.value = -24;
    //     } else {
    //       this.sampler.volume.value = this.defaultVolume;
    //     }
    //     try {
    let midi = Frequency(note, "midi").toNote();
    this.sampler.triggerAttack(midi, time);
    //     } catch (e) {
    //       console.log(e);
    //     }
    //   } else {
    //     let midi = Frequency(note, "midi").toNote();
    //     //add some randomness to the velocity
    //     velocity = velocity * 0.8 + 0.2 * Math.random();
    //     this.sampler.triggerAttack(midi, time, velocity);
    //   }
    // }
  }

  keyUp(note, time = Tone.now()) {
    if (this.sampler && this.sampler) {
      if (!this.isPercussion) {
        let midi = Frequency(note, "midi").toNote();
        this.sampler.triggerRelease(midi, time);
      }
    }
  }

  set mute(m) {
    this.sampler.volume.value = m ? -100 : this.defaultVolume;
  }
  get mute() {
    return this.sampler.volume.value < this.defaultVolume;
  }
}
