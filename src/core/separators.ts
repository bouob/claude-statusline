import type { SeparatorStyle } from '../config/types.js';

interface SeparatorChars {
  left: string;
  right: string;
  between: string;
}

const SEPARATORS: Record<SeparatorStyle, SeparatorChars> = {
  powerline: { left: '\uE0B0', right: '\uE0B2', between: '\uE0B1' }, //
  rounded:   { left: '\uE0B4', right: '\uE0B6', between: '\uE0B5' }, //
  slash:     { left: '\u2571', right: '\u2572', between: '\u2571' },  // ╱ ╲ ╱
  minimal:   { left: '',       right: '',        between: '|' },
  none:      { left: '',       right: '',        between: '  ' },
};

export function getSeparator(style: SeparatorStyle): SeparatorChars {
  return SEPARATORS[style] ?? SEPARATORS.none;
}
