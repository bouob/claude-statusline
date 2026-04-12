import type { Segment, SegmentContext } from './base.js';
import { resolveColor } from './base.js';
import type { SegmentOutput } from '../types.js';
import { colorize } from '../color/ansi.js';

export const projectSegment: Segment = {
  name: 'project',
  render(ctx: SegmentContext): SegmentOutput | null {
    const name = ctx.data.workspace.projectName;
    if (!name) return null;

    const color = resolveColor(ctx, 'project', ctx.theme.secondary);
    const text = colorize(name, color, ctx.colorDepth);
    return { text, width: name.length };
  },
};
