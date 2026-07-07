import type { Segment, SegmentContext } from './base.js';
import { resolveColor } from './base.js';
import type { SegmentOutput } from '../types.js';
import { colorize } from '../color/ansi.js';
import { COLORS } from '../color/palette.js';

export const agentSegment: Segment = {
  name: 'agent',
  render(ctx: SegmentContext): SegmentOutput | null {
    const agent = ctx.data.agent;
    if (!agent) return null;

    const raw = `@${agent.name}`;
    const color = resolveColor(ctx, 'agent', COLORS.orange);
    const text = colorize(raw, color, ctx.colorDepth);
    return { text, width: raw.length };
  },
};
