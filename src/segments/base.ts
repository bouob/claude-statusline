import type { StatusData, SegmentOutput, VisualMode, ColorDepth, RGB } from '../types.js';
import type { ThemeColors } from '../themes/types.js';
import type { StatuslineConfig, CustomColors } from '../config/types.js';
import { hexToRgb } from '../color/hex.js';

export interface SegmentContext {
  data: StatusData;
  mode: VisualMode;
  colorDepth: ColorDepth;
  theme: ThemeColors;
  config: StatuslineConfig;
}

/** Resolve a custom color from config, falling back to the provided default */
export function resolveColor(ctx: SegmentContext, key: keyof CustomColors, fallback: RGB): RGB {
  const hex = ctx.config.colors?.[key];
  if (!hex) return fallback;
  return hexToRgb(hex) ?? fallback;
}

export interface Segment {
  name: string;
  render(ctx: SegmentContext): SegmentOutput | null;
}
