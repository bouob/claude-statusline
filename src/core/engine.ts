import type { StatusData, VisualMode, ColorDepth } from '../types.js';
import type { ThemeColors } from '../themes/types.js';
import type { SegmentContext } from '../segments/base.js';
import type { StatuslineConfig } from '../config/types.js';

export function determineVisualMode(data: StatusData, config: StatuslineConfig): VisualMode {
  const pct = data.context.usedPercentage;
  const rainbow = config.rainbow;

  if (rainbow.alwaysOn) return 'rainbow';
  if (pct > rainbow.contextThreshold) return 'rainbow';

  if (pct > 85) return 'critical';
  if (pct > 70) return 'warning';

  return 'normal';
}

export function buildContext(
  data: StatusData,
  mode: VisualMode,
  colorDepth: ColorDepth,
  theme: ThemeColors,
  config: StatuslineConfig,
): SegmentContext {
  return { data, mode, colorDepth, theme, config };
}
