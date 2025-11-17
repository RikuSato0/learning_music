import "../../../css/composite/chrome/top.scss";
import { EventEmitter } from "https://esm.sh/events";
import { StartSongModal } from "../modal/StartSong.js";
import { AboutModal } from "../modal/About.js";
import { BackModal } from "../modal/Back.js";
import { ShareModal } from "../modal/Share.js";
import { SongOptions } from "../data/SongOptions.js";
import { GamePad } from "./GamePad.js";
import { GA } from "../functions/GA.js";

export class TopBar extends EventEmitter {
  constructor(container = document.body, inputManager, midiData) {
    super();

    this.modals = {
      startSong: false,
      about: false,
      share: false,
    };

    //gamepad
    this.gamePad = new GamePad(container, inputManager);
    this.gamePad.on("change", (gamePadInput) =>
      this.emit("GamePad", gamePadInput)
    );

    this.container = document.createElement("div");
    this.container.id = "topbar";
    this.toplinks = document.createElement("div");
    this.toplinks.id = "toplinks";
    this.container.appendChild(this.toplinks);
    container.appendChild(this.container);

    //make the new song button
    this.settingsButton = document.createElement("button");
    this.settingsButton.id = "header-settings";
    this.settingsButton.classList.add("header-link");
    this.settingsButton.textContent = "Restart";
    this.toplinks.appendChild(this.settingsButton);
    this.settingsButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.emit("stop");
      this.emit("restart");
      this.emit("settings-update", new SongOptions().toJSON(), true);
      GA.track({ eventCategory: "top", eventLabel: "restart" });
    });

    this.aboutButton = document.createElement("button");
    this.aboutButton.id = "header-about";
    this.aboutButton.classList.add("header-link");
    this.aboutButton.textContent = "About";
    this.toplinks.appendChild(this.aboutButton);
    this.aboutButton.addEventListener("click", (e) => {
      e.preventDefault();
      if (!this.modals.about) {
        this.modals.about = new AboutModal();
        this.modals.about.on("cancel", () => {
          this.modals.about = false;
        });
      }

      this.emit("stop");

      GA.track({ eventCategory: "top", eventLabel: "about" });
    });

    this.backButton = document.createElement("button");
    this.backButton.id = "header-back";
    this.backButton.setAttribute("aria-label", "Back to Music Lab website");
    this.backButton.textContent = "Back";
    this.container.appendChild(this.backButton);
    this.backButton.addEventListener("click", (e) => {
      GA.track({ eventCategory: "top", eventLabel: "back" });
      e.preventDefault();
      if (
        midiData.instrument.timeline._length < 1 &&
        midiData.percussion.timeline._length < 1
      ) {
        this.emit("back");
      } else if (!this.modals.back) {
        this.modals.back = new BackModal();
        this.modals.back.on("cancel", () => {
          this.modals.back = false;
        });
        this.modals.back.on("confirm", () => {
          this.modals.back = false;
          this.emit("back");
        });
      }
    });

    // in case there's a share btn at top, lets put the share modal here
    this.triggerShare = (data = false) => {
      if (!this.modals.share) {
        if (data === false) {
          this.modals.share = new ShareModal(data);
        } else if (data === "immediate") {
          this.modals.share = new ShareModal({ immediate: true });
        } else {
          this.modals.share = new ShareModal(data);
        }
        this.modals.share.on("cancel", () => {
          this.modals.share = false;
        });
        this.modals.share.on("request-wav", (id) => {
          this.emit("request-wav", id);
        });
        this.modals.share.on("request-midi", () => {
          this.emit("request-midi");
        });
      }

      if (data !== false && data !== "immediate") {
        this.modals.share.populateSaveData(data);
      }
    };

    this.triggerSettingsModal = (songOptions) => {
      this.emit("stop");
      if (!this.modals.startSong) {
        this.modals.startSong = new StartSongModal(songOptions);
        this.modals.startSong.on("options", (options) => {
          this.emit("settings-update", options);
        });
        this.modals.startSong.on("cancel", () => {
          this.modals.startSong = false;
        });
      }
    };

    this.logo = document.createElement("div");
    this.logo.id = "header-logo";
    this.logo.textContent = "Song Maker";
    this.container.appendChild(this.logo);
  }
}
