import * as Tone from "https://esm.sh/tone";
import { Waveform } from "https://esm.sh/tone";
import Pitchfinder from "https://esm.sh/pitchfinder";
import { EventEmitter } from "https://esm.sh/events";
import { rAF } from "../grid/AnimationFrame.js";
import { closestPitch, ftom, ftomFloat } from "../data/ScaleMap.js";

export class PitchDetect extends EventEmitter {
  constructor(microphone, options) {
    super();

    this.options = options;

    const size = Math.pow(2, 10); // values over 1024 don't work on Safari
    this.analyser = new Waveform(size);
    microphone.connect(this.analyser);

    // const pitchWorker = new PitchWorker()
    const getPitch = Pitchfinder.Macleod({
      sampleRate: Tone.context.sampleRate,
    });

    this.levelMeter = false;
    this.pitchMeter = false;

    this.rms = 0;
    this.smoothingFactor = 0.9;
    this.probability = 0;
    this.frequency = -1;
    this.lastNote = -1;

    rAF(() => {
      if (this.active) {
        const values = this.analyser.getValue();
        this.getRMS(values);
        if (this.pitchMeter) {
          const { freq, probability } = getPitch(values);
          this.getPitch(freq, probability);
        } else {
          this.probability = 0;
          this.frequency = -1;
          this.lastNote = -1;
        }
      } else {
        this.probability = 0;
        this.frequency = -1;
        this.lastNote = -1;
        this.rms = 0;
      }
    });
  }

  get active() {
    return this.levelMeter || this.pitchMeter;
  }

  set active(a) {
    this.levelMeter = a;
    this.pitchMeter = a;
  }

  getRMS(values) {
    const currentRMS = Math.sqrt(
      values.reduce(
        (total, currentVal) => (total += Math.pow(currentVal, 2)),
        0
      ) / values.length
    );
    this.rms = Math.max(currentRMS, this.rms * this.smoothingFactor);
    this.emit("level", this.rms);
  }

  getPitch(frequency, probability) {
    //scale the probability
    const probMin = 0.5;
    const probMax = 1;
    probability = (probability - probMin) / (probMax - probMin);
    probability = Math.max(probability, 0);
    if (frequency > 0) {
      if (this.lastNote === -1) {
        //if it was previously undefined, jump to it
        this.frequency = frequency;
      } else {
        //otherwise smoothly move to it
        this.frequency =
          this.frequency * this.smoothingFactor +
          (1 - this.smoothingFactor) * frequency;
      }
      //the probability can only rise by a small factor each time
      this.probability = Math.min(
        this.probability * this.smoothingFactor +
          probability * (1 - this.smoothingFactor),
        probability
      );
    } else {
      //smoothly drop back down
      this.probability *= this.smoothingFactor;
    }

    if (this.frequency !== -1) {
      const midi = ftomFloat(this.frequency);
      const note = ftom(this.frequency);
      //drop the probability down if the lastNote !== note
      if (note !== this.lastNote) {
        this.probability *= 0.5;
      }
      this.emit("pitch", {
        note,
        midi,
        closestPitch: closestPitch(
          note,
          this.options.rootNote,
          this.options.scale
        ),
        probability: this.probability,
        frequency: this.frequency,
      });

      this.lastNote = note;
    } else {
      this.lastNote = -1;
    }
  }
}
