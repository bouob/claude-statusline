import type { Segment, SegmentContext } from './base.js';
import { resolveColor } from './base.js';
import type { SegmentOutput, RGB } from '../types.js';
import type { CustomColors } from '../config/types.js';
import { colorize } from '../color/ansi.js';
import { COLORS } from '../color/palette.js';

const MODEL_MAP: { pattern: string; label: string; defaultColor: RGB; colorKey: keyof CustomColors }[] = [
  { pattern: 'opus', label: 'Opus', defaultColor: COLORS.opus, colorKey: 'opus' },
  { pattern: 'sonnet', label: 'Sonnet', defaultColor: COLORS.sonnet, colorKey: 'sonnet' },
  { pattern: 'haiku', label: 'Haiku', defaultColor: COLORS.haiku, colorKey: 'haiku' },
];

function getShortName(displayName: string): string {
  const match = displayName.match(/^(\w+\s*[\d.]*)/);
  return match ? match[1].trim() : displayName;
}

export const modelSegment: Segment = {
  name: 'model',
  render(ctx: SegmentContext): SegmentOutput {
    const id = ctx.data.model.id.toLowerCase();
    const label = getShortName(ctx.data.model.displayName);

    for (const m of MODEL_MAP) {
      if (id.includes(m.pattern)) {
        const color = resolveColor(ctx, m.colorKey, m.defaultColor);
        const text = colorize(`[${label}]`, color, ctx.colorDepth);
        return { text, width: label.length + 2 };
      }
    }

    const text = colorize(`[${label}]`, COLORS.gray, ctx.colorDepth);
    return { text, width: label.length + 2 };
  },
};
