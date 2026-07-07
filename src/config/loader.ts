import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { StatuslineConfig } from './types.js';
import { DEFAULT_CONFIG } from './defaults.js';

const CONFIG_FILENAME = 'claude-statusline.json';

function tryReadJson(path: string): Record<string, unknown> | null {
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Deep merge b into a (b wins on conflicts) */
function deepMerge(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  const result = { ...a };
  for (const key of Object.keys(b)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    const bVal = b[key];
    const aVal = a[key];
    if (bVal && typeof bVal === 'object' && !Array.isArray(bVal) && aVal && typeof aVal === 'object' && !Array.isArray(aVal)) {
      result[key] = deepMerge(aVal as Record<string, unknown>, bVal as Record<string, unknown>);
    } else {
      result[key] = bVal;
    }
  }
  return result;
}

export function loadConfig(projectDir?: string): StatuslineConfig {
  // Priority: project-level > user-level > defaults
  // Project config resolves against the session's project_dir (from stdin),
  // not the process cwd — see the git segment for the same multi-session rule.
  const projectBase = projectDir || process.cwd();
  const projectConfig = tryReadJson(join(projectBase, `.${CONFIG_FILENAME}`));
  const userConfig = tryReadJson(join(homedir(), '.claude', CONFIG_FILENAME));

  let merged = DEFAULT_CONFIG as unknown as Record<string, unknown>;

  if (userConfig) {
    merged = deepMerge(merged, userConfig);
  }
  if (projectConfig) {
    merged = deepMerge(merged, projectConfig);
  }

  return merged as unknown as StatuslineConfig;
}
