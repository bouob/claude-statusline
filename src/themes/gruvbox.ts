import type { Theme } from './types.js';

/** Gruvbox Dark palette */
export const gruvboxTheme: Theme = {
  name: 'gruvbox',
  colors: {
    primary:    { r: 131, g: 165, b: 152 }, // aqua
    secondary:  { r: 168, g: 153, b: 132 }, // gray
    warning:    { r: 250, g: 189, b: 47  }, // yellow
    critical:   { r: 251, g: 73,  b: 52  }, // red
    dimmed:     { r: 60,  g: 56,  b: 54  }, // bg1
    text:       { r: 235, g: 219, b: 178 }, // fg
    background: { r: 40,  g: 40,  b: 40  }, // bg
  },
};
