import type { Segment, SegmentContext } from './base.js';
import { resolveColor } from './base.js';
import type { SegmentOutput } from '../types.js';
import { colorize } from '../color/ansi.js';

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h${m}m`;
  if (m > 0) return `${m}m${s}s`;
  return `${s}s`;
}

function formatCost(usd: number): string {
  if (usd < 0.01) return '$0.00';
  return `$${usd.toFixed(2)}`;
}

export const sessionSegment: Segment = {
  name: 'session',
  render(ctx: SegmentContext): SegmentOutput {
    const dur = formatDuration(ctx.data.session.durationMs);
    const cost = formatCost(ctx.data.session.costUsd);
    const raw = `${dur} ${cost}`;
    const color = resolveColor(ctx, 'session', ctx.theme.secondary);
    const text = colorize(raw, color, ctx.colorDepth);
    return { text, width: raw.length };
  },
};
