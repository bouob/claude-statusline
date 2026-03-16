import type { ColorDepth } from '../types.js';

export function detectColorDepth(): ColorDepth {
  const env = process.env;

  // Truecolor detection
  if (env.COLORTERM === 'truecolor' || env.COLORTERM === '24bit') {
    return 'truecolor';
  }

  // Windows Terminal supports truecolor
  if (env.WT_SESSION) {
    return 'truecolor';
  }

  // iTerm2, Kitty, WezTerm support truecolor
  if (env.TERM_PROGRAM === 'iTerm.app' || env.TERM === 'xterm-kitty' || env.TERM_PROGRAM === 'WezTerm') {
    return 'truecolor';
  }

  // 256-color detection
  if (env.TERM?.includes('256color')) {
    return '256';
  }

  return '256';
}
