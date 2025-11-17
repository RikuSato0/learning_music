const audioDir = "../assets/songmaker/audio";
import { ToneAudioBuffer } from "https://esm.sh/tone";

const notes = ["C", "Ds", "Fs", "A"];
const tonalInstrumentNames = [
  "piano",
  "marimba",
  "woodwind",
  "strings",
  "synth",
];
const percussionInstrumentNames = ["woodblock", "kit", "bongo", "electronic"];

function makeInstrumentPalette(instFolder) {
  const ret = {};
  const dir = `${audioDir}/${instFolder}`;
  for (let octave = 2; octave < 7; octave++) {
    notes.forEach((note) => {
      const pitch = `${note}${octave}`;
      ret[pitch.replace("s", "#")] = `${dir}/${pitch}.mp3`;
    });
  }
  return ret;
}

function makeInstrumentPaletteArray(arr) {
  var obj = {};
  arr.forEach((name) => {
    obj[name] = makeInstrumentPalette(name);
  });
  return obj;
}

function makeDrumPaletteArray(arr) {
  var obj = {};
  arr.forEach((name) => {
    obj[name] = [`${audioDir}/${name}/low.mp3`, `${audioDir}/${name}/high.mp3`];
  });
  return obj;
}

export const TONAL_URLS = makeInstrumentPaletteArray(tonalInstrumentNames);
export const PERCUSSION_URLS = makeDrumPaletteArray(percussionInstrumentNames);

export const cachedBuffers = {};
function loadBuffers() {
  for (let [instrument, urls] of Object.entries(TONAL_URLS)) {
    cachedBuffers[instrument] = {};
    for (let [note, path] of Object.entries(urls)) {
      cachedBuffers[instrument][note] = new ToneAudioBuffer(path);
    }
  }
  for (let [instrument, urls] of Object.entries(PERCUSSION_URLS)) {
    cachedBuffers[instrument] = {};
    for (let [note, path] of Object.entries(urls)) {
      cachedBuffers[instrument][note] = new ToneAudioBuffer(path);
    }
  }
}
loadBuffers();

//https://en.wikipedia.org/wiki/General_MIDI#Parameter_interpretations
const INSTRUMENT_PROGRAM_NUMBERS = {
  piano: 1,
  marimba: 13,
  synth: 82,
};

export function getPatchNumber(instrument) {
  return (
    INSTRUMENT_PROGRAM_NUMBERS[instrument] || INSTRUMENT_PROGRAM_NUMBERS.piano
  );
}
