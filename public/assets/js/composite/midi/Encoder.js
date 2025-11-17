import { PulsesPerQuarter } from "../data/Config.js";
import MidiFile from "https://esm.sh/midi-file";
import { getPatchNumber } from "../data/SoundPalettes.js";

export function encodeMidi(options, percussion, instrument) {
  const percussionTracks = encodePercussionTrack(percussion, options);
  const midiObject = {
    header: encodeHeader(options),
    tracks: [
      encodeTempoTrack(options),
      encodeInstrumentTrack(instrument, options),
    ],
  };
  if (percussionTracks.length > 0) {
    midiObject.header.numTracks++;
    midiObject.tracks.push(percussionTracks);
  }
  const midiArray = MidiFile.writeMidi(midiObject);
  const blob = toBlob(midiArray);
  return blob;
}

function encodeHeader(options) {
  return {
    format: 1,
    numTracks: 3,
    ticksPerBeat: PulsesPerQuarter,
  };
}

function encodeTempoTrack(options) {
  const track = [];
  track.push(encodeTempo(options.tempo));
  track.push(endOfTrack());
  return computeDeltaTime(track, options);
}

function encodeTrack(notes, options, channel, patchNum) {
  const events = [];
  //for each of the notes, create a note on and off event
  notes.forEach((event) => {
    events.push(noteOn(event.note, event.time, channel));
    events.push(noteOff(event.note, event.time + event.duration, channel));
  });
  //the end of the track
  events.push(endOfTrack(options.totalSubBeats));

  return computeDeltaTime(events, options);
}

function computeDeltaTime(events, options) {
  //sort the events
  events.sort((a, b) => a.absoluteTime - b.absoluteTime);

  //compute the delta
  let lastEventTime = 0;
  events.forEach((event) => {
    const timeInTicks =
      event.absoluteTime * (PulsesPerQuarter / options.subdivision);
    event.deltaTime = Math.round(timeInTicks - lastEventTime);
    lastEventTime = timeInTicks;
  });
  return events;
}

function encodePercussionTrack(notes, options) {
  const channel = 9;
  const events = [];
  let snareNote = 38;
  let bassNote = 35;

  switch (options.percussion) {
    case "electronic":
      snareNote = 39;
      bassNote = 35;
      break;
    case "woodblock":
      snareNote = 76;
      bassNote = 77;
      break;
    case "kit":
      snareNote = 38;
      bassNote = 36;
      break;
    case "bongo":
      snareNote = 60;
      bassNote = 61;
      break;
  }
  //for each of the notes, create a note on and off event
  notes.forEach((event) => {
    // Drums come in as 0 = bass, 1 = snare, so we remap them
    let note = event.note === 1 ? snareNote : bassNote;
    events.push(noteOn(note, event.time, channel));
    events.push(noteOff(note, event.time + event.duration, channel));
  });

  //the end of the track
  if (events.length) {
    events.push(endOfTrack(options.totalSubBeats));
  }
  return computeDeltaTime(events, options);
}

function encodeInstrumentTrack(notes, options) {
  const channel = 1;
  const events = [];
  //add the instrument patch
  const patchNum = getPatchNumber(options.instrument);
  events.push(encodePatchNumber(patchNum));

  //for each of the notes, create a note on and off event
  notes.forEach((event) => {
    events.push(noteOn(event.note, event.time, channel));
    events.push(noteOff(event.note, event.time + event.duration, channel));
  });

  //the end of the track
  if (events.length) {
    events.push(endOfTrack(options.totalSubBeats));
  }
  return computeDeltaTime(events, options);
}

function endOfTrack(absoluteTime = 0) {
  return {
    absoluteTime: absoluteTime,
    meta: true,
    type: "endOfTrack",
  };
}

function noteOn(noteNumber, absoluteTime, channel) {
  return {
    absoluteTime,
    channel,
    noteNumber,
    velocity: 127,
    type: "noteOn",
  };
}

function noteOff(noteNumber, absoluteTime, channel) {
  return {
    absoluteTime,
    channel,
    noteNumber,
    velocity: 0,
    type: "noteOff",
  };
}

function encodeTempo(tempo) {
  return {
    absoluteTime: 0,
    meta: true,
    type: "setTempo",
    microsecondsPerBeat: (60 / tempo) * 1e6,
  };
}

function encodePatchNumber(programNumber) {
  return {
    absoluteTime: 0,
    channel: 1,
    type: "programChange",
    programNumber,
  };
}

//this doesn't work for some reason...
function encodeTimeSignature([numerator, denominator]) {
  return {
    absoluteTime: 0,
    meta: true,
    type: "timeSignature",
    numerator,
    denominator,
    metronome: PulsesPerQuarter * (4 / Math.pow(2, denominator)),
    thirtyseconds: 8,
  };
}

function toBlob(midiArray) {
  const midiData = new Uint8Array(midiArray);
  return new Blob([midiData], { type: "audio/midi" });
}

function SaveMidi(blob, filename = `${new Date().toISOString()}.mid`) {
  //force the download
  var a = document.createElement("a");
  document.body.appendChild(a);
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
