import type { Theme, ThemeColors } from './types.js';
import { defaultTheme } from './default.js';
import { rainbowTheme } from './rainbow.js';
import { nordTheme } from './nord.js';
import { catppuccinTheme } from './catppuccin.js';
import { draculaTheme } from './dracula.js';
import { gruvboxTheme } from './gruvbox.js';
import { tokyoNightTheme } from './tokyo-night.js';
import { solarizedTheme } from './solarized.js';
import { oneDarkTheme } from './one-dark.js';
import { monokaiTheme } from './monokai.js';

const THEMES = new Map<string, Theme>([
  ['default', defaultTheme],
  ['rainbow', rainbowTheme],
  ['nord', nordTheme],
  ['catppuccin', catppuccinTheme],
  ['dracula', draculaTheme],
  ['gruvbox', gruvboxTheme],
  ['tokyo-night', tokyoNightTheme],
  ['solarized', solarizedTheme],
  ['one-dark', oneDarkTheme],
  ['monokai', monokaiTheme],
]);

export function loadTheme(name: string): ThemeColors {
  const theme = THEMES.get(name);
  return theme?.colors ?? defaultTheme.colors;
}

export function getAvailableThemes(): string[] {
  return [...THEMES.keys()];
}
