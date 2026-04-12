import type { RGB } from '../types.js';

export const COLORS = {
  // Base
  white:      { r: 255, g: 255, b: 255 } as RGB,
  black:      { r: 0,   g: 0,   b: 0   } as RGB,
  gray:       { r: 128, g: 128, b: 128 } as RGB,
  dimGray:    { r: 80,  g: 80,  b: 80  } as RGB,

  // Status
  cyan:       { r: 0,   g: 200, b: 200 } as RGB,
  dimCyan:    { r: 0,   g: 140, b: 140 } as RGB,
  yellow:     { r: 230, g: 200, b: 50  } as RGB,
  orange:     { r: 230, g: 140, b: 30  } as RGB,
  red:        { r: 220, g: 50,  b: 50  } as RGB,
  green:      { r: 80,  g: 200, b: 80  } as RGB,
  magenta:    { r: 200, g: 80,  b: 200 } as RGB,

  // Models
  opus:       { r: 200, g: 120, b: 255 } as RGB,
  sonnet:     { r: 100, g: 180, b: 255 } as RGB,
  haiku:      { r: 100, g: 220, b: 160 } as RGB,
} as const;
