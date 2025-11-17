import * as Tone from "https://esm.sh/tone";
import { Part, Time } from "https://esm.sh/tone";
import { Instrument } from "./Instrument.js";
import TWEEN from "https://esm.sh/@tweenjs/tween.js";

export class SoundTrack {
  constructor(options, midiTrack, isPercussion, onload, ignoreEvents = false) {
    this.options = options;

    this.part = new Part(this.onnote.bind(this)).start(0);
    this.hotMic = false;
    this.track = midiTrack;

    if (!ignoreEvents) {
      this.track.on("add", (e) => this.addNote(e));

      this.track.on("remove", (e) => this.removeNote(e));

      this.track.on("touch", (noteObj) => {
        if (!isNaN(noteObj.pitch) && !this.hotMic) {
          if (midiTrack.getEvent(noteObj.time, noteObj.pitch)) {
            // there is a note already here, so play normal sound
            this.playNote(noteObj.pitch);
          } else {
            this.playNote(
              noteObj.pitch,
              0.15,
              undefined,
              isPercussion ? "soften" : 0.1
            );
          }
        }
      });
    }
    this.instrument = new Instrument(
      options,
      isPercussion,
      onload,
      ignoreEvents
    );
  }

  addNote(e) {
    this.part.add((e.time * Time("4n")) / this.options.subdivision, e);
    e.envelope = 0;
  }

  removeNote(e) {
    this.part.remove((e.time * Time("4n")) / this.options.subdivision, e);
  }

  onnote(time, e) {
    let notesInAColumn = this.track.getEventsAtTime(e.time);
    //the index determines the velocity
    const downbeat = e.time % this.options.subBeatsPerBar === 0;
    const stress = e.time % this.options.subdivision === 0;
    let velocity = downbeat ? 1 : 0.8;
    velocity = stress ? velocity : velocity * 0.8;

    // Adjust Velocity Based on simultaneous notes
    if (notesInAColumn.length > 9) {
      velocity *= 0.55;
    } else if (notesInAColumn.length > 4) {
      velocity *= 0.75;
    }

    const duration = Time("4n") / this.options.subdivision;

    this.playNote(e.note, duration, time, velocity);

    //add an envelope to the event
    const envDecay = new TWEEN.Tween(e)
      .to({ envelope: 0 }, duration * 1000)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
    const envAttack = new TWEEN.Tween(e)
      .to({ envelope: 1 }, 20)
      .delay(Tone.context.lookAhead * 1000)
      .start()
      .chain(envDecay);
  }

  set mute(m) {
    this.instrument.mute = m;
  }
  get mute() {
    return this.instrument.mute;
  }

  clear() {
    this.part.clear();
  }

  syncWithMidiTrack() {
    this.clear();
    this.track.forEach((e) => this.addNote(e));
  }

  playNote(
    note,
    duration = Time("4n") / this.options.subdivision,
    time = Tone.now(),
    velocity = 1
  ) {
    //console.log(note, time, this.part)
    this.instrument.keyDown(note, time, velocity);
    this.instrument.keyUp(note, time + duration);
  }

  setHotMic(hotMic) {
    this.hotMic = hotMic;
  }
}
