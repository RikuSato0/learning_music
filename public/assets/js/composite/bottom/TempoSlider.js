import { EventEmitter } from "https://esm.sh/events";

export class TempoSlider extends EventEmitter {
  constructor(container) {
    super();

    this.container = document.createElement("div");
    this.container.id = "tempo-slider";
    container.appendChild(this.container);

    this.sliderCover = document.createElement("div");
    this.sliderDupe = document.createElement("div");
    this.sliderCover.classList.add("range-cover");
    this.sliderDupe.classList.add("range-dupe");
    //the slider
    this.slider = document.createElement("input");
    this.slider.type = "range";
    this.slider.min = "0";
    this.slider.max = "100";
    this.slider.value = "50";
    this.sliderCover.appendChild(this.slider);
    this.sliderCover.appendChild(this.sliderDupe);
    this.container.appendChild(this.sliderCover);

    this.label = document.createElement("label");
    this.label.for = "tempo";
    this.label.textContent = "Tempo";
    this.container.appendChild(this.label);

    this.tempoNumber = document.createElement("input");
    this.tempoNumber.classList.add("input-number");
    // this.tempoNumber.type = 'number'
    this.tempoNumber.name = "tempo";
    this.tempoNumber.min = 40;
    this.tempoNumber.max = 240;
    this.tempoNumber.value = 120;
    this.container.appendChild(this.tempoNumber);
    this.tempoNumber.onkeypress = function (event) {
      return event.charCode >= 48 && event.charCode <= 57;
    };
    this.tempoNumber.onkeydown = (event) => {
      var charCode =
        typeof event.which == "undefined" ? event.keyCode : event.which;
      if (charCode === 9) {
        this.tempoNumber.blur();
      }
      return true;
    };

    this.tempoNumber.addEventListener("change", (e) => this.updateSlider());
    this.slider.addEventListener("input", (e) => this.updateNumber());

    this.updateSlider();
  }

  set tempo(t) {
    this.tempoNumber.value = t;
    this.updateSlider();
  }

  //https://stackoverflow.com/questions/846221/logarithmic-slider

  updateDupe() {
    this.sliderDupe.style.width =
      Math.round(
        (10000 * (this.slider.value - this.slider.min)) /
          (this.slider.max - this.slider.min)
      ) /
        100 +
      "%";
  }

  updateSlider() {
    let value = parseInt(this.tempoNumber.value);
    const minp = parseInt(this.slider.min);
    const maxp = parseInt(this.slider.max);
    const minv = Math.log2(parseInt(this.tempoNumber.min));
    const maxv = Math.log2(parseInt(this.tempoNumber.max));
    const scale = (maxv - minv) / (maxp - minp);

    if (value > this.tempoNumber.max) {
      this.tempoNumber.value = value = this.tempoNumber.max;
    } else if (value < this.tempoNumber.min) {
      this.tempoNumber.value = value = this.tempoNumber.min;
    }
    this.slider.value = (Math.log2(value) - minv) / scale + minp;
    this.emit("change", parseInt(this.tempoNumber.value));
    this.updateDupe();
  }
  updateNumber() {
    const position = parseInt(this.slider.value);
    const minp = parseInt(this.slider.min);
    const maxp = parseInt(this.slider.max);
    const minv = Math.log2(parseInt(this.tempoNumber.min));
    const maxv = Math.log2(parseInt(this.tempoNumber.max));
    const scale = (maxv - minv) / (maxp - minp);
    this.tempoNumber.value = Math.round(
      Math.pow(2, minv + scale * (position - minp))
    );
    this.emit("change", parseInt(this.tempoNumber.value));
    this.updateDupe();
  }
}
