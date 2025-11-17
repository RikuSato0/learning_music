import "../../../css/composite/chrome/canvas.scss";
import { Ease } from "../data/Ease.js";
import { Instrument } from "./Instrument.js";
import { Percussion } from "./Percussion.js";
import { HORIZONTAL, Scrollbar } from "./Scrollbar.js";
import { EventEmitter } from "https://esm.sh/events";
import { rAF } from "./AnimationFrame.js";
import { SongOptions } from "../data/SongOptions.js";

const MIN_TILE_HEIGHT = 25;
const MIN_TILE_WIDTH = 25;
const MIN_TILE_WIDTH_EMBED = 18;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/*
 * Sets up Instrument and Percussion grids and manages scroll position for both
 */

export class Grid extends EventEmitter {
  constructor(
    container = document.body,
    songOptions,
    midiData,
    sound,
    isEmbed
  ) {
    super();

    // Save passed in references
    this.container = container;
    this.songOptions = songOptions;
    this.sound = sound;
    this.isEmbed = isEmbed;

    // Setup DOM
    this.el = this.createMainElement(container);

    // Setup instruments
    this.defaultBars = songOptions.defaultBars;
    this.instrument = new Instrument(this.el, midiData.instrument, isEmbed);
    this.percussion = new Percussion(this.el, midiData.percussion, isEmbed);

    // Setup Scrollbars
    this.scrollbars = {
      h: new Scrollbar(this.el, {
        direction: HORIZONTAL,
        onDrag: this.onScrollbarHDrag.bind(this),
      }),
      v: new Scrollbar(this.el, {
        onDrag: this.onScrollbarVDrag.bind(this),
      }),
    };

    // Scroll Data
    this.scroll = {
      x: new Ease(0, 0.03),
      y: new Ease(0, 0.03),
    };
    this.el.addEventListener("wheel", this.onWheel.bind(this), false);

    this.resetInstruments();
    this.resize();
    this.defaultScroll();

    // Handle Change Events
    window.addEventListener("resize", () => this.resize(), false);
    this.songOptions.on("change", () => {
      this.resetInstruments();
      this.resize();
      this.defaultScroll();
      this.emit("load-success", this.songOptions);
    });

    // Kick off drawing
    rAF(this.loop.bind(this));
  }

  createMainElement(container) {
    let el = document.createElement("div");
    el.id = "grid-container";
    el.setAttribute("role", "application");
    el.setAttribute(
      "aria-label",
      "Song Area: press the arrow keys to move, enter and backspace to add and remove notes, and spacebar to play."
    );
    el.setAttribute("tabindex", 3);
    container.appendChild(el);
    return el;
  }

  resetInstruments() {
    this.instrument.reset({
      cols: this.songOptions.totalSubBeats,
      rows: this.songOptions.totalNotes,
      groupCols: this.songOptions.bars,
      groupRows: this.songOptions.notesPerOctave,
      subdivision: this.songOptions.subdivision,
      rootNote: this.songOptions.rootNote,
      scale: this.songOptions.scale,
      tempo: this.songOptions.tempo,
    });
    this.percussion.reset({
      cols: this.songOptions.totalSubBeats,
      rows: this.songOptions.percussionNotes,
      groupCols: this.songOptions.bars,
      subdivision: this.songOptions.subdivision,
      rootNote: 0,
      scale: "drums",
      tempo: this.songOptions.tempo,
    });
  }

  updateTempo(tempo) {
    this.instrument.updateTempo(tempo);
    this.percussion.updateTempo(tempo);
  }

  select(selections) {
    // Do not affect scroll if the system is playing
    if (this.sound.position > -1) return;

    for (let i = 0; i < selections.length; i++) {
      // We only care about the position of instrument, as precussion does not have vertical scroll
      if (selections[i].instrument === this.instrument) {
        // Update scroll based on current keyboard selection
        const pos = selections[i].position;
        if (pos.x === -1) break; // Selection is hidden, do not update scroll
        const viewWidth = this.instrument.width;
        const viewHeight = this.instrument.height;
        const y = this.instrument.notes.flipY(pos.y);
        this.updateScroll(
          pos.x * this.instrument.tileWidth - viewWidth / 2,
          y * this.instrument.tileHeight - viewHeight / 2,
          true
        );
        break;
      }
    }
  }

  getTileSize(
    viewportWidth,
    viewportHeight,
    totalNotes,
    bars,
    beats,
    subdivision
  ) {
    let height = this.getTileHeight(viewportHeight, totalNotes);
    let width = this.getTileWidth(
      height,
      viewportWidth,
      bars,
      beats,
      subdivision
    );
    return {
      width,
      height,
    };
  }

  getTileHeight(viewportHeight, totalNotes) {
    let min = this.isEmbed ? 1 : MIN_TILE_HEIGHT;
    return Math.max(viewportHeight / totalNotes, min);
  }

  getTileWidth(height, viewportWidth, bars, beats, subdivision) {
    if (this.isEmbed) {
      return Math.max(
        MIN_TILE_WIDTH_EMBED,
        viewportWidth / (bars * beats * subdivision)
      );
    }

    let defaultTotalBeats = this.defaultBars * beats;
    let totalBeats = bars * beats;
    // Do not try to fit more than the default in a single screen (more columns should scroll)
    if (defaultTotalBeats < totalBeats) totalBeats = defaultTotalBeats;
    let width = Math.max(
      (height * 2) / Math.log2(beats),
      viewportWidth / totalBeats
    );
    width = width / subdivision;
    return Math.max(
      width,
      this.isEmbed ? MIN_TILE_WIDTH_EMBED : MIN_TILE_WIDTH
    );
  }

  getPercussionHeight(height) {
    if (this.isEmbed)
      return MIN_TILE_WIDTH_EMBED * Math.min(4, Math.max(2, height / 150));
    return Math.round(clamp(height * 0.17, 60, 120));
  }

  getViewDimensions() {
    const rect = this.el.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }

  fitBars() {
    let opts = new SongOptions();
    // Measure this.el
    let view = this.getViewDimensions();
    // Compute percussion height
    let percussionHeight = this.getPercussionHeight(view.height);
    view.height -= percussionHeight;

    let canfit = true;
    while (canfit) {
      opts.bars += 1;
      let tile = this.getTileSize(
        view.width,
        view.height,
        opts.totalNotes,
        opts.bars,
        opts.beats,
        opts.subdivision
      );
      // Compute instrument dimensions
      let totalWidth = opts.totalSubBeats * tile.width;
      let totalHeight = opts.totalNotes * tile.height;
      if (totalWidth > view.width + 0.01 || totalHeight > view.height + 0.01) {
        canfit = false;
        opts.bars -= 1;
      }
    }
    if (opts.bars > this.songOptions.bars) {
      this.songOptions.fromJSON(opts.toJSON());
    }
  }

  resize() {
    // Assume scrollbars are not necessary
    this.scrollbars.h.hide();
    this.scrollbars.v.hide();

    // Measure this.el
    let view = this.getViewDimensions();

    // Compute percussion height
    let percussionHeight = this.getPercussionHeight(view.height);
    view.height -= percussionHeight;

    // Compute tile size
    let tile = this.getTileSize(
      view.width,
      view.height,
      this.songOptions.totalNotes,
      this.songOptions.bars,
      this.songOptions.beats,
      this.songOptions.subdivision
    );

    // Compute instrument dimensions
    let totalWidth = this.songOptions.totalSubBeats * tile.width;
    let totalHeight = this.songOptions.totalNotes * tile.height;

    // Do we need scrollbars?
    let scroll = { h: 0, v: 0 };
    let scrollSize = this.scrollbars.h.getSize();

    // Adding 0.01 to work with floating point arithmetic imprecision
    if (!this.isEmbed && totalWidth > view.width + 0.01) {
      // Add horizontal bar
      scroll.h = scrollSize;
      // Try to fit tiles in vertically
      let tileH = this.getTileHeight(
        view.height - scroll.h,
        this.songOptions.totalNotes
      );
      totalHeight = this.songOptions.totalNotes * tileH;
      // Do we need to add vertical scrollbar?
      if (totalHeight > view.height - scroll.h + 0.01) {
        scroll.v = scrollSize;
      } else {
        tile.height = tileH;
      }
    } else if (!this.isEmbed && totalHeight > view.height + 0.01) {
      // Add vertical bar
      scroll.v = scrollSize;
      // Try to fit in the tiles horizontally
      let tileW = this.getTileWidth(
        tile.height,
        view.width - scroll.v,
        this.songOptions.bars,
        this.songOptions.beats,
        this.songOptions.subdivision
      );
      totalWidth = this.songOptions.totalSubBeats * tileW;
      // Do we need to add horizontal scrollbar?
      if (totalWidth > view.width - scroll.v + 0.01) {
        scroll.h = scrollSize;
      } else {
        tile.width = tileW;
      }
    }

    // Show necessary scrollbars
    if (!this.isEmbed && scroll.h) this.scrollbars.h.show();
    if (!this.isEmbed && scroll.v) this.scrollbars.v.show();

    if (scroll.v === 0 && scroll.h > 0) {
      // When only horizontal scroll bar is present, make it stretch full width
      this.scrollbars.h.full();
    } else {
      this.scrollbars.h.full(false);
    }

    this.instrument.resize({
      tileWidth: tile.width,
      tileHeight: tile.height,
      canvasWidth: view.width - scroll.v, // this.el - vertical scrollbar
      canvasHeight: view.height - scroll.h, // this.el - horizontal scrollbar - percussion
    });

    this.percussion.resize({
      tileWidth: tile.width,
      tileHeight: percussionHeight / this.songOptions.percussionNotes,
      canvasWidth: view.width - scroll.v, // this.el - vertical scrollbar
      canvasHeight: percussionHeight, // this.el - horizontal scrollbar - percussion
    });

    this.percussion.renderer.canvas.style.bottom = scroll.h + "px";

    // Update scrollbars
    this.scrollbars.h.resizeThumb(
      (view.width - scroll.v) / (this.songOptions.totalSubBeats * tile.width)
    );
    this.scrollbars.v.resizeThumb(
      (view.height - scroll.h) / (this.songOptions.totalNotes * tile.height)
    );
    // Clamp Scroll to the new dimensions
    let scrollLength = this.instrument.getScrollLength();
    this.updateScroll(
      clamp(this.scroll.x.value, 0, scrollLength.x),
      clamp(this.scroll.y.value, 0, scrollLength.y)
    );
  }

  loop(t) {
    let position = this.sound.position;
    this.instrument.draw(position, t);
    this.percussion.draw(position, t);

    // Ease scroll if necessary
    if (
      Math.abs(this.scroll.x.diff) > 0.05 ||
      Math.abs(this.scroll.y.diff) > 0.05
    ) {
      this.scroll.x.step();
      this.scroll.y.step();
      this.onScroll();
    }

    if (position > -1) {
      const viewWidth = this.instrument.width;
      let scrollWidth = this.instrument.tileWidth * this.instrument.cols;
      this.updateScroll(
        scrollWidth * position - viewWidth / 2,
        this.scroll.y.value
      );
    }
  }

  defaultScroll() {
    let scrollLength = this.instrument.getScrollLength();
    this.updateScroll(0, 0.5 * scrollLength.y);
  }

  onScroll() {
    let x = this.scroll.x.value;
    let y = this.scroll.y.value;
    let scrollLength = this.instrument.getScrollLength();
    // Update Instruments
    this.instrument.updateScroll({ x, y });
    this.percussion.updateScroll({ x: x, y: 0 });
    // Update Scrollbars
    this.scrollbars.h.update(x / scrollLength.x);
    this.scrollbars.v.update(y / scrollLength.y);
  }

  updateScroll(x, y, ease = false) {
    let scrollLength = this.instrument.getScrollLength();
    this.scroll.x.goal = clamp(x, 0, scrollLength.x);
    this.scroll.y.goal = clamp(y, 0, scrollLength.y);
    if (ease === false) {
      this.scroll.x.skip();
      this.scroll.y.skip();
      this.onScroll();
    }
  }

  onScrollbarHDrag(progress) {
    let scrollLength = this.instrument.getScrollLength();
    this.updateScroll(progress * scrollLength.x, this.scroll.y.value);
  }

  onScrollbarVDrag(progress) {
    let scrollLength = this.instrument.getScrollLength();
    this.updateScroll(this.scroll.x.value, progress * scrollLength.y);
  }

  onWheel(e) {
    e.preventDefault();
    let dX = e.deltaX || 0;
    let dY = e.deltaY || 0;
    this.updateScroll(this.scroll.x.value + dX, this.scroll.y.value + dY);
  }

  flashSelector() {
    this.instrument.flashSelector();
    this.percussion.flashSelector();
  }
}
