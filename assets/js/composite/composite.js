// Import Tone.js and SongOptions
import * as Tone from "tone";
import { SongOptions } from "./data/SongOptions.js";

// Initialize state
let isPlaying = false;
let currentBeat = 0;
let synth = null;
let loop = null;

// DOM Elements
const playButton = document.getElementById("play-button");
const resetButton = document.getElementById("reset-button");
const tempoSlider = document.getElementById("tempo-slider");
const bpmValue = document.getElementById("bpm-value");
const tempoItalian = document.getElementById("tempo-italian");
const timeSignatureSelect = document.getElementById("time-signature");
const dynamicSelect = document.getElementById("dynamic-markings");
const dynamicDisplay = document.getElementById("dynamic-marking-display");
const dynamicsTerm = document.querySelector(".dynamics-term");
const progressBar = document.getElementById("playback-progress");

// Initialize synth
function initializeSynth() {
  synth = new Tone.PolySynth(Tone.Synth).toDestination();
}

// Tempo mapping for Italian terms
const tempoTerms = {
  40: "Largo",
  60: "Larghetto",
  76: "Adagio",
  108: "Andante",
  120: "Moderato",
  156: "Allegro",
  176: "Vivace",
  200: "Presto",
};

// Update tempo term
function updateTempoTerm(tempo) {
  const terms = Object.entries(tempoTerms);
  for (let i = 0; i < terms.length; i++) {
    if (tempo <= terms[i][0]) {
      tempoItalian.textContent = terms[i][1];
      break;
    }
  }
}

// Initialize grid
function initializeGrid() {
  const gridContainer = document.getElementById("noteGroup");
  gridContainer.innerHTML = ""; // Clear existing grid
  gridContainer.style.gridTemplateColumns = `repeat(${numColumns}, 1fr)`;

  for (let i = 1; i <= 10 * numColumns; i++) {
    const button = document.createElement("button");
    button.classList.add("grid-btn");
    button.setAttribute("data-id", i);
    let indexColumn = i % numColumns;
    let indexRow = Math.floor(i / numColumns);

    if (i <= 8 * numColumns) {
      if (Math.floor((indexColumn - 1) / 8) % 2) {
        button.classList.add("oddBtn");
      } else {
        button.classList.add("evenBtn");
      }

      if ((indexColumn - 1) % 2 && indexColumn != 0) {
        button.classList.add("mainDivider");
      }

      button.addEventListener("mousedown", () => {
        button.classList.toggle("selected");
        const index = button.getAttribute("data-id");
        let buttonRow = 7 - Math.floor(index / numColumns);
        let buttonColumn = (index - 1) % numColumns;

        if (button.classList.contains("selected")) {
          if (!button.hasAttribute("data-original-bg")) {
            button.setAttribute(
              "data-original-bg",
              button.style.backgroundColor || ""
            );
          }
          button.setAttribute("border", "none");
          button.style.backgroundColor = noteColor[buttonRow];

          noteGroup[buttonColumn].push(buttonRow);
          sound.instrumentTrack.playNote(
            noteIndex[buttonRow],
            undefined,
            undefined,
            0.8
          );

          drawVex();
        } else {
          const originalBg = button.getAttribute("data-original-bg");
          button.style.backgroundColor = originalBg || "";
          for (let k = 0; k < noteGroup[buttonColumn].length; k++) {
            if (noteGroup[buttonColumn][k] == buttonRow)
              noteGroup[buttonColumn].splice(k, 1);
          }
          drawVex();
        }
      });
    }

    gridContainer.appendChild(button);
  }
}

// Toggle play/pause
function togglePlay() {
  if (!synth) initializeSynth();

  if (isPlaying) {
    Tone.Transport.pause();
    playButton.querySelector(".play-icon").style.display = "block";
    playButton.querySelector(".pause-icon").style.display = "none";
  } else {
    Tone.Transport.start();
    playButton.querySelector(".play-icon").style.display = "none";
    playButton.querySelector(".pause-icon").style.display = "block";
  }
  isPlaying = !isPlaying;
}

// Reset playback
function reset() {
  currentBeat = 0;
  Tone.Transport.position = 0;
  progressBar.style.width = "0%";

  // Reset all buttons including the bottom circular buttons
  const allButtons = document.querySelectorAll(".grid-btn");
  allButtons.forEach((button) => {
    const buttonId = parseInt(button.getAttribute("data-id"));
    // Check if it's a bottom circular button (after the grid)
    if (buttonId > 8 * numColumns) {
      button.classList.remove("selected");
      button.style.width = "50%";
      button.style.height = "50%";
      button.style.marginLeft = "25%";
      button.style.marginTop = "25%";
      button.style.backgroundColor = "#ccc";
      button.style.borderRadius = "50%";
    }
  });

  if (isPlaying) {
    togglePlay();
  }
}

// Update dynamics display and synth
function updateDynamics(value) {
  dynamicDisplay.textContent = value;
  const dynamic = SongOptions.dynamics[value];
  if (dynamic) {
    dynamicsTerm.textContent = dynamic.name;
    if (synth) {
      synth.volume.value = Math.log10(dynamic.velocity) * 20;
    }
  } else {
    dynamicsTerm.textContent = "";
  }
}

// Event Listeners
playButton.addEventListener("click", async () => {
  await Tone.start();
  togglePlay();
});

resetButton.addEventListener("click", reset);

tempoSlider.addEventListener("input", (e) => {
  const tempo = parseInt(e.target.value);
  Tone.Transport.bpm.value = tempo;
  bpmValue.textContent = tempo;
  updateTempoTerm(tempo);
});

timeSignatureSelect.addEventListener("change", (e) => {
  const [numerator, denominator] = e.target.value.split("/").map(Number);
  Tone.Transport.timeSignature = [numerator, denominator];
});

// Add change handler for dynamics dropdown
dynamicSelect.addEventListener("change", (e) => {
  updateDynamics(e.target.value);
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    e.preventDefault();
    togglePlay();
  } else if ((e.ctrlKey || e.metaKey) && e.key === "r") {
    e.preventDefault();
    reset();
  }
});

// Initialize transport
Tone.Transport.bpm.value = 120;
updateTempoTerm(120);

// Set up progress bar update
Tone.Transport.scheduleRepeat((time) => {
  const progress = (Tone.Transport.ticks / Tone.Transport.loopEnd) * 100;
  progressBar.style.width = `${progress}%`;
}, "16n");

// Initialize the grid on page load
initializeGrid();
