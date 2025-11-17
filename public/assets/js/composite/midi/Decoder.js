import { parseMidi } from "https://esm.sh/midi-file";
import { PulsesPerQuarter } from "../data/Config.js";

export function decodeMidi(data, options, percussion, instrument) {
  const midi = parseMidi(new Uint8Array(data));
  //track 1 is the instrument
  groupIntoNotes(midi.tracks[1]).forEach((event) => {
    const duration = fromTicks(event.duration, options);
    const time = fromTicks(event.time, options);
    instrument.add(time, event.note, duration);
  });
  //track 2 is the percussion
  groupIntoNotes(midi.tracks[2]).forEach((event) => {
    // check if it's a snare (see encoder.js)
    const note = [39, 76, 38, 60].includes(event.note) ? 1 : 0;
    const duration = fromTicks(event.duration, options);
    const time = fromTicks(event.time, options);
    percussion.add(time, note, duration);
  });
}

function groupIntoNotes(events) {
  computeAbsoluteTime(events);
  const notes = [];
  const noteOns = [];
  events.forEach((event) => {
    if (event.type === "noteOn") {
      noteOns.push(event);
    } else if (event.type === "noteOff") {
      //get the corresponding noteOn
      for (let i = 0; i < noteOns.length; i++) {
        const noteOn = noteOns[i];
        if (
          noteOn.noteNumber === event.noteNumber &&
          event.absoluteTime > noteOn.absoluteTime
        ) {
          notes.push({
            note: noteOn.noteNumber,
            duration: event.absoluteTime - noteOn.absoluteTime,
            time: noteOn.absoluteTime,
          });
          //remove the noteOn event
          noteOns.splice(i, 1);
          break;
        }
      }
    }
  });
  return notes;
}

function computeAbsoluteTime(events) {
  let currentTime = 0;
  events.forEach((event) => {
    currentTime += event.deltaTime;
    event.absoluteTime = currentTime;
  });
  return events;
}

function fromTicks(ticks, options) {
  return (ticks / PulsesPerQuarter) * options.subdivision;
}
