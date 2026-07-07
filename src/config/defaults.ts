import type { StatuslineConfig } from './types.js';

export const DEFAULT_CONFIG: StatuslineConfig = {
  theme: 'default',
  colorMode: 'auto',
  separator: 'none',
  barStyle: 'block',
  responsive: true,
  colors: {},
  layout: {
    lines: 2,
    line1: ['model', 'effort', 'agent', 'project', 'git', 'pr', 'worktree', 'promotion'],
    line2: ['context-bar', 'session', 'rate-limit', 'status'],
  },
  segments: {
    'context-bar': { enabled: true, width: 20, showPercentage: true },
    session: { enabled: true, showCost: true, showDuration: true, showLines: false },
    git: { enabled: true },
    project: { enabled: true },
    model: { enabled: true },
    worktree: { enabled: true },
    pr: { enabled: true },
    agent: { enabled: true },
    effort: { enabled: true, showThinking: true },
    'rate-limit': {
      enabled: true,
      cacheSeconds: 60,
      barWidth: 8,
      barStyle: 'inherit',
      showFiveHour: true,
      showSevenDay: true,
      showResetTime: true,
      showBar: true,
      rainbow: false,
    },
    promotion: { enabled: true },
    status: { enabled: true, cacheTtlSeconds: 300 },
  },
  rainbow: {
    contextThreshold: 90,
    // Opt-in: a permanent rainbow bar would mask warning/critical colors
    onAgent: false,
    onWorktree: false,
    alwaysOn: false,
  },
};
