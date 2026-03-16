import type { Theme } from './types.js';

export const oneDarkTheme: Theme = {
  name: 'one-dark',
  colors: {
    primary:    { r: 97,  g: 175, b: 239 }, // blue
    secondary:  { r: 92,  g: 99,  b: 112 }, // comment
    warning:    { r: 229, g: 192, b: 123 }, // yellow
    critical:   { r: 224, g: 108, b: 117 }, // red
    dimmed:     { r: 50,  g: 53,  b: 59  }, // gutter
    text:       { r: 171, g: 178, b: 191 }, // fg
    background: { r: 40,  g: 44,  b: 52  }, // bg
  },
};
