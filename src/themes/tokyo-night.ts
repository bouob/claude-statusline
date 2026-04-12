import type { Theme } from './types.js';

export const tokyoNightTheme: Theme = {
  name: 'tokyo-night',
  colors: {
    primary:    { r: 122, g: 162, b: 247 }, // blue
    secondary:  { r: 86,  g: 95,  b: 137 }, // comment
    warning:    { r: 224, g: 175, b: 104 }, // yellow
    critical:   { r: 247, g: 118, b: 142 }, // red
    dimmed:     { r: 41,  g: 46,  b: 66  }, // bg highlight
    text:       { r: 169, g: 177, b: 214 }, // fg
    background: { r: 26,  g: 27,  b: 38  }, // bg
  },
};
