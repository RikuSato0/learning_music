import TWEEN from "https://esm.sh/@tweenjs/tween.js";

// all of the animation frame callbacks
const callbacks = [];

function loop(t) {
  TWEEN.update(t);
  requestAnimationFrame(loop);
  callbacks.forEach((cb) => cb(t));
}
requestAnimationFrame(loop);

export function rAF(cb) {
  callbacks.push(cb);
}
