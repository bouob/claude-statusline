import type { Theme } from './types.js';

export const defaultTheme: Theme = {
  name: 'default',
  colors: {
    primary:    { r: 0,   g: 200, b: 200 }, // cyan
    secondary:  { r: 140, g: 160, b: 170 }, // muted steel
    warning:    { r: 230, g: 200, b: 50  }, // yellow
    critical:   { r: 220, g: 50,  b: 50  }, // red
    dimmed:     { r: 60,  g: 60,  b: 60  }, // dark gray
    text:       { r: 200, g: 200, b: 200 }, // light gray
    background: { r: 0,   g: 0,   b: 0   }, // black
  },
};
