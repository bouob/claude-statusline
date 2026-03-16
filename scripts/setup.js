#!/usr/bin/env node

// claude-statusline setup script
// Registers statusline command in ~/.claude/settings.json

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(__dirname, '..');
const distPath = join(pluginRoot, 'dist', 'index.js');
const claudeDir = join(homedir(), '.claude');
const settingsPath = join(claudeDir, 'settings.json');

function main() {
  // Verify dist/index.js exists
  if (!existsSync(distPath)) {
    console.error(`[ERROR] dist/index.js not found at: ${distPath}`);
    console.error('Run "npm run build" in the plugin directory first.');
    process.exit(1);
  }

  // Ensure ~/.claude/ exists
  if (!existsSync(claudeDir)) {
    mkdirSync(claudeDir, { recursive: true });
  }

  // Read existing settings or start fresh
  let settings = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    } catch {
      console.error(`[WARN] Could not parse ${settingsPath}, backing up and creating new.`);
      const backup = settingsPath + '.backup';
      writeFileSync(backup, readFileSync(settingsPath));
      console.log(`Backup saved to: ${backup}`);
    }
  }

  // Check if already configured
  const command = `node ${distPath.replace(/\\/g, '/')}`;
  if (settings.statusLine?.command === command) {
    console.log('[OK] claude-statusline is already configured.');
    console.log(`Command: ${command}`);
    return;
  }

  // Write statusLine config (preserve all other settings)
  settings.statusLine = {
    type: 'command',
    command,
  };

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');

  console.log('[OK] claude-statusline registered successfully!');
  console.log(`Settings: ${settingsPath}`);
  console.log(`Command:  ${command}`);
  console.log('');
  console.log('Restart Claude Code for the statusline to take effect.');
}

main();
