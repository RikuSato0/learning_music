import SimplexNoise from "https://esm.sh/simplex-noise";
import tinycolor from "https://esm.sh/tinycolor2";
import { midiToColor, red } from "../data/Colors.js";
import { Ease } from "../data/Ease.js";

const LEVEL_THRESHOLD = 0.2;
const ARROW_HIDE_TIMEOUT = 400;
const TWO_PI = 2 * Math.PI;
const lightRed = tinycolor(red).setAlpha(0.1).toRgbString();
const redC = tinycolor(red);

export class MicrophoneRenderer {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.isFlipped = false;
    this._yOffset = new Ease(0, 0.03);
    this._angle = new Ease(0, 0.08);
    this.amp = 0; // Noise amplited, controlled by mic level
    this.width = 140;
    this.height = 140;
    this.cx = this.width * 0.5;
    this.cy = this.height * 0.5;
    this.innerR = 25;
    this.outerR = 35;
    this.arrowR = 60;
    this.arrowL = 10;
    this.arrowO = new Ease(0, 0.05);
    this.arrowVisible = false;
    this.arrowTimeout = false;
    this.arrowH = 7;
    this.step = TWO_PI / 40;
    this.simplex = new SimplexNoise();
    this.probability = 0;
    this.pitch = 48;
    this.pitchIndex = false;
    this.loadMicrophoneImage();
  }

  updateLevel(level) {
    // Do we need to update anything?
    if (level >= LEVEL_THRESHOLD && !this.arrowVisible) {
      if (this.arrowTimeout) clearTimeout(this.arrowTimeout);
      this.arrowO.goal = 1;
      this.arrowVisible = true;
    } else if (this.arrowO.goal !== 0 && this.arrowVisible) {
      if (this.arrowTimeout) clearTimeout(this.arrowTimeout);
      this.arrowVisible = false;
      this.arrowTimeout = setTimeout(() => {
        this.arrowO.goal = 0;
      }, ARROW_HIDE_TIMEOUT);
    }
    this.amp = level;
  }

  loadMicrophoneImage() {
    let img = new Image();
    img.onload = () => {
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");
      let dpi = window.devicePixelRatio || 1;
      canvas.width = img.width * dpi;
      canvas.height = img.height * dpi;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      this.image = canvas;
      this.imageW = img.width;
      this.imageH = img.height;
    };
    img.src = "images/icon-mic-red.svg";
  }

  drawCircle(context, xOffset, yOffset, radius, style, time, dpi) {
    context.strokeStyle = style;
    context.lineWidth = dpi;
    context.beginPath();
    for (let angle = 0; angle < TWO_PI; angle += this.step) {
      // let noise = this.simplex.noise2D(time / 750, angle * time / 2000)
      let r = radius + 12 * this.amp; /* + noise * 3 * this.amp */
      let x = xOffset + this.cx + r * Math.cos(angle);
      let y = yOffset + this.cy + r * Math.sin(angle);
      context.lineTo(x * dpi, y * dpi);
    }
    context.closePath();
    context.stroke();
  }

  drawArrow(context, xOffset, yOffset, angle, alpha = 1.0, dpi) {
    let x = this.cx - this.arrowR;
    let y = this.cy;
    let p1 = this.rotatePoint(x, y, angle);
    let p2 = this.rotatePoint(x + this.arrowL, y - this.arrowH, angle);
    let p3 = this.rotatePoint(x + this.arrowL, y + this.arrowH, angle);
    context.fillStyle = redC.setAlpha(alpha).toRgbString();
    context.beginPath();
    context.moveTo((xOffset + p1.x) * dpi, (yOffset + p1.y) * dpi);
    context.lineTo((xOffset + p2.x) * dpi, (yOffset + p2.y) * dpi);
    context.lineTo((xOffset + p3.x) * dpi, (yOffset + p3.y) * dpi);
    context.closePath();
    context.fill();
  }

  rotatePoint(x, y, angle) {
    let ox = this.cx;
    let oy = this.cy;
    return {
      x: Math.cos(angle) * (x - ox) - Math.sin(angle) * (y - oy) + ox,
      y: Math.sin(angle) * (x - ox) + Math.cos(angle) * (y - oy) + oy,
    };
  }

  render(renderer, notesArray, time, scroll, selection) {
    let context = renderer.context;
    let dpi = renderer.dpi;
    // X Position
    let xOffset = (selection.x + 1) * renderer.tileWidth - scroll.x;
    if (xOffset + this.width > renderer.width) {
      if (!this.isFlipped) {
        this.isFlipped = true;
        this._angle.value = Math.PI - this._angle.value;
      }
      xOffset = selection.x * renderer.tileWidth - this.width - scroll.x;
    } else if (this.isFlipped) {
      this.isFlipped = false;
      this._angle.value = this._angle.value - Math.PI;
    }

    // Y Position
    let goalY = notesArray.flipY(selection.y); // GoalY is always limited by selection which
    let goalYOffset = (goalY + 0.5) * renderer.tileHeight - this.cy - scroll.y;
    goalYOffset = Math.min(
      renderer.height - this.height,
      Math.max(0, goalYOffset)
    );
    this._yOffset.goal = goalYOffset;
    this._yOffset.step();
    let yOffset = this._yOffset.value;

    // Draw microphone
    if (this.image) {
      context.drawImage(
        this.image,
        (xOffset + this.cx - this.imageW * 0.5) * dpi,
        (yOffset + this.cy - this.imageH * 0.5) * dpi,
        this.imageW * dpi,
        this.imageH * dpi
      );
    }
    // Inner Circle
    this.drawCircle(context, xOffset, yOffset, this.innerR, red, time, dpi);
    // Outer Circle
    this.drawCircle(
      context,
      xOffset,
      yOffset,
      this.outerR,
      lightRed,
      time,
      dpi
    );

    // Draw arrow pointer
    let goalPitch = this.pitchIndex ? this.pitchIndex : selection.y;
    let detectedYOffset =
      (notesArray.flipY(goalPitch) + 0.5) * renderer.tileHeight - scroll.y;
    let angle = Math.atan2(yOffset + this.cy - detectedYOffset, this.cx);
    if (this.isFlipped) angle = Math.PI - angle;
    this._angle.goal = angle;
    this._angle.step();
    this.arrowO.step();
    this.drawArrow(
      context,
      xOffset,
      yOffset,
      this._angle.value,
      this.arrowO.value,
      dpi
    );

    // Draw the note
    context.fillStyle = tinycolor(midiToColor(this.pitch))
      .setAlpha(this.probability)
      .toRgbString();
    context.fillRect(
      (selection.x * renderer.tileWidth - scroll.x) * dpi,
      (goalY * renderer.tileHeight - scroll.y) * dpi,
      renderer.tileWidth * dpi,
      renderer.tileHeight * dpi
    );

    // Draw selection box
    renderer.drawSelectionBox(notesArray, selection, scroll, this.probability);
  }
}
