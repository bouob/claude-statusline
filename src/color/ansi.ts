import type { RGB, ColorDepth } from '../types.js';

const ESC = '\x1b[';
const RESET = `${ESC}0m`;

export function reset(): string {
  return RESET;
}

export function bold(text: string): string {
  return `${ESC}1m${text}${RESET}`;
}

export function dim(text: string): string {
  return `${ESC}2m${text}${RESET}`;
}

export function fgTruecolor(rgb: RGB): string {
  return `${ESC}38;2;${rgb.r};${rgb.g};${rgb.b}m`;
}

export function bgTruecolor(rgb: RGB): string {
  return `${ESC}48;2;${rgb.r};${rgb.g};${rgb.b}m`;
}

export function fg256(code: number): string {
  return `${ESC}38;5;${code}m`;
}

export function bg256(code: number): string {
  return `${ESC}48;5;${code}m`;
}

/** Apply foreground color based on terminal capability */
export function fg(rgb: RGB, depth: ColorDepth): string {
  if (depth === 'truecolor') {
    return fgTruecolor(rgb);
  }
  return fg256(rgbTo256(rgb));
}

/** Apply background color based on terminal capability */
export function bg(rgb: RGB, depth: ColorDepth): string {
  if (depth === 'truecolor') {
    return bgTruecolor(rgb);
  }
  return bg256(rgbTo256(rgb));
}

/** Colorize text with foreground color */
export function colorize(text: string, rgb: RGB, depth: ColorDepth): string {
  return `${fg(rgb, depth)}${text}${RESET}`;
}

/** Map RGB to nearest xterm-256 color (codes 16-231) */
function rgbTo256(rgb: RGB): number {
  const r = Math.round(rgb.r / 255 * 5);
  const g = Math.round(rgb.g / 255 * 5);
  const b = Math.round(rgb.b / 255 * 5);
  return 16 + 36 * r + 6 * g + b;
}
