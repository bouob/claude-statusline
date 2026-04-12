import type { Segment, SegmentContext } from './base.js';
import { resolveColor } from './base.js';
import type { SegmentOutput, RGB } from '../types.js';
import { fg, reset } from '../color/ansi.js';
import { rainbowGradient } from '../color/gradient.js';
import { getBarChars } from '../core/bar-chars.js';

const DEFAULT_WIDTH = 20;

function getModeColor(ctx: SegmentContext): RGB {
  switch (ctx.mode) {
    case 'warning':  return resolveColor(ctx, 'progressWarning', ctx.theme.warning);
    case 'critical': return resolveColor(ctx, 'progressCritical', ctx.theme.critical);
    default:         return resolveColor(ctx, 'progressNormal', ctx.theme.primary);
  }
}

export const contextBarSegment: Segment = {
  name: 'context-bar',
  render(ctx: SegmentContext): SegmentOutput {
    const barWidth = ctx.config.segments['context-bar']?.width ?? DEFAULT_WIDTH;
    const chars = getBarChars(ctx.config.barStyle);
    const pct = ctx.data.context.usedPercentage;
    const filled = Math.round((pct / 100) * barWidth);
    const empty = barWidth - filled;
    const label = `${Math.round(pct)}%`;
    const emptyColor = resolveColor(ctx, 'progressEmpty', ctx.theme.dimmed);

    let bar: string;

    if (ctx.mode === 'rainbow' && filled > 0) {
      const colors = rainbowGradient(filled);
      const filledChars = colors
        .map((c) => `${fg(c, ctx.colorDepth)}${chars.filled}`)
        .join('');
      const emptyChars = `${fg(emptyColor, ctx.colorDepth)}${chars.empty.repeat(empty)}`;
      bar = `${filledChars}${emptyChars}${reset()}`;
    } else {
      const color = getModeColor(ctx);
      const filledChars = `${fg(color, ctx.colorDepth)}${chars.filled.repeat(filled)}`;
      const emptyChars = `${fg(emptyColor, ctx.colorDepth)}${chars.empty.repeat(empty)}`;
      bar = `${filledChars}${emptyChars}${reset()}`;
    }

    const text = `${bar} ${label}`;
    const width = barWidth + 1 + label.length;
    return { text, width };
  },
};
