import type { Theme } from './types.js';

export const rainbowTheme: Theme = {
  name: 'rainbow',
  colors: {
    primary:    { r: 255, g: 100, b: 200 }, // pink
    secondary:  { r: 180, g: 140, b: 255 }, // lavender
    warning:    { r: 255, g: 200, b: 50  }, // gold
    critical:   { r: 255, g: 80,  b: 80  }, // bright red
    dimmed:     { r: 50,  g: 50,  b: 60  }, // dark
    text:       { r: 240, g: 240, b: 250 }, // near-white
    background: { r: 0,   g: 0,   b: 0   },
  },
};
