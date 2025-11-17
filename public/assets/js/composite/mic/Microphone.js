import { EventEmitter } from "https://esm.sh/events";
import { PitchDetect } from "./PitchDetect.js";
import { UserMedia } from "https://esm.sh/tone";
import { MicrophoneRenderer } from "./MicrophoneRenderer.js";
import "https://esm.sh/webrtc-adapter";

function delay(t) {
  return new Promise(function (resolve) {
    setTimeout(resolve, t);
  });
}

export class Microphone extends EventEmitter {
  constructor(songOptions, inputManager) {
    super();
    this.songOptions = songOptions;
    this.inputManager = inputManager;
    this.changeTimeout = false;

    this.microphone = new UserMedia();
    this.pitchDetect = new PitchDetect(this.microphone, songOptions);
    this.pitchDetect.on("pitch", async (...args) => this.onPitch(...args));
    this.pitchDetect.on("level", (...args) => this.onLevel(...args));

    this.inputManager.on("outofbounds", () => {
      if (this.recording) this.recording = false;
    });

    this._recording = false;
    this.renderer = new MicrophoneRenderer();
    this.render = this._render.bind(this);
  }

  async open() {
    return this.microphone.open();
  }

  async supported() {
    let hasUserMedia =
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    if (hasUserMedia && navigator.mediaDevices.enumerateDevices) {
      try {
        let devices = await navigator.mediaDevices.enumerateDevices();
        for (let i = 0; i < devices.length; i++) {
          // Found an audio input
          if (devices[i].kind === "audioinput") return Promise.resolve(true);
        }
      } catch (err) {}
      // No audio inputs found
      return Promise.resolve(false);
    }
    // If enumerateDevices method does not exist, resolve basic getUserMedia check
    return Promise.resolve(!!hasUserMedia);
  }

  set recording(r) {
    if (this.changeTimeout) return;
    // Set closest
    let changed = r !== this._recording;
    this._recording = r;
    this.pitchDetect.active = r;
    if (changed) {
      if (r) {
        this.renderer.pitchIndex = false;
        this.renderer.probability = 0;
        this.emit("start");
      } else {
        this.inputManager.selector.hide();
        this.emit("end");
      }

      if (!r) this.close();

      this.changeTimeout = setTimeout(() => {
        clearTimeout(this.changeTimeout);
        this.changeTimeout = false;
      }, 600);
    }
  }

  get recording() {
    return this._recording;
  }

  close() {
    this.microphone.close();
  }

  onLevel(level) {
    this.renderer.updateLevel(Math.min(1, level * 25));
    this.emit("level", level);
  }

  async onPitch(data) {
    if (!this._recording) return;

    this.renderer.probability =
      data.closestPitch >= this.songOptions.rootNote ? data.probability : 0;

    if (data.probability > 0.25) {
      // Update InputManager
      let pitchIndex = this.inputManager.selectDefaultInstrument(
        data.closestPitch
      );
      // Update Renderer
      this.renderer.pitch = data.closestPitch;
      this.renderer.pitchIndex = isNaN(pitchIndex) ? -20 : pitchIndex;
    }

    // Register the note if probability is high enough
    if (data.probability > 0.9) {
      if (
        data.closestPitch >= this.songOptions.rootNote &&
        data.closestPitch <= this.songOptions.highestNote
      ) {
        // Add the note to the midiTrack
        this.inputManager.selector.add();
        // Stop Detecting
        this.pitchDetect.pitchMeter = false;
        await delay(500);
        this.renderer.probability = 0;
        // Resume Detecting pitch if this is still recording data
        if (this._recording) this.pitchDetect.pitchMeter = true;
        if (this._recording) this.inputManager.selector.moveRight();
      }
    }
  }

  _render(...args) {
    if (this.recording) this.renderer.render(...args);
    return this.recording;
  }
}
