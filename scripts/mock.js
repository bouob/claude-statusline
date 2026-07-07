#!/usr/bin/env node

/**
 * Mock script: renders every scenario through dist/index.js with real
 * Claude Code stdin JSON (one spawn per scenario — piping all scenarios
 * into a single dist/index.js run would concatenate JSON lines and fail).
 * Usage: node scripts/mock.js
 */

import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, '..', 'dist', 'index.js');

const scenarios = [
  { label: 'Normal (5%)', pct: 5, remaining: 95, exceeds: false },
  { label: 'Normal (30%)', pct: 30, remaining: 70, exceeds: false },
  { label: 'Warning (75%)', pct: 75, remaining: 25, exceeds: false },
  { label: 'Critical (88%)', pct: 88, remaining: 12, exceeds: false },
  { label: 'Rainbow - context (95%)', pct: 95, remaining: 5, exceeds: false },
  { label: 'Rainbow - exceeds 200k', pct: 40, remaining: 60, exceeds: true },
  {
    label: 'Worktree - linked (git_worktree field)',
    pct: 5, remaining: 95, exceeds: false,
    workspaceOverride: {
      current_dir: 'D:\\Desktop\\side-project\\.worktrees\\feature-auth',
      project_dir: 'D:\\Desktop\\side-project',
      added_dirs: [],
      git_worktree: 'feature-auth',
    },
  },
  {
    label: 'Worktree - top-level worktree object (2.1.200)',
    pct: 5, remaining: 95, exceeds: false,
    workspaceOverride: {
      current_dir: 'D:\\Desktop\\side-project\\.worktrees\\feature-x',
      project_dir: 'D:\\Desktop\\side-project',
      added_dirs: [],
    },
    extra: {
      version: '2.1.200',
      worktree: {
        name: 'feature-x',
        path: 'D:\\Desktop\\side-project\\.worktrees\\feature-x',
        branch: 'feature/x',
        original_cwd: 'D:\\Desktop\\side-project',
        original_branch: 'main',
      },
    },
  },
  {
    label: 'Effort max + thinking',
    pct: 30, remaining: 70, exceeds: false,
    extra: {
      version: '2.1.200',
      effort: { level: 'max' },
      thinking: { enabled: true },
    },
  },
  {
    label: 'Agent session',
    pct: 30, remaining: 70, exceeds: false,
    extra: {
      version: '2.1.200',
      agent: { name: 'code-reviewer' },
    },
  },
  {
    label: 'PR approved',
    pct: 30, remaining: 70, exceeds: false,
    extra: {
      version: '2.1.200',
      pr: { number: 42, url: 'https://github.com/bouob/claude-statusline/pull/42', review_state: 'approved' },
    },
  },
  {
    label: 'PR changes requested',
    pct: 30, remaining: 70, exceeds: false,
    extra: {
      version: '2.1.200',
      pr: { number: 42, url: 'https://github.com/bouob/claude-statusline/pull/42', review_state: 'changes_requested' },
    },
  },
  {
    label: 'PR draft',
    pct: 30, remaining: 70, exceeds: false,
    extra: {
      version: '2.1.200',
      pr: { number: 7, url: 'https://github.com/bouob/claude-statusline/pull/7', review_state: 'draft' },
    },
  },
];

for (const s of scenarios) {
  const data = {
    session_id: 'mock-session',
    cwd: 'D:\\Desktop\\side-project',
    model: { id: 'claude-opus-4-6[1m]', display_name: 'Opus 4.6 (1M context)' },
    workspace: s.workspaceOverride ?? {
      current_dir: 'D:\\Desktop\\side-project',
      project_dir: 'D:\\Desktop\\side-project',
      added_dirs: [],
    },
    version: '2.1.80',
    cost: {
      total_cost_usd: 3.45,
      total_duration_ms: 542000,
      total_api_duration_ms: 180000,
      total_lines_added: 200,
      total_lines_removed: 10,
    },
    context_window: {
      total_input_tokens: s.pct * 10000,
      total_output_tokens: 50000,
      context_window_size: 1000000,
      used_percentage: s.pct,
      remaining_percentage: s.remaining,
    },
    exceeds_200k_tokens: s.exceeds,
    rate_limits: {
      five_hour: {
        used_percentage: 42.3,
        resets_at: new Date(Date.now() + 142 * 60_000).toISOString(),
      },
      seven_day: {
        used_percentage: 67.8,
        resets_at: new Date(Date.now() + (4 * 24 + 9) * 3600_000).toISOString(),
      },
    },
    ...(s.extra ?? {}),
  };

  console.log(`\n--- ${s.label} ---`);
  try {
    const result = execFileSync('node', [dist], {
      input: JSON.stringify(data),
      encoding: 'utf-8',
      env: { ...process.env, COLORTERM: 'truecolor' },
    });
    process.stdout.write(result);
  } catch {
    console.log('[render error]');
  }
}
