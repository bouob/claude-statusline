import { parseInput } from './core/parser.js';
import { determineVisualMode, buildContext } from './core/engine.js';
import { compose } from './core/composer.js';
import { loadConfig } from './config/loader.js';
import { loadTheme } from './themes/loader.js';
import { detectColorDepth } from './color/detect.js';
import type { ColorDepth } from './types.js';

const config = loadConfig();
const theme = loadTheme(config.theme);
const colorDepth: ColorDepth = config.colorMode === 'auto'
  ? detectColorDepth()
  : config.colorMode;

// Collect all stdin, process on end
let buffer = '';

process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk: string) => {
  buffer += chunk;
});

process.stdin.on('end', () => {
  const input = buffer.trim();
  if (!input) return;

  const data = parseInput(input);
  if (!data) return;



  const mode = determineVisualMode(data, config);
  const ctx = buildContext(data, mode, colorDepth, theme, config);
  const output = compose(ctx, config);

  process.stdout.write(output + '\n');
});

process.on('SIGPIPE', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
