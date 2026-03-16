import type { Theme } from './types.js';

export const draculaTheme: Theme = {
  name: 'dracula',
  colors: {
    primary:    { r: 139, g: 233, b: 253 }, // Cyan
    secondary:  { r: 98,  g: 114, b: 164 }, // Comment
    warning:    { r: 241, g: 250, b: 140 }, // Yellow
    critical:   { r: 255, g: 85,  b: 85  }, // Red
    dimmed:     { r: 68,  g: 71,  b: 90  }, // Current Line
    text:       { r: 248, g: 248, b: 242 }, // Foreground
    background: { r: 40,  g: 42,  b: 54  }, // Background
  },
};
