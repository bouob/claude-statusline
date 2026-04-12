import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import type { Segment, SegmentContext } from './base.js';
import type { SegmentOutput } from '../types.js';
import { colorize } from '../color/ansi.js';

export const STATUS_CACHE_FILE = join(tmpdir(), 'claude-statusline-status.json');
const CACHE_FILE = STATUS_CACHE_FILE;
const API_URL = 'https://status.claude.com/api/v2/summary.json';
export const STATUS_TARGETS = ['Claude Code', 'Claude API (api.anthropic.com)'];
const TARGETS = STATUS_TARGETS;

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

    // Group by label so "Code:degraded API:degraded" becomes "Code,API:degraded"
    const grouped = new Map<string, typeof issues>();
    for (const i of issues) {
      const existing = grouped.get(i.label);
      if (existing) existing.push(i);
      else grouped.set(i.label, [i]);
    }

    const parts: string[] = [];
    let totalWidth = 0;
    for (const [label, group] of grouped) {
      const worstStatus = group.some(g => g.status === 'major_outage') ? 'major_outage' : group[0].status;
      const color = worstStatus === 'major_outage' ? ctx.theme.critical : ctx.theme.warning;
      const names = group.map(g => g.short).join(',');
      const raw = `${names}:${label}`;
      parts.push(colorize(raw, color, ctx.colorDepth));
      totalWidth += raw.length;
    }

    const icon = '\u26A0';
    const text = `${icon} ${parts.join(' ')}`;
    const width = icon.length + 1 + totalWidth + (parts.length - 1);

    return { text, width };
  },
};
