#!/usr/bin/env node

/**
 * Mock script: simulates Claude Code stdin with real JSON format.
 * Usage: node scripts/mock.js | node dist/index.js
 */

const scenarios = [
  { label: 'Normal (5%)', pct: 5, remaining: 95, exceeds: false },
  { label: 'Normal (30%)', pct: 30, remaining: 70, exceeds: false },
  { label: 'Warning (75%)', pct: 75, remaining: 25, exceeds: false },
  { label: 'Critical (88%)', pct: 88, remaining: 12, exceeds: false },
  { label: 'Rainbow - context (95%)', pct: 95, remaining: 5, exceeds: false },
  { label: 'Rainbow - exceeds 200k', pct: 40, remaining: 60, exceeds: true },
];

for (const s of scenarios) {
  const data = {
    session_id: 'mock-session',
    cwd: 'D:\\Desktop\\side-project',
    model: { id: 'claude-opus-4-6[1m]', display_name: 'Opus 4.6 (1M context)' },
    workspace: {
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
  };

  console.error(`\n--- ${s.label} ---`);
  console.log(JSON.stringify(data));
}
