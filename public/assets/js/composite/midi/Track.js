import { IntervalTimeline } from "https://esm.sh/tone";
import { EventEmitter } from "https://esm.sh/events";
import { bus } from "../data/EventBus.js";
import { closestPitch } from "../data/ScaleMap.js";

function getEvent(timeline, time, note) {
  let event = null;
  timeline.forEachAtTime(time, (e) => {
    if (note === e.note) event = e;
  });
  return event;
}

//represents a midi track
export class MidiTrack extends EventEmitter {
  constructor(fixedPitch = false) {
    super();
    this.timeline = new IntervalTimeline();
    this.fixedPitch = fixedPitch;

    bus.on("history:pop:add", (event) => {
      if (event.track === this) this.remove(event.time, event.note, false);
    });
    bus.on("history:pop:remove", (event) => {
      if (event.track === this)
        this.add(event.time, event.note, event.duration, false);
    });
  }

  //test if there is the given note at the time
  has(time, note) {
    return this.getEvent(time, note) !== null;
  }

  getEvent(time, note) {
    return getEvent(this.timeline, time, note);
  }

  getEventsAtTime(time) {
    let events = [];
    this.timeline.forEachAtTime(time, (e) => events.push(e));
    return events;
  }

  xToBarCoords(x, opts) {
    let bar = Math.floor(x / (opts.beats * opts.subdivision));
    let beat = Math.floor(
      (x % (opts.beats * opts.subdivision)) / opts.subdivision
    );
    let sub = x % opts.subdivision;
    return [bar, beat, sub];
  }

  barToXCoords(coords, opts) {
    return (
      coords[0] * opts.beats * opts.subdivision +
      coords[1] * opts.subdivision +
      coords[2]
    );
  }

  morphSubdivisions(index, cur, prev) {
    // false in the mapping deletes the note
    const MAP = {
      _2_4: [0, 2], // 0->0, 1->2
      _4_2: [0, false, 1, false], // 0->0, 2->1, rest remove
      _2_3: [0, 2], // 0->0, 1->2
      _3_2: [0, false, 1], // 0->0, 2->1, rest remove
    };

    let key = "_" + prev + "_" + cur;
    if (MAP[key] !== undefined) {
      if (MAP[key][index] === false) throw new Error("outofbounds");
      else return MAP[key][index];
    } else {
      if (index >= cur) throw new Error("outofbounds");
      else return index;
    }
  }

  morphTiming(c, cur, prev) {
    /*
     * c, nc are coordinates of the notes in the form of [bar, beta, subdivision]
     **/
    let nc = [...c];
    // Bar out of bounds (cut out)
    if (nc[0] >= cur.bars) throw new Error("outofbounds");
    // Beats out of bounds (cut out)
    if (nc[1] >= cur.beats) throw new Error("outofbounds");
    // Map Subdivisions
    nc[2] = this.morphSubdivisions(nc[2], cur.subdivision, prev.subdivision);
    // Return new coordinates
    return this.barToXCoords(nc, cur);
  }

  morphPitch(pitch, cur, prev) {
    if (this.fixedPitch) return pitch;
    // Transpose based on the roote note
    pitch += cur.rootNote - prev.rootNote;
    // Scale Shift
    if (cur.scale !== prev.scale) {
      pitch = closestPitch(pitch, cur.rootNote, cur.scale);
    }
    let maxPitch = cur.rootNote + cur.octaves * 12;
    if (cur.octaves === 1) maxPitch += 1;
    // Make sure the note is in the visible range
    if (pitch < cur.rootNote) throw new Error("outofbounds");
    if (pitch >= maxPitch) throw new Error("outofbounds");
    return pitch;
  }

  morph(newOptions, prevOptions) {
    // console.log('morph', prevOptions, newOptions)
    let newTimeline = new IntervalTimeline();
    this.timeline.forEach((event) => {
      // Figure out old coordinates
      let time = event.time;
      let note = event.note;
      let duration = event.duration;
      let xCoords = this.xToBarCoords(time, prevOptions);
      try {
        // Figure out new coordinates
        time = this.morphTiming(xCoords, newOptions, prevOptions);
        note = this.morphPitch(note, newOptions, prevOptions);
        if (getEvent(newTimeline, time, note) === null) {
          newTimeline.add({ time, note, duration });
        }
      } catch (e) {
        // console.log('removed note:', xCoords)
      }
    });
    this.timeline = newTimeline;
  }

  replace(timeline) {
    this.timeline = timeline;
  }

  add(time, note, duration = 1, history = true) {
    if (isNaN(note) || note === undefined)
      throw new Error("note is note defined");
    //make sure there isn't already a note there
    if (!this.has(time, note)) {
      const event = { time, note, duration };
      this.timeline.add(event);
      if (history)
        bus.emit("history:push", {
          type: "add",
          time,
          note,
          duration,
          track: this,
        });
      this.emit("add", event);
      return event;
    }
    return false;
  }

  remove(time, note, history = true) {
    //get the key
    const event = this.getEvent(time, note);
    if (event) {
      this.timeline.remove(event);
      if (history)
        bus.emit("history:push", {
          type: "remove",
          time,
          note,
          track: this,
        });
      this.emit("remove", event);
      return event;
    }
    return false;
  }

  forEach(cb) {
    this.timeline.forEach(cb);
  }

  forEachAtTime(time, cb) {
    this.timeline.forEachAtTime(time, cb);
  }

  clear() {
    this.timeline = new IntervalTimeline();
  }

  get highestNote() {
    if (this.timeline.length) {
      let highest = 0;
      this.forEach((event) => {
        highest = Math.max(event.note, highest);
      });
      return highest;
    } else {
      return -1;
    }
  }

  get lowestNote() {
    if (this.timeline.length) {
      let lowest = 100;
      this.forEach((event) => {
        lowest = Math.min(event.note, lowest);
      });
      return lowest;
    } else {
      return -1;
    }
  }
}
