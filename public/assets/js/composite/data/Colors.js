import cssColors from "../../../css/composite/chrome/colors.scss";
import tinycolor from "https://esm.sh/tinycolor2";

const colorsArray = [
  [227, 48, 89], // C
  [247, 88, 57], // C#
  [247, 148, 61], // D
  [243, 183, 47], // D#
  [237, 217, 41], // E
  [149, 198, 49], // F
  [86, 167, 84], // F#
  [17, 130, 109], // G
  [49, 96, 163], // G#
  [91, 55, 204], // A
  [163, 71, 191], // Bb
  [234, 87, 178], // B
];

export function midiToColor(midiNote) {
  const arr = colorsArray[midiNote % colorsArray.length];
  return `rgb(${arr.join(", ")})`;
}
export const red = cssColors.red;

export const blue = cssColors.blue;
export const blue08 = tinycolor(blue).setAlpha(0.08).toRgbString();
export const blue20 = tinycolor(blue).setAlpha(0.2).toRgbString();
export const blue25 = tinycolor(blue).setAlpha(0.25).toRgbString();
export const blue40 = tinycolor(blue).setAlpha(0.4).toRgbString();
export const blue70 = tinycolor(blue).setAlpha(0.7).toRgbString();
// export const lightBlue = tinycolor(blue).lighten(36).toRgbString()

export const black05 = tinycolor(cssColors.black).setAlpha(0.05).toRgbString();
export const black15 = tinycolor(cssColors.black).setAlpha(0.15).toRgbString();
export const lightGrayFill = cssColors.lightGrayFill;
export const veryLightGrayFill = cssColors.veryLightGrayFill;
export const darkGrayFill = cssColors.darkGrayFill;
