import { SoundTrack } from "./Track.js";
// import {RenderOffline} from './RenderOffline'
import * as Tone from "https://esm.sh/tone";
import {
  Offline,
  Synth,
  Transport,
  Player,
  Time,
  Oscillator,
  Gain,
} from "https://esm.sh/tone";
import { EventEmitter } from "https://esm.sh/events";
import * as toWav from "https://esm.sh/audiobuffer-to-wav";
import { TONAL_URLS } from "../data/SoundPalettes.js";
import * as cloneDeep from "https://esm.sh/clone-deep";

function makeWavFromBuffer(buffer, id) {
  const anchor = document.createElement("a");
  document.body.appendChild(anchor);
  anchor.style = "display: none";

  const wav = toWav.default(buffer._buffer);
  const blob = new window.Blob([new DataView(wav)], {
    type: "audio/wav",
  });

  const url = window.URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = id + ".wav";
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export class Sound extends EventEmitter {
  constructor(options, midiData) {
    super();

    this.midiData = midiData;
    this.options = options;

    //make two tracks for each of the midi data tracks
    this.instrumentTrack = new SoundTrack(options, midiData.instrument, false);
    this.percussionTrack = new SoundTrack(options, midiData.percussion, true);

    Transport.loop = true;
    Tone.context.lookAhead = 0.1;
    Tone.context.updateInterval = 0.01;

    this.options.on("change", () => {
      Transport.bpm.value = this.options.tempo;
      Transport.loopEnd = Time("4n") * this.options.totalBeats;
    });
    Transport.loopEnd = Time("4n") * this.options.totalBeats;

    this.bumpSound = new Player("audio/sfx/bump.mp3").toDestination();
    this.bumpSound.autostart = false;
    this.bumpPlaying = false;

    this.deleteSound = new Player("audio/sfx/delete.mp3").toDestination();
    this.deleteSound.autostart = false;
  }

  downloadMidi() {
    const midi = this.midiData.encode(this.options);
    const url = window.URL.createObjectURL(midi);
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = "song-maker.mid";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  //just an alias for the midi data tempo
  set tempo(t) {
    this.options.tempo = t;
    Transport.bpm.value = t;
  }
  get tempo() {
    return this.options.tempo;
  }

  set mute(m) {
    this.instrumentTrack.mute = m;
  }
  get mute() {
    return this.instrumentTrack.mute;
  }

  get position() {
    //return the normalized position of the transport
    if (Transport.state === "started") {
      return Time(Transport.ticks, "i") / Transport.loopEnd;
    } else {
      return -1;
    }
  }

  start(time = "+0.1", offset) {
    Transport.start(time, offset);
  }

  stop(time = Tone.now()) {
    Transport.stop(time);
  }

  clear() {
    this.instrumentTrack.clear();
    this.percussionTrack.clear();
  }

  playNote(...args) {
    this.instrumentTrack.playNote(...args);
  }

  resumeContext() {
    if (Tone.context.state !== "running" && Tone.context.state !== "closed") {
      Tone.context.resume();
    }
  }

  syncWithMidiTrack() {
    this.instrumentTrack.syncWithMidiTrack();
    this.percussionTrack.syncWithMidiTrack();
  }

  introBeep() {
    const quarterDur = Time("4n");
    const now = Tone.now() + 0.1;
    const gainNode = new Gain().toMaster();
    const osc = new Oscillator().connect(gainNode);
    osc.start(now).stop(now + quarterDur * 2);
    osc.frequency.setValueAtTime("C5", now);
    osc.frequency.setValueAtTime("C6", now + quarterDur);

    const attackTime = 0.01;
    const releaseTime = 0.1;
    const maxVal = 0.5;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(maxVal, now + attackTime);
    gainNode.gain.linearRampToValueAtTime(0, now + releaseTime);
    gainNode.gain.setValueAtTime(0, now + quarterDur);
    gainNode.gain.linearRampToValueAtTime(
      maxVal,
      now + quarterDur + attackTime
    );
    gainNode.gain.linearRampToValueAtTime(0, now + quarterDur + releaseTime);
    return now + quarterDur * 2;
  }

  bump() {
    // TODO: make it so it doesn't stutter
    this.bumpSound.start();
  }

  playDelete() {
    this.deleteSound.start();
  }

  generateWave(id) {
    let songLength = (60 * this.options.totalBeats) / this.options.tempo;
    const tempo = this.options.tempo;
    this.emit("export-start");

    Tone.Offline(async ({ transport }) => {
      // Set Transport BPM
      transport.bpm.value = tempo;
      //play one of the samples when they all load
      let instrumentTrack = new SoundTrack(
        this.options,
        this.midiData.instrument,
        false,
        () => {},
        true,
        true
      );
      let percussionTrack = new SoundTrack(
        this.options,
        this.midiData.percussion,
        true,
        () => {},
        true,
        true
      );
      syncAndPlay();
      function syncAndPlay() {
        instrumentTrack.syncWithMidiTrack();
        percussionTrack.syncWithMidiTrack();
        // Start Transport
        transport.start();
      }
    }, songLength).then((buffer) => {
      makeWavFromBuffer(buffer, id);
      this.emit("export-complete");
      this.percussionTrack.instrument.reset();
      this.instrumentTrack.instrument.reset();
    });
  }
}
