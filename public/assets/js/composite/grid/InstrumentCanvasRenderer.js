import tinycolor from "https://esm.sh/tinycolor2";
import { CanvasRenderer } from "./CanvasRenderer.js";
import { midiToColor, blue20, blue25, blue40, blue70 } from "../data/Colors.js";

export class InstrumentCanvasRenderer extends CanvasRenderer {
  drawNotes(notesArray, scroll, position, beatsState) {
    // Draw some notes
    for (let j = this.bounds.yMin; j < this.bounds.yMax; j++) {
      for (let i = this.bounds.xMin; i < this.bounds.xMax; i++) {
        let note = notesArray.get(i, notesArray.flipY(j)); // flipY because (0,0) is notes array is bottom left, not top left
        if (note) {
          let noteColor = midiToColor(note);
          this.context.fillStyle = tinycolor
            .mix(noteColor, "white", beatsState[i].on * 100)
            .toRgbString();
          this.context.fillRect(
            i * this.tileWidth * this.dpi - scroll.x * this.dpi,
            j * this.tileHeight * this.dpi - scroll.y * this.dpi,
            this.tileWidth * this.dpi,
            this.tileHeight * this.dpi
          );
        }
      }
    }
  }

  drawGrid(notesArray, scroll) {
    // Draw Horizontal Grid
    if (this.tileHeight > 5) {
      this.context.fillStyle = blue25;
      for (let i = this.bounds.yMin + 1; i < this.bounds.yMax; i++) {
        let thickness = 1;
        let singleOctave = notesArray.rows - this.groupRows === 1;
        let inOctave = singleOctave ? i - 1 : i;
        if (
          inOctave % this.groupRows === 0 &&
          notesArray.rows > this.groupRows + 1
        )
          thickness = 3;
        if (this.isEmbed) thickness = 0.5;
        this.context.fillRect(
          0,
          i * this.tileHeight * this.dpi - scroll.y * this.dpi,
          this.width * this.dpi,
          thickness * this.dpi
        );
      }
    }

    // Draw Vertical Grid
    this.context.fillStyle = blue40;
    for (let i = this.bounds.xMin + 1; i < this.bounds.xMax; i++) {
      if (this.subdivision > 1 && i % this.subdivision === 0) {
        this.context.fillStyle = blue70;
      } else if (this.subdivision > 1) {
        this.context.fillStyle = blue20;
      }
      let thickness = 1;
      if (this.isEmbed) thickness = 0.5;
      this.context.fillRect(
        i * this.tileWidth * this.dpi - scroll.x * this.dpi,
        0,
        thickness * this.dpi,
        this.height * this.dpi
      );
    }
  }
}
