import type { RGB } from '../types.js';

/** Generate rainbow gradient colors for a given length.
 *  Maps hue 0 to 300 across the array positions. */
export function rainbowGradient(length: number): RGB[] {
  if (length <= 0) return [];
  if (length === 1) return [hslToRgb(0, 90, 60)];

  const colors: RGB[] = [];
  for (let i = 0; i < length; i++) {
    const hue = (i / (length - 1)) * 300;
    colors.push(hslToRgb(hue, 90, 60));
  }
  return colors;
}

/** Generate a two-color gradient */
export function linearGradient(from: RGB, to: RGB, length: number): RGB[] {
  if (length <= 0) return [];
  if (length === 1) return [from];

  const colors: RGB[] = [];
  for (let i = 0; i < length; i++) {
    const t = i / (length - 1);
    colors.push({
      r: Math.round(from.r + (to.r - from.r) * t),
      g: Math.round(from.g + (to.g - from.g) * t),
      b: Math.round(from.b + (to.b - from.b) * t),
    });
  }
  return colors;
}

/** HSL to RGB conversion. H: 0-360, S: 0-100, L: 0-100 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}
