const canvas1 = document.getElementById('canvas1'),
ctx = canvas1.getContext('2d'),
canvasDims = { w: 600, h: 600 },

audioCtx = new AudioContext(),
masterVolume = audioCtx.createGain(),

btn = document.getElementById('init'),
range = document.getElementById('range');

let mouseDown = false,
running = false,
fps = 60,
then = 0,
fpsInterval,startTime,animator;

masterVolume.gain.value = 0.05;
masterVolume.connect(audioCtx.destination);

function display() {

  let barSize = [30, 5],
  { w: cW, h: cH } = canvasDims,
  off1 = 100,
  off2 = 20,
  bars = 17,
  needleOrigin = [
  cW / 2,
  cH - off1],

  needleTip = [0, -390],
  posX = cW / 2 - barSize[0] / 2,
  posXMid = cW / 2 - barSize[0] * 0.75 / 2;

  cW = cW / 2;

  ctx.save();
  ctx.translate(cW / 2, 0);

  /// *** COLOR_RIGHT ***

  ctx.save();

  ctx.fillStyle = 'white';

  ctx.beginPath();
  ctx.moveTo(off1, off1);
  ctx.lineTo(cW - off1, off1);
  ctx.lineTo(cW - off2, cH - off2 - 10);
  ctx.lineTo(cW - off2 - 10, cH - off2);
  ctx.lineTo(off2 + 10, cH - off2);
  ctx.lineTo(off2, cH - off2 - 10);
  ctx.closePath();

  ctx.fill();

  ctx.restore();

  // *** COLOR_LEFT ***

  ctx.save();

  ctx.fillStyle = 'goldenrod';

  ctx.beginPath();
  ctx.moveTo(off1, off1);
  ctx.lineTo(cW / 2, off1);
  ctx.lineTo(cW / 2, cH - off2 - 10);
  ctx.lineTo(cW - off2 - 10, cH - off2);
  ctx.lineTo(off2 + 10, cH - off2);
  ctx.lineTo(off2, cH - off2 - 10);
  ctx.closePath();

  ctx.fill();

  ctx.restore();

  // ***DRAW_MARKS***

  ctx.save();
  ctx.translate(-cW / 2, 80);

  ctx.fillStyle = '#222';
  ctx.textAlign = 'center';
  ctx.font = '16px avenir';

  for (let i = 4; i < 21; i += 2) {
    let posY = 20 * i;
    ctx.fillRect(
    posX,
    posY - barSize[1] / 2,
    barSize[0],
    barSize[1]);

    ctx.fillText(10 * i, posX - 20, posY + 8);
    ctx.save();
    ctx.fillStyle = 'darkgray';
    ctx.fillRect(
    posXMid,
    posY + 20,
    barSize[0] * 0.75,
    barSize[1] / 2);

    ctx.restore();
  }
  ctx.restore();

  // *** DRAW_DOT ***

  ctx.save();

  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(
  needleOrigin[0] / 2,
  520,
  30, 0, Math.PI * 2);

  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // *** COLOR_BOTTOM ***

  ctx.save();

  ctx.fillStyle = 'chocolate';
  ctx.lineWidth = 10;

  ctx.beginPath();
  ctx.moveTo(off1 - 70, off1 * 5.2);
  ctx.lineTo(cW - off1 + 70, off1 * 5.2);
  ctx.lineTo(cW - off2, cH - off2 - 10);
  ctx.lineTo(cW - off2 - 10, cH - off2);
  ctx.lineTo(off2 + 10, cH - off2);
  ctx.lineTo(off2, cH - off2 - 10);
  ctx.closePath();

  ctx.fill();

  ctx.restore();

  // *** DRAW_FEET ***

  ctx.save();

  ctx.fillStyle = '#222';

  ctx.beginPath();
  ctx.arc(
  cW - off2 * 2 - 20,
  cH - off2,
  20, 0, Math.PI);

  ctx.arc(
  off2 * 2 + 20,
  cH - off2,
  20, 0, Math.PI);

  ctx.closePath();

  ctx.fill();

  ctx.restore();

  // *** DRAW_BORDER ***

  ctx.save();

  ctx.strokeStyle = 'darkslategray';
  ctx.lineWidth = 10;

  ctx.beginPath();
  ctx.moveTo(off1, off1);
  ctx.lineTo(cW - off1, off1);
  ctx.lineTo(cW - off2, cH - off2 - 10);
  ctx.lineTo(cW - off2 - 10, cH - off2);
  ctx.lineTo(off2 + 10, cH - off2);
  ctx.lineTo(off2, cH - off2 - 10);
  ctx.closePath();

  ctx.stroke();

  ctx.restore();

  ctx.restore();
}
display();

class Needle {

  constructor() {
    // display
    this.needleOrigin = [
    canvasDims.w / 2,
    canvasDims.h - 20 * 4];

    this.needleTip = [0, -390];

    // motion
    this.bpm = 80;
    this.angle = 0;
    this.dir = true;
  }

  generateSound() {
    let osc = audioCtx.createOscillator();

    osc.frequency.value = 329.63;
    osc.type = 'triangle';

    osc.connect(masterVolume);
    masterVolume.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);
  }

  tick() {

    let spread = 60 / (this.bpm / 60) / 2;

    this.angle += this.dir ?
    1 :
    -1;

    if (this.angle >= spread) {
      this.dir = false;
      this.generateSound();
    } else if (this.angle <= -spread) {
      this.dir = true;
      this.generateSound();
    }
  }

  display() {

    ctx.save();
    ctx.translate(
    this.needleOrigin[0],
    this.needleOrigin[1]);

    ctx.rotate(Math.PI / 180 * this.angle);

    ctx.fillStyle = '#ccc';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2.5, 0);
    ctx.lineTo(-2.5, this.needleTip[1]);
    ctx.lineTo(2.5, this.needleTip[1]);
    ctx.lineTo(2.5, 0);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }}


let needle = new Needle();

display();

function animate() {

  animator = requestAnimationFrame(animate);

  let now = Date.now(),
  elapsed = now - then;

  if (elapsed > fpsInterval) {

    then = now - elapsed % fpsInterval;

    ctx.clearRect(0, 0, canvasDims.w, canvasDims.h);
    display();
    needle.display();
    if (init) {needle.tick();}
  }
}

function run() {

  running = true;
  fpsInterval = 1000 / fps;
  then = Date.now();
  startTime = then;
  animate();
}

function stop() {

  running = false;
  needle.angle = 0;
  window.cancelAnimationFrame(animator);
}

function toggleInit() {

  if (running) {

    stop();
    btn.textContent = 'start';
    needle.angle = 0;

  } else if (!running) {

    run();
    btn.textContent = 'stop';
  }
}

btn.addEventListener('click', toggleInit);

range.addEventListener('mousemove', event => {

  let slider = event.target.children[0],
  cursorPos = Math.floor((event.clientY - 130) / 10) * 10 - 6,
  bpm = Math.floor((event.clientY - 130) / 10) * 5 + 20;
  bpmNumber = document.getElementById("BPMnumber");
  bpmNumber.innerHTML = bpm;

  event.target.style.cursor = '-webkit-grab';
  event.target.style.cursor = '-moz-grab';
  event.target.style.cursor = 'grab';

  if (mouseDown) {
    slider.style.top = cursorPos - 40 + 'px';
    slider.style.borderRightColor = 'black';
    event.target.style.cursor = '-webkit-grabbing';
    event.target.style.cursor = '-moz-grabbing';
    event.target.style.cursor = 'grabbing';
    needle.bpm = bpm;

  } else {
    slider.style.borderRightColor = 'red';
  }
});

range.addEventListener('mousedown', () => {
  mouseDown = true;
  toggleInit();
});

range.addEventListener('mouseup', () => {
  mouseDown = false;
  toggleInit();
});