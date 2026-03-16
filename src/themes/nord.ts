import type { Theme } from './types.js';

export const nordTheme: Theme = {
  name: 'nord',
  colors: {
    primary:    { r: 136, g: 192, b: 208 }, // Nord8 frost
    secondary:  { r: 129, g: 161, b: 193 }, // Nord9
    warning:    { r: 235, g: 203, b: 139 }, // Nord13 yellow
    critical:   { r: 191, g: 97,  b: 106 }, // Nord11 red
    dimmed:     { r: 59,  g: 66,  b: 82  }, // Nord1
    text:       { r: 216, g: 222, b: 233 }, // Nord4
    background: { r: 46,  g: 52,  b: 64  }, // Nord0
  },
};
