import type { RGB } from '../types.js';

export interface ThemeColors {
  primary: RGB;
  secondary: RGB;
  warning: RGB;
  critical: RGB;
  dimmed: RGB;
  text: RGB;
  background: RGB;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}
