import "../../../css/composite/chrome/scrollbar.scss";
import { EventEmitter } from "https://esm.sh/events";

export const VERTICAL = "vertical";
export const HORIZONTAL = "horizontal";

export class Scrollbar extends EventEmitter {
  constructor(container = document.body, opts = {}) {
    super();
    this.direction = opts.direction || VERTICAL;
    this.container = container;
    this.isVisible = true;
    this.progress = 0;
    this.length = 0;
    this.moving = false;
    this.dragPos = 0;
    this.dragProgress = 0;
    this.onDrag = opts.onDrag || function () {};
    this.createDOM();
    this.resize();

    // Bind Mouse Events
    this.thumb.addEventListener(
      "mousedown",
      this.onMouseDown.bind(this),
      false
    );
    window.addEventListener("mousemove", this.onMouseMove.bind(this), false);
    window.addEventListener("mouseup", this.onMouseUp.bind(this), false);
    // Bind Touch Events
    this.thumb.addEventListener(
      "touchstart",
      this.onTouchStart.bind(this),
      false
    );
    window.addEventListener("touchmove", this.onTouchMove.bind(this), false);
    window.addEventListener("touchend", this.onTouchEnd.bind(this), false);
    // Bind Common Events
    this.track.addEventListener("click", this.onTrackClick.bind(this), false);
    window.addEventListener("resize", this.resize.bind(this), false);
  }

  createDOM() {
    // Main Element
    let el = document.createElement("div");
    el.classList.add("scrollbar");
    el.classList.add("scrollbar-" + this.direction);
    this.container.appendChild(el);
    this.el = el;

    // Track
    let track = document.createElement("div");
    track.classList.add("scrollbar-track");
    this.el.appendChild(track);
    this.track = track;

    // Thumb
    let thumb = document.createElement("div");
    thumb.classList.add("scrollbar-thumb");
    this.el.appendChild(thumb);
    this.thumb = thumb;
  }

  resize() {
    if (this.direction === HORIZONTAL) {
      this.length = this.el.offsetWidth - this.thumb.offsetWidth;
    } else {
      this.length = this.el.offsetHeight - this.thumb.offsetHeight;
    }
    this.moveThumb();
  }

  resizeThumb(length) {
    if (this.direction === HORIZONTAL) {
      this.thumb.style.width = 100 * length + "%";
    } else {
      this.thumb.style.height = 100 * length + "%";
    }
    this.resize();
  }

  show() {
    if (this.isVisible) return;
    this.isVisible = true;
    this.el.style.visibility = "visible";
    this.resize();
  }

  hide() {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.el.style.visibility = "hidden";
  }

  full(enable = true) {
    if (enable) {
      this.el.classList.add("scrollbar-full");
    } else {
      this.el.classList.remove("scrollbar-full");
    }
    this.resize();
  }

  getSize() {
    if (this.direction === HORIZONTAL) {
      return this.el.offsetHeight;
    } else {
      return this.el.offsetWidth;
    }
  }

  moveThumb() {
    let pos = this.length * this.progress + "px";
    if (this.direction === HORIZONTAL) {
      this.thumb.style.transform = "translateX(" + pos + ")";
    } else {
      this.thumb.style.transform = "translateY(" + pos + ")";
    }
  }

  // Public Method
  update(progress = 0) {
    this.progress = progress;
    this.moveThumb();
  }

  onMouseDown(e) {
    this.startDrag(this.direction === HORIZONTAL ? e.clientX : e.clientY);
  }

  onMouseMove(e) {
    if (this.moving) {
      e.preventDefault();
      this.drag(this.direction === HORIZONTAL ? e.clientX : e.clientY);
    }
  }

  onMouseUp(e) {
    if (this.moving) e.preventDefault();
    this.stopDrag();
  }

  onTouchStart(e) {
    e.preventDefault();
    let touch = e.touches[0];
    this.startDrag(
      this.direction === HORIZONTAL ? touch.clientX : touch.clientY
    );
  }

  onTouchMove(e) {
    let touch = e.touches[0];
    if (this.moving)
      this.drag(this.direction === HORIZONTAL ? touch.clientX : touch.clientY);
  }

  onTouchEnd(e) {
    this.stopDrag();
  }

  startDrag(dragPos) {
    this.moving = true;
    this.dragPos = dragPos;
    this.dragProgress = this.progress;
  }

  drag(newPos) {
    let diff = (newPos - this.dragPos) / this.length;
    let newProgress = this.dragProgress + diff;
    this.onDrag(newProgress);
  }

  stopDrag() {
    if (this.moving) this.moving = false;
  }

  onTrackClick(e) {
    let pos = this.direction === HORIZONTAL ? e.offsetX : e.offsetY;
    let thumbLength =
      this.direction === HORIZONTAL
        ? this.thumb.offsetWidth
        : this.thumb.offsetHeight;
    // Move to half thumb
    pos = Math.max(0, pos - 0.5 * thumbLength);
    this.onDrag(pos / this.length);
  }
}
