import "../../../css/composite/chrome/gamepad.scss";
import { GA } from "../functions/GA.js";
import { EventEmitter } from "https://esm.sh/events";

export class GamePad extends EventEmitter {
  constructor(container, inputManager) {
    super();

    this.container = document.createElement("div");
    this.container.id = "gamepad";
    container.appendChild(this.container);

    this.toggleButton = document.createElement("button");
    this.toggleButton.id = "gamepad-toggle-button";
    this.toggleButton.classList.add("button", "button-toggle");
    this.toggleButton.textContent = "GamePad Menu";
    this.toggleButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.toggleMenu();
      GA.track({ eventCategory: "gamepad", eventLabel: "toggle" });
    });

    this.selector = inputManager.selector;

    this.upButton = document.createElement("button");
    this.upButton.id = "gamepad-up-button";
    this.upButton.classList.add("button", "button-up");
    this.upButton.textContent = "Up";
    this.upButton.addEventListener("click", () => {
      this.buttonPress("up");
    });
    this.rightButton = document.createElement("button");
    this.rightButton.id = "gamepad-right-button";
    this.rightButton.classList.add("button", "button-right");
    this.rightButton.textContent = "Right";
    this.rightButton.addEventListener("click", () => {
      this.buttonPress("right");
    });
    this.downButton = document.createElement("button");
    this.downButton.id = "gamepad-down-button";
    this.downButton.classList.add("button", "button-down");
    this.downButton.textContent = "Down";
    this.downButton.addEventListener("click", () => {
      this.buttonPress("down");
    });
    this.leftButton = document.createElement("button");
    this.leftButton.id = "gamepad-left-button";
    this.leftButton.classList.add("button", "button-left");
    this.leftButton.textContent = "Left";
    this.leftButton.addEventListener("click", () => {
      this.buttonPress("left");
    });
    this.returnButton = document.createElement("button");
    this.returnButton.id = "gamepad-return-button";
    this.returnButton.classList.add("button", "button-return");
    this.returnButton.textContent = "Return";
    this.returnButton.addEventListener("click", () => {
      this.buttonPress("return");
    });

    this.container.appendChild(this.toggleButton);
    this.container.appendChild(this.leftButton);
    this.container.appendChild(this.rightButton);
    this.container.appendChild(this.upButton);
    this.container.appendChild(this.downButton);
    this.container.appendChild(this.returnButton);
  }

  toggleTabbable(makeTabbable = true) {
    var focusable = document.querySelectorAll(
      "button, [href], input, select, textarea, [tabindex]"
    );
    for (var i = 0; i < focusable.length; i++) {
      const f = focusable[i];
      if (
        f.getAttribute("id") &&
        f.getAttribute("id").indexOf("gamepad") > -1
      ) {
        continue;
      }
      if (makeTabbable) {
        if (f.getAttribute("data-tabindex")) {
          f.setAttribute("tabindex", f.getAttribute("data-tabindex"));
        } else {
          f.removeAttribute("tabindex");
        }
      } else {
        if (f.getAttribute("tabindex") && !f.getAttribute("data-tabindex")) {
          f.setAttribute("data-tabindex", f.getAttribute("tabindex"));
        } else {
          f.setAttribute("tabindex", -1);
        }
      }
    }
    if (makeTabbable) {
      document.getElementById("header-back").classList.remove("fade");
    } else {
      document.getElementById("header-back").classList.add("fade");
    }
  }

  toggleMenu() {
    if (this.container.classList.contains("expand")) {
      this.container.classList.remove("expand");
      this.toggleTabbable(true);
    } else {
      this.container.classList.add("expand");
      this.toggleTabbable(false);
    }
  }

  buttonPress(e) {
    switch (e) {
      case "right":
        this.selector.moveRight();
        break;
      case "left":
        this.selector.moveLeft();
        break;
      case "down":
        this.selector.moveDown();
        break;
      case "up":
        this.selector.moveUp();
        break;
      case "return":
      default:
        this.selector.toggle();
    }
    GA.track({ eventCategory: "gamepad", eventLabel: e });
    this.emit("change", e);
  }
}
