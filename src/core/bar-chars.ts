import type { BarStyle } from '../config/types.js';

interface BarChars {
  filled: string;
  empty: string;
}

const BAR_STYLES: Record<BarStyle, BarChars> = {
  block:   { filled: '\u2588', empty: '\u2591' }, // █ ░
  dot:     { filled: '\u25CF', empty: '\u25CB' }, // ● ○
  line:    { filled: '\u2501', empty: '\u2505' }, // ━ ┅
  braille: { filled: '\u28FF', empty: '\u2800' }, // ⣿ ⠀
};

export function getBarChars(style: BarStyle): BarChars {
  return BAR_STYLES[style] ?? BAR_STYLES.block;
}
