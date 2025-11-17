import tinycolor from "https://esm.sh/tinycolor2";
import { Context2d } from "./Context2d.js";
import { blue, blue08, veryLightGrayFill } from "../data/Colors.js";
import TWEEN from "https://esm.sh/@tweenjs/tween.js";

export class CanvasRenderer extends Context2d {
  constructor(...args) {
    super(...args);
    this.groupCols = 1;
    this.groupRows = 7;
    this.cOffset = 4;
    this.tileWidth = 0;
    this.tileHeight = 0;
    this.drawMethods = [];
    this.isEmbed = args[args.length - 1];
    this.selector = {
      opacity: 1.0,
    };
    this.bounds = {
      xMin: 0,
      xMax: 0,
      yMin: 0,
      yMax: 0,
    };
    if (args[1] === "instrument-canvas" || args[1] === "percussion-canvas") {
      this.canvas.setAttribute("aria-hidden", "true");
    }
  }

  registerDrawMethod(cb) {
    this.drawMethods.push(cb);
  }

  updateSettings(opts) {
    if (opts.tileWidth !== undefined) this.tileWidth = opts.tileWidth;
    if (opts.tileHeight !== undefined) this.tileHeight = opts.tileHeight;
    if (opts.groupCols !== undefined) this.groupCols = opts.groupCols;
    if (opts.groupRows !== undefined) this.groupRows = opts.groupRows;
    if (opts.cOffset !== undefined) this.cOffset = opts.cOffset;
    if (opts.subdivision !== undefined) this.subdivision = opts.subdivision;
  }

  updateBounds(notesArray, scroll) {
    let cellsX = Math.ceil(1 + this.width / this.tileWidth);
    let cellsY = Math.ceil(1 + this.height / this.tileHeight);
    this.bounds.xMin = Math.floor(scroll.x / this.tileWidth);
    this.bounds.yMin = Math.floor(scroll.y / this.tileHeight);
    this.bounds.xMax = Math.min(this.bounds.xMin + cellsX, notesArray.cols);
    this.bounds.yMax = Math.min(this.bounds.yMin + cellsY, notesArray.rows);
  }

  flashSelector() {
    this.selector.opacity = 1;
    new TWEEN.Tween(this.selector)
      .to({ opacity: 0 }, 80)
      .repeat(1)
      .yoyo(true)
      .easing(TWEEN.Easing.Cubic.InOut)
      .start();
  }

  draw(time, notesArray, scroll, progress, selection, beatsState) {
    // Clear screen
    this.context.fillStyle = veryLightGrayFill;
    this.context.fillRect(0, 0, this.width * this.dpi, this.height * this.dpi);

    // Figure out which section we're drawing
    this.updateBounds(notesArray, scroll);
    let position = Math.floor(progress * notesArray.cols);

    // Draw elements
    this.drawBars(notesArray, scroll);
    this.drawPositionIndicator(notesArray, scroll, position);
    // Draw selected bar
    if (selection.x > -1 && selection.x !== position) {
      this.drawPositionIndicator(notesArray, scroll, selection.x);
    }
    this.drawNotes(notesArray, scroll, position, beatsState);
    this.drawGrid(notesArray, scroll);

    // Custom Methods
    let drawSelection = true;
    this.drawMethods.forEach((func) => {
      let r = func(this, notesArray, time, scroll, selection);
      if (r) drawSelection = false;
    });

    // Draw selection box
    if (selection.y > -1 && drawSelection) {
      this.drawSelectionBox(
        notesArray,
        selection,
        scroll,
        this.selector.opacity
      );
    }
  }

  drawBars(notesArray, scroll) {
    let barCells = notesArray.cols / this.groupCols;
    let start = Math.floor(this.bounds.xMin / barCells) * barCells;
    let barWidth = this.tileWidth * barCells * this.dpi;
    this.context.fillStyle = "white";
    for (let i = start; i < this.bounds.xMax; i += barCells) {
      if ((i / barCells) % 2 < 1) {
        this.context.fillRect(
          i * this.tileWidth * this.dpi - scroll.x * this.dpi,
          0,
          barWidth,
          this.height * this.dpi
        );
      }
    }
  }

  drawPositionIndicator(notesArray, scroll, position) {
    if (
      position > -1 &&
      this.bounds.xMin <= position &&
      position <= this.bounds.xMax
    ) {
      this.context.fillStyle = blue08;
      this.context.fillRect(
        position * this.tileWidth * this.dpi - scroll.x * this.dpi,
        0,
        this.tileWidth * this.dpi,
        this.height * this.dpi
      );
    }
  }

  drawSelectionBox(notesArray, selection, scroll, opacity = 1.0) {
    this.context.strokeStyle = tinycolor(blue).setAlpha(opacity).toRgbString();
    let sw = 3 * this.dpi;
    this.context.lineWidth = sw;
    this.context.strokeRect(
      selection.x * this.tileWidth * this.dpi - scroll.x * this.dpi + sw * 0.5,
      notesArray.flipY(selection.y) * this.tileHeight * this.dpi -
        scroll.y * this.dpi +
        sw * 0.5,
      this.tileWidth * this.dpi - sw,
      this.tileHeight * this.dpi - sw
    );
  }

  // To be overwritten by subclass
  drawNotes() {}

  // To be overwritten by subclass
  drawGrid() {}
}
