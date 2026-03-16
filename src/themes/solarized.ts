import type { Theme } from './types.js';

/** Solarized Dark palette */
export const solarizedTheme: Theme = {
  name: 'solarized',
  colors: {
    primary:    { r: 38,  g: 139, b: 210 }, // blue
    secondary:  { r: 88,  g: 110, b: 117 }, // base01
    warning:    { r: 181, g: 137, b: 0   }, // yellow
    critical:   { r: 220, g: 50,  b: 47  }, // red
    dimmed:     { r: 7,   g: 54,  b: 66  }, // base02
    text:       { r: 147, g: 161, b: 161 }, // base1
    background: { r: 0,   g: 43,  b: 54  }, // base03
  },
};
