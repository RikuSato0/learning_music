import { EventEmitter } from "https://esm.sh/events";
import { nameToScale } from "./ScaleMap.js";

export const MOBILE_BREAKPOINT = 1024;

export class SongOptions extends EventEmitter {
  constructor() {
    super();

    //rhythm
    this.bars = this.defaultBars; // 4
    this.beats = 4; // 4
    this.subdivision = 2; // 1
    this.tempo = 120;

    //notes
    this.octaves = this.defaultOctaves; // 2
    this.scale = "major"; // major
    this.percussionNotes = 2;
    this.rootNote = 48;

    //sounds
    this.instrument = "marimba";
    this.percussion = "electronic";
  }

  get rootPitch() {
    return this.rootNote % 12;
  }

  set rootPitch(p) {
    this.rootNote = this.rootOctave * 12 + p;
  }

  get highestNote() {
    return this.rootNote + this.octaves * 12 - (this.octaves == 1 ? 0 : 1);
  }

  set highestNote(h) {
    const octaves = (h - this.rootNote) / 12;
    this.octaves = Math.max(Math.ceil(octaves), 1);
  }

  get rootOctave() {
    return Math.floor(this.rootNote / 12);
  }
  set rootOctave(o) {
    this.rootNote = o * 12 + this.rootPitch;
  }

  get notesPerOctave() {
    return nameToScale(this.scale).length;
  }

  get totalNotes() {
    return this.notesPerOctave * this.octaves + (this.octaves === 1 ? 1 : 0);
  }

  get totalBeats() {
    return this.bars * this.beats;
  }

  get totalSubBeats() {
    return this.totalBeats * this.subdivision;
  }

  get subBeatsPerBar() {
    return this.beats * this.subdivision;
  }

  get defaultBars() {
    if (window.innerWidth < MOBILE_BREAKPOINT) return 1;
    else return 4;
  }

  get defaultOctaves() {
    if (window.innerWidth < MOBILE_BREAKPOINT) return 1;
    else return 2;
  }

  fromJSON(json) {
    Object.assign(this, json);
    this.emit("change");
    this.emit("change-instrument");
  }

  changeInstrument() {
    this.emit("change-instrument");
  }

  toJSON() {
    return {
      bars: this.bars,
      beats: this.beats,
      subdivision: this.subdivision,
      octaves: this.octaves,
      scale: this.scale,
      rootNote: this.rootNote,
      rootPitch: this.rootPitch,
      rootOctave: this.rootOctave,
      instrument: this.instrument,
      percussion: this.percussion,
      percussionNotes: this.percussionNotes,
      tempo: this.tempo,
    };
  }
}
