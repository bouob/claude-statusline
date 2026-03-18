#!/usr/bin/env node

// Auto-update statusline path after plugin version update.
// SessionStart hook — runs silently on every Claude Code launch.
// Only writes settings.json when the current path is stale.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(__dirname, '..');
const settingsPath = join(homedir(), '.claude', 'settings.json');

function findLatestVersion(cacheBase) {
  let entries;
  try {
    entries = readdirSync(cacheBase);
  } catch {
    return null;
  }
  // Sort semver descending, then return the first version that has dist/index.js
  entries.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));
  for (const v of entries) {
    const p = join(cacheBase, v, 'dist', 'index.js');
    if (existsSync(p)) return p;
  }
  return null;
}

function main() {
  if (!existsSync(settingsPath)) return;

  let settings;
  try {
    settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
  } catch {
    return; // corrupted settings — don't touch
  }

  const current = settings.statusLine?.command;
  if (!current || !current.includes('claude-statusline')) return;

  // Extract the path from "node <path>"
  const match = current.match(/^node\s+(.+)$/);
  if (!match) return;

  if (existsSync(match[1])) return; // path is valid, nothing to do

  // Path is stale — find latest version in cache
  // Cache structure: .claude/plugins/cache/claude-statusline/claude-statusline/<version>/
  const cacheBase = resolve(pluginRoot, '..');
  const latestDist = findLatestVersion(cacheBase);
  if (!latestDist) return;

  const newCommand = `node ${latestDist.replace(/\\/g, '/')}`;
  settings.statusLine = {
    type: 'command',
    command: newCommand,
  };

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
}

main();
