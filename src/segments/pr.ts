import type { Segment, SegmentContext } from './base.js';
import { resolveColor } from './base.js';
import type { SegmentOutput, RGB } from '../types.js';
import { colorize } from '../color/ansi.js';
import { COLORS } from '../color/palette.js';

// review_state values from Claude Code stdin (pr.review_state)
const STATE_MARKS: Record<string, { glyph: string; color: RGB }> = {
  approved:          { glyph: '✓', color: COLORS.green },
  changes_requested: { glyph: '✗', color: COLORS.red },
  pending:           { glyph: '○', color: COLORS.yellow },
  draft:             { glyph: '◌', color: COLORS.gray },
};

export const prSegment: Segment = {
  name: 'pr',
  render(ctx: SegmentContext): SegmentOutput | null {
    const pr = ctx.data.pr;
    if (!pr) return null;

    const mark = pr.reviewState ? STATE_MARKS[pr.reviewState] : undefined;
    const raw = mark ? `#${pr.number} ${mark.glyph}` : `#${pr.number}`;
    const color = resolveColor(ctx, 'pr', mark?.color ?? ctx.theme.secondary);
    const text = colorize(raw, color, ctx.colorDepth);
    return { text, width: raw.length };
  },
};
