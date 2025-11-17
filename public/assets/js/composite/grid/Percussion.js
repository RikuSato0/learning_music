import { AbstractInstrument } from "./AbstractInstrument.js";
import { PercussionCanvasRenderer } from "./PercussionCanvasRenderer.js";

export class Percussion extends AbstractInstrument {
  constructor(...args) {
    super(...args, "percussion-canvas");
  }

  rendererClass() {
    return PercussionCanvasRenderer;
  }
}
