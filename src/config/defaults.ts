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
    line1: ['model', 'project', 'git', 'worktree', 'promotion'],
    line2: ['context-bar', 'session', 'rate-limit', 'status'],
  },
  segments: {
    'context-bar': { enabled: true, width: 20, showPercentage: true },
    session: { enabled: true, showCost: true, showDuration: true },
    git: { enabled: true, cacheSeconds: 5 },
    project: { enabled: true },
    model: { enabled: true },
    worktree: { enabled: true },
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
    onAgent: true,
    onWorktree: true,
    alwaysOn: false,
  },
};
