import type { Theme } from './types.js';

export const monokaiTheme: Theme = {
  name: 'monokai',
  colors: {
    primary:    { r: 102, g: 217, b: 239 }, // cyan
    secondary:  { r: 117, g: 113, b: 94  }, // comment
    warning:    { r: 230, g: 219, b: 116 }, // yellow
    critical:   { r: 249, g: 38,  b: 114 }, // red/magenta
    dimmed:     { r: 62,  g: 61,  b: 50  }, // line highlight
    text:       { r: 248, g: 248, b: 242 }, // fg
    background: { r: 39,  g: 40,  b: 34  }, // bg
  },
};
