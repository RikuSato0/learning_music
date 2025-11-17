import tinycolor from "https://esm.sh/tinycolor2";
import { CanvasRenderer } from "./CanvasRenderer.js";
import {
  black15,
  blue,
  blue20,
  blue25,
  blue40,
  blue70,
  lightGrayFill,
} from "../data/Colors.js";

const TWO_PI = Math.PI * 2;

export class PercussionCanvasRenderer extends CanvasRenderer {
  drawNotes(notesArray, scroll, position, beatsState) {
    // Draw some notes
    for (let j = this.bounds.yMin; j < this.bounds.yMax; j++) {
      for (let i = this.bounds.xMin; i < this.bounds.xMax; i++) {
        let note = notesArray.get(i, notesArray.flipY(j)); // flipY because (0,0) is notes array is bottom left, not top left
        const centerX = (i + 0.5) * this.tileWidth - scroll.x;
        const centerY = (j + 0.5) * this.tileHeight - scroll.y;
        if (note !== undefined) {
          // Draw note
          let noteColor = blue;
          let size = 0;

          this.context.fillStyle = tinycolor
            .mix(noteColor, "white", beatsState[i].on * 100)
            .toRgbString();
          size =
            Math.min(this.tileWidth, this.tileHeight) *
            (0.23 + beatsState[i].on * 0.17);

          if (this.isEmbed) {
            size = size * 1.25;
          } else {
            // 135% of size, client request
            size = size * 1.35;
          }
          if (j === 1) {
            this.drawCircle(centerX, centerY, size * 0.9);
          } else {
            this.drawTriangle(centerX, centerY, size);
          }
        } else {
          // Draw empty circle
          this.context.fillStyle = black15;
          const circleScalar = i % this.subdivision === 0 ? 0.1 : 0.05;
          this.drawCircle(
            centerX,
            centerY,
            Math.max(
              Math.min(this.tileWidth, this.tileHeight) * circleScalar,
              2.5
            )
          );
        }
      }
    }
  }

  drawCircle(centerX, centerY, size) {
    centerX *= this.dpi;
    centerY *= this.dpi;
    size *= this.dpi;
    this.context.beginPath();
    this.context.arc(centerX, centerY, size, 0, TWO_PI);
    this.context.fill();
  }

  drawTriangle(centerX, centerY, size) {
    centerX *= this.dpi;
    centerY *= this.dpi;
    size *= this.dpi;
    this.context.beginPath();
    //top position
    this.context.moveTo(centerX, centerY - size);
    const bottomPos = 0.7551651238 * size; // Math.cos(0.5) * 2 - 1
    // context.lineTo(centerX)
    this.context.lineTo(centerX - size, centerY + bottomPos);
    this.context.lineTo(centerX + size, centerY + bottomPos);
    this.context.lineTo(centerX, centerY - size);
    this.context.fill();
  }

  drawGrid(notesArray, scroll) {
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

    // Draw Top Border
    let tbFill = this.isEmbed ? blue25 : lightGrayFill;
    let thickness = this.isEmbed ? 1 : 3;
    this.context.fillStyle = tbFill;
    this.context.fillRect(
      0,
      0,
      this.width * this.dpi,
      thickness * this.dpi // thickness
    );
  }
}
