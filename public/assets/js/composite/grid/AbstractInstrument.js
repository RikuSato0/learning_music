import "../../../css/composite/chrome/canvas.scss";
import { NotesArray } from "./NotesArray.js";
import { EventEmitter } from "https://esm.sh/events";
import { indexToPitch, pitchToIndex } from "../data/ScaleMap.js";
import TWEEN from "https://esm.sh/@tweenjs/tween.js";

/*
 * Keeps:
 *   - Internal array representation in sync with midi track data
 *   - Exposes methods that add / remove midi track notes based on grid coordinates
 *   - Renderer's scroll position
 *   - Passes notes state to the renderer (this can be swapped out for a different renderer)
 */

const MIN_PLAYHEAD_DURATION = 100;

export class AbstractInstrument extends EventEmitter {
  constructor(container = document.body, midiTrack, isEmbed, domId) {
    super();

    this.container = container;
    this.midiTrack = midiTrack;
    this.notes = new NotesArray();
    this.beatsState = this.setupBeatsState(this.notes);
    this.renderer = new (this.rendererClass())(this.container, domId, isEmbed);
    this.selection = { x: -1, y: -1 };
    this.prevPosition = -1;
    this.playHeadDuration = MIN_PLAYHEAD_DURATION;

    // Scroll
    this.scroll = { x: 0, y: 0 };
    this.scrollLength = { x: 0, y: 0 };

    // Midi Track Events
    this.midiTrack.on("add", (...args) => this.onMidiTrackAdd(...args));
    this.midiTrack.on("remove", (...args) => this.onMidiTrackRemove(...args));
  }

  get cols() {
    return this.notes.cols;
  }

  get rows() {
    return this.notes.rows;
  }

  get canvas() {
    return this.renderer.canvas;
  }

  get tileHeight() {
    return this.renderer.tileHeight;
  }

  get tileWidth() {
    return this.renderer.tileWidth;
  }

  get width() {
    return this.renderer.width;
  }

  get height() {
    return this.renderer.height;
  }

  setupBeatsState(notes) {
    let beatsState = [];
    for (let i = 0; i < notes.cols; i++) {
      beatsState[i] = { on: 0 };
    }
    return beatsState;
  }

  indexToPitch(index) {
    return indexToPitch(index, this.rootNote, this.scale);
  }

  pitchToIndex(pitch) {
    return pitchToIndex(pitch, this.rootNote, this.scale);
  }

  has(pos) {
    const pitch = this.indexToPitch(pos.y);
    return this.midiTrack.has(pos.x, pitch);
  }

  addNote(pos) {
    try {
      const pitch = this.indexToPitch(pos.y);
      let success = this.midiTrack.add(pos.x, pitch);
      this.emit("add", pitch);
      return !!success;
    } catch (err) {
      console.log("Cannot add note", pos);
      return false;
    }
  }

  removeNote(pos) {
    const pitch = this.indexToPitch(pos.y);
    let success = this.midiTrack.remove(pos.x, pitch);
    this.emit("remove", pitch);
    return !!success;
  }

  getPlayHeadDuration(tempo) {
    return Math.max(MIN_PLAYHEAD_DURATION, 60000 / (this.subdivision * tempo));
  }

  updateTempo(tempo) {
    this.playHeadDuration = this.getPlayHeadDuration(tempo);
  }

  reset(opts) {
    // console.log('AbstractInstrument.reset', opts)
    // Update local settings
    this.rootNote = opts.rootNote;
    this.scale = opts.scale;

    // Clear notes array
    this.notes.reset(opts.cols, opts.rows);
    this.syncWithMidiTrack();

    this.beatsState = this.setupBeatsState(this.notes);
    this.subdivision = opts.subdivision;
    this.playHeadDuration = this.getPlayHeadDuration(opts.tempo);
    // Update renderer
    this.renderer.updateSettings({
      groupCols: opts.groupCols,
      groupRows: opts.groupRows,
      cOffset: opts.rootNote % 12,
      subdivision: opts.subdivision,
    });
    this.updateScrollLength();
    this.emit("reset");
  }

  resize(opts) {
    // console.log('AbstractInstrument.resize', opts)
    // Resizes canvas
    this.renderer.updateSettings({
      tileWidth: opts.tileWidth,
      tileHeight: opts.tileHeight,
    });
    this.renderer.resize(opts.canvasWidth, opts.canvasHeight);
    this.updateScrollLength();
    this.emit("resize");
  }

  syncWithMidiTrack() {
    this.midiTrack.forEach((event) => {
      try {
        let y = pitchToIndex(event.note, this.rootNote, this.scale);
        this.notes.set(event.time, y, event.note);
      } catch (e) {
        console.log("Warning: Pitch out of scale", event);
      }
    });
  }

  select(pos) {
    this.midiTrack.emit("touch", {
      time: pos.x,
      pitch: this.indexToPitch(pos.y),
    });
    this.selection = pos;
  }

  animateNotes(index) {
    if (index < 0) return;
    if (this.beatsState[index] === undefined) return;
    this.beatsState[index].on = 1;
    new TWEEN.Tween(this.beatsState[index])
      .to({ on: 0 }, this.playHeadDuration)
      .start()
      .onComplete((o) => {
        o.on = 0;
      })
      .onStop((o) => {
        o.on = 0;
      });
  }

  draw(position, time) {
    let colPosition =
      position >= 0 ? Math.floor(position * this.notes.cols) : -1;
    if (this.prevPosition !== colPosition) {
      this.animateNotes(colPosition);
      this.prevPosition = colPosition;
    }
    // let envelopes = []
    // this.midiTrack.forEachAtTime(position * this.notes.cols, (ev) => {
    // 	envelopes[ev.note] = ev.envelope
    // })
    this.renderer.draw(
      time,
      this.notes,
      this.scroll,
      position,
      this.selection,
      this.beatsState
    );
  }

  updateScroll(scroll) {
    this.scroll.x = scroll.x;
    this.scroll.y = scroll.y;
    this.emit("scroll", this.scroll);
  }

  updateScrollLength() {
    this.scrollLength.x =
      this.renderer.tileWidth * this.notes.cols - this.renderer.width;
    this.scrollLength.y =
      this.renderer.tileHeight * this.notes.rows - this.renderer.height;
  }

  getScrollLength() {
    return this.scrollLength;
  }

  flashSelector() {
    this.renderer.flashSelector();
  }

  // Subclass methods
  rendererClass() {
    // Return renderer class, i.e. return InstrumentCanvasRenderer
  }

  onMidiTrackAdd(event) {
    // Update notes array
    let y = pitchToIndex(event.note, this.rootNote, this.scale);
    this.notes.set(event.time, y, event.note);
  }

  onMidiTrackRemove(event) {
    // Update notes array
    let y = pitchToIndex(event.note, this.rootNote, this.scale);
    this.notes.set(event.time, y, undefined);
  }
}
