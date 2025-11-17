import { MidiTrack } from "./Track.js";
import { encodeMidi } from "./Encoder.js";
import { decodeMidi } from "./Decoder.js";

//all of the events
export class MidiData {
  constructor() {
    this.instrument = new MidiTrack();
    this.percussion = new MidiTrack(true);
  }

  clear() {
    this.instrument.clear();
    this.percussion.clear();
  }

  morph(newOptions, prevOptions) {
    this.instrument.morph(newOptions, prevOptions);
    this.percussion.morph(newOptions, prevOptions);
  }

  replace(timelines) {
    this.instrument.replace(timelines.instrument);
    this.percussion.replace(timelines.percussion);
  }

  encode(options) {
    return encodeMidi(options, this.percussion, this.instrument);
  }

  decode(data, options) {
    this.clear();
    decodeMidi(data, options, this.percussion, this.instrument);
  }

  get timelines() {
    return {
      instrument: this.instrument.timeline,
      percussion: this.percussion.timeline,
    };
  }

  get lowestNote() {
    return this.instrument.lowestNote;
  }

  get highestNote() {
    return this.instrument.highestNote;
  }
}
