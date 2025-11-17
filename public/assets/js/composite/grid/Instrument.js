import { AbstractInstrument } from "./AbstractInstrument.js";
import { InstrumentCanvasRenderer } from "./InstrumentCanvasRenderer.js";

export class Instrument extends AbstractInstrument {
  constructor(...args) {
    super(...args, "instrument-canvas");
  }

  rendererClass() {
    return InstrumentCanvasRenderer;
  }
}
