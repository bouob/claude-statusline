import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import type { Segment, SegmentContext } from './base.js';
import type { SegmentOutput } from '../types.js';
import { colorize } from '../color/ansi.js';

const CACHE_FILE = join(tmpdir(), 'claude-statusline-status.json');
const API_URL = 'https://status.claude.com/api/v2/summary.json';
const TARGETS = ['Claude Code', 'Claude API (api.anthropic.com)'];

const STATUS_LABELS: Record<string, string> = {
  degraded_performance: 'degraded',
  partial_outage: 'partial',
  major_outage: 'outage',
  under_maintenance: 'maint',
};

interface StatusComponent {
  name: string;
  status: string;
}

interface StatusCache {
  components?: StatusComponent[];
}

function readCache(ttl: number): StatusCache | null {
  try {
    const stat = statSync(CACHE_FILE);
    if (Date.now() - stat.mtimeMs > ttl) return null;
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

function fetchStatus(): StatusCache | null {
  try {
    const raw = execFileSync('curl', [
      '-s', '--max-time', '3',
      API_URL,
    ], { encoding: 'utf-8', timeout: 4000, stdio: ['pipe', 'pipe', 'pipe'] });
    const data = JSON.parse(raw);
    writeFileSync(CACHE_FILE, raw, 'utf-8');
    return data;
  } catch {
    return null;
  }
}

export const statusSegment: Segment = {
  name: 'status',
  render(ctx: SegmentContext): SegmentOutput | null {
    const statusConfig = ctx.config.segments['status'];
    const ttl = (statusConfig?.cacheTtlSeconds ?? 300) * 1000;

    const data = readCache(ttl) ?? fetchStatus();
    if (!data?.components) return null;

    const issues = data.components
      .filter(c => TARGETS.includes(c.name) && c.status !== 'operational')
      .map(c => {
        const label = STATUS_LABELS[c.status] ?? c.status;
        const short = c.name.replace(/^Claude /, '').replace(/ \(.*\)$/, '');
        return { short, label, status: c.status };
      });

    if (issues.length === 0) return null;

    const parts = issues.map(i => {
      const color = i.status === 'major_outage' ? ctx.theme.critical : ctx.theme.warning;
      return colorize(`${i.short}:${i.label}`, color, ctx.colorDepth);
    });

    const icon = '\u26A0';
    const text = `${icon} ${parts.join(' ')}`;
    const width = icon.length + 1 + issues.map(i => i.short.length + 1 + i.label.length).reduce((a, b) => a + b, 0) + (issues.length - 1);

    return { text, width };
  },
};
