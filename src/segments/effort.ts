import type { Segment, SegmentContext } from './base.js';
import { resolveColor } from './base.js';
import type { SegmentOutput, RGB } from '../types.js';
import { colorize } from '../color/ansi.js';
import { COLORS } from '../color/palette.js';

// Levels are treated as opaque strings — unknown future values fall back to
// the mid-tier color instead of crashing.
function tierColor(level: string, ctx: SegmentContext): RGB {
  switch (level.toLowerCase()) {
    case 'low':
      return ctx.theme.dimmed;
    case 'xhigh':
    case 'max':
      return COLORS.orange;
    default:
      return ctx.theme.secondary;
  }
}

export const effortSegment: Segment = {
  name: 'effort',
  render(ctx: SegmentContext): SegmentOutput | null {
    const effort = ctx.data.effort;
    if (!effort) return null;

    const showThinking = ctx.config.segments.effort?.showThinking ?? true;
    const marker = showThinking && ctx.data.thinking?.enabled ? ' ✦' : '';
    const raw = `${effort.level}${marker}`;
    const color = resolveColor(ctx, 'effort', tierColor(effort.level, ctx));
    const text = colorize(raw, color, ctx.colorDepth);
    return { text, width: raw.length };
  },
};
