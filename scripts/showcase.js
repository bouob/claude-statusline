#!/usr/bin/env node

/**
 * Showcase script: renders a compact one-line-per-item display for screenshots.
 * Usage: node scripts/showcase.js
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist', 'index.js');
const tmpConfig = join(root, '.claude-statusline.json');

const oneLineLayout = {
  lines: 1,
  line1: ['model', 'context-bar', 'project', 'git', 'session'],
};

const twoLineLayout = {
  lines: 2,
  line1: ['model', 'project', 'git', 'session'],
  line2: ['context-bar', 'rate-limit'],
};

function makeStdin(overrides = {}) {
  const base = {
    session_id: 'showcase-session',
    cwd: '/home/user/my-project',
    model: { id: 'claude-opus-4-6[1m]', display_name: 'Opus 4.6 (1M context)' },
    workspace: {
      current_dir: '/home/user/my-project',
      project_dir: '/home/user/my-project',
      added_dirs: [],
    },
    version: '2.1.80',
    cost: {
      total_cost_usd: 8.42,
      total_duration_ms: 9360000,
      total_api_duration_ms: 3120000,
      total_lines_added: 892,
      total_lines_removed: 156,
    },
    context_window: {
      total_input_tokens: 320000,
      total_output_tokens: 48000,
      context_window_size: 1000000,
      used_percentage: 32,
      remaining_percentage: 68,
    },
    exceeds_200k_tokens: false,
    rate_limits: {
      five_hour: {
        used_percentage: 23,
        resets_at: new Date(Date.now() + 142 * 60_000).toISOString(),
      },
      seven_day: {
        used_percentage: 41,
        resets_at: new Date(Date.now() + (4 * 24 + 9) * 3600_000).toISOString(),
      },
    },
  };
  return JSON.stringify({ ...base, ...overrides });
}

function render(label, configOverride = {}, stdinOverride = {}) {
  const defaultLayout = configOverride.layout ? {} : { layout: oneLineLayout };
  const config = { ...defaultLayout, responsive: false, ...configOverride };
  writeFileSync(tmpConfig, JSON.stringify(config, null, 2));
  const stdin = makeStdin(stdinOverride);
  try {
    const result = execFileSync('node', [dist], {
      input: stdin,
      cwd: root,
      encoding: 'utf-8',
      env: { ...process.env, COLORTERM: 'truecolor' },
    });
    const lines = result.trimEnd().split('\n');
    const pad = label.padEnd(16);
    console.log(`  \x1b[90m${pad}\x1b[0m ${lines[0] || ''}`);
    for (let i = 1; i < lines.length; i++) {
      console.log(`  ${' '.repeat(16)} ${lines[i]}`);
    }
  } catch {
    console.log(`  ${label.padEnd(16)} [render error]`);
  }
}

function cleanup() {
  if (existsSync(tmpConfig)) unlinkSync(tmpConfig);
}

function section(title) {
  console.log();
  console.log(`\x1b[1m  ${title}\x1b[0m`);
  console.log('\x1b[90m  ' + '─'.repeat(80) + '\x1b[0m');
}

// ── Main ──

section('THEMES');
for (const theme of ['default', 'dracula', 'nord', 'catppuccin', 'gruvbox', 'tokyo-night', 'solarized', 'one-dark', 'monokai', 'rainbow']) {
  render(theme, { theme, separator: 'powerline' });
}

section('VISUAL MODES');
render('Normal (32%)', { theme: 'dracula', separator: 'rounded' }, {
  context_window: { total_input_tokens: 320000, total_output_tokens: 48000, context_window_size: 1000000, used_percentage: 32, remaining_percentage: 68 },
});
render('Warning (75%)', { theme: 'dracula', separator: 'rounded' }, {
  context_window: { total_input_tokens: 750000, total_output_tokens: 80000, context_window_size: 1000000, used_percentage: 75, remaining_percentage: 25 },
});
render('Critical (88%)', { theme: 'dracula', separator: 'rounded' }, {
  context_window: { total_input_tokens: 880000, total_output_tokens: 90000, context_window_size: 1000000, used_percentage: 88, remaining_percentage: 12 },
});
render('Rainbow (95%)', { theme: 'dracula', separator: 'rounded' }, {
  context_window: { total_input_tokens: 950000, total_output_tokens: 95000, context_window_size: 1000000, used_percentage: 95, remaining_percentage: 5 },
});

section('BAR STYLES');
const barModels = [
  { barStyle: 'block',   model: { id: 'claude-opus-4-6[1m]', display_name: 'Opus 4.6' } },
  { barStyle: 'dot',     model: { id: 'claude-sonnet-4-6[1m]', display_name: 'Sonnet 4.6' } },
  { barStyle: 'line',    model: { id: 'claude-haiku-4-5', display_name: 'Haiku 4.5' } },
  { barStyle: 'braille', model: { id: 'claude-opus-4-6[1m]', display_name: 'Opus 4.6' } },
];
for (const { barStyle, model } of barModels) {
  render(barStyle, { theme: 'catppuccin', separator: 'powerline', barStyle }, { model });
}

section('SEPARATORS');
for (const separator of ['none', 'minimal', 'slash', 'rounded', 'powerline']) {
  render(separator, { theme: 'nord', separator });
}

section('LAYOUT');
render('1-line', { theme: 'dracula', separator: 'powerline', layout: oneLineLayout });
render('2-line (default)', { theme: 'dracula', separator: 'powerline', layout: twoLineLayout });

section('SERVICE STATUS');
// Mock status cache to simulate API issues
const statusCache = join(tmpdir(), 'claude-statusline-status.json');
const statusLayout = {
  lines: 1,
  line1: ['model', 'context-bar', 'project', 'git', 'status'],
};

// Degraded performance
writeFileSync(statusCache, JSON.stringify({
  components: [
    { name: 'Claude Code', status: 'degraded_performance' },
    { name: 'Claude API (api.anthropic.com)', status: 'operational' },
  ],
}));
render('degraded', { theme: 'dracula', separator: 'powerline', layout: statusLayout });

// Partial outage
writeFileSync(statusCache, JSON.stringify({
  components: [
    { name: 'Claude Code', status: 'operational' },
    { name: 'Claude API (api.anthropic.com)', status: 'partial_outage' },
  ],
}));
render('partial outage', { theme: 'dracula', separator: 'powerline', layout: statusLayout });

// Major outage
writeFileSync(statusCache, JSON.stringify({
  components: [
    { name: 'Claude Code', status: 'major_outage' },
    { name: 'Claude API (api.anthropic.com)', status: 'operational' },
  ],
}));
render('major outage', { theme: 'dracula', separator: 'powerline', layout: statusLayout });

// All operational (nothing shown)
writeFileSync(statusCache, JSON.stringify({
  components: [
    { name: 'Claude Code', status: 'operational' },
    { name: 'Claude API (api.anthropic.com)', status: 'operational' },
  ],
}));
render('operational', { theme: 'dracula', separator: 'powerline', layout: statusLayout });

// Clean up status cache
if (existsSync(statusCache)) unlinkSync(statusCache);

console.log();
cleanup();
