import { EventEmitter } from "https://esm.sh/events";

export class WindowFocus extends EventEmitter {
  constructor() {
    super();
    this.pageHasFocus = true;

    this.timeoutFunction = () => {
      clearTimeout(this.focusTimeout);
      let newFocus = this.checkPageFocus();
      if (this.pageHasFocus != newFocus) {
        this.pageHasFocus = newFocus;
        this.emit("focus-change", newFocus);
      }
      this.focusTimeout = setTimeout(this.timeoutFunction, 500);
    };

    this.focusTimeout = setTimeout(this.timeoutFunction, 500);

    window.addEventListener("blur", () => {
      if (this.pageHasFocus == true) {
        this.emit("focus-change", false);
        this.pageHasFocus = false;
      }
    });
  }

  checkPageFocus() {
    return !document.hidden;
  }
}
