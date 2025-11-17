import {
  SAVE_URL_PATH,
  MIDI_URL_PATH,
  DATA_URL_PATH,
  SITE_URL_PATH,
} from "../data/Config.js";
import { Url } from "./Url.js";
import { EventEmitter } from "https://esm.sh/events";

export class Cloud {
  constructor(options, midiData) {
    this.options = options;
    this.midiData = midiData;

    this.emitter = new EventEmitter();

    this.url = new Url();
    this.url.on("change", (id) => {
      this.load(id);
    });
  }

  loadSong(id) {
    this.load(id);
    if (document.getElementById("edit-link")) {
      let editLink = document.getElementById("edit-link");
      editLink.parentNode.getElementById("edit-link").removeChild(editLink);
    } else {
      let editLink = document.createElement("a");
      editLink.id = "edit-link";
      editLink.textContent = "Edit with Song Maker";
      editLink.setAttribute("target", "_blank");
      editLink.setAttribute("href", `${SITE_URL_PATH}/song/` + id);
      document.body.appendChild(editLink);
    }
  }

  async save() {
    // post the data
    const form = new FormData();
    form.append("midi", this.midiData.encode(this.options));
    form.append("data", JSON.stringify(this.options.toJSON()));

    const response = await fetch(SAVE_URL_PATH, {
      method: "POST",
      body: form,
    }).then((ret) => {
      if (ret.ok) {
        var rj = ret.json();
        this.emitter.emit("save-success", rj);
        return rj;
      } else {
        throw new Error(`could not post file: ${ret.status}`);
      }
    });

    //apply the url
    this.url.setId(response.id);
  }
  async load(id) {
    this.emitter.emit("load-start", id);
    //get the midi file and midi data from the url
    const midiPromise = fetch(
      `https://storage.googleapis.com/song-maker-midifiles-prod/${id}.mid`
    ).then((ret) => {
      if (ret.ok) {
        return ret.arrayBuffer();
      } else {
        window.location = SITE_URL_PATH;
        throw new Error(`could not load midi file ${id}`);
      }
    });

    const dataPromise = fetch(`${DATA_URL_PATH}/${id}`, {
      method: "POST",
    }).then((ret) => {
      if (ret.ok) {
        return ret.json();
      } else {
        window.location = SITE_URL_PATH;
        throw new Error(`could not load data file ${id}`);
      }
    });

    const [midiBuffer, songData] = await Promise.all([
      midiPromise,
      dataPromise,
    ]);

    //set the options
    this.options.fromJSON(songData);

    //decode the midi
    this.midiData.decode(midiBuffer, this.options);
  }
  clear() {
    this.url.clear();
  }
}
