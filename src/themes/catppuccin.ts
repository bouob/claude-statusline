import type { Theme } from './types.js';

/** Catppuccin Mocha palette */
export const catppuccinTheme: Theme = {
  name: 'catppuccin',
  colors: {
    primary:    { r: 137, g: 180, b: 250 }, // Blue
    secondary:  { r: 166, g: 173, b: 200 }, // Subtext0
    warning:    { r: 249, g: 226, b: 175 }, // Yellow
    critical:   { r: 243, g: 139, b: 168 }, // Red
    dimmed:     { r: 69,  g: 71,  b: 90  }, // Surface0
    text:       { r: 205, g: 214, b: 244 }, // Text
    background: { r: 30,  g: 30,  b: 46  }, // Base
  },
};
