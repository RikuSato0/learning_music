import { bus } from "../data/EventBus.js";

export class History {
  constructor() {
    this.events = [];
    bus.on("history:push", (...args) => this.push(...args));
    bus.on("history:undo", (...args) => this.undo(...args));
  }

  push(event) {
    this.events.push(event);
  }

  pop() {
    return this.events.pop();
  }

  undo() {
    let event = this.pop();
    // Handle 'Single' Events
    if (event && event.type === "save") {
      return bus.emit("history:pop:" + event.type, event);
    }
    // Otherwise loop through rest of the events until the 'start' tag
    while (event && event.type !== "start") {
      bus.emit("history:pop:" + event.type, event);
      event = this.pop();
    }
  }

  clear() {
    this.events = [];
  }
}
