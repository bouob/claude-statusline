import type { SegmentContext } from '../segments/base.js';
import type { StatuslineConfig } from '../config/types.js';
import { getSegments } from '../segments/registry.js';
import { getSeparator } from './separators.js';
import { reset, colorize } from '../color/ansi.js';

function getTerminalWidth(): number {
  try {
    return process.stdout.columns || 80;
  } catch {
    return 80;
  }
}

interface RenderedSegment {
  text: string;
  width: number;
  name: string;
}

function renderSegments(segmentNames: string[], ctx: SegmentContext, config: StatuslineConfig): RenderedSegment[] {
  const results: RenderedSegment[] = [];

  for (const name of segmentNames) {
    const segConfig = (config.segments as Record<string, { enabled?: boolean }>)[name];
    if (segConfig && segConfig.enabled === false) continue;

    const segments = getSegments([name]);
    for (const seg of segments) {
      const result = seg.render(ctx);
      if (result) {
        results.push({ text: result.text, width: result.width, name: seg.name });
      }
    }
  }

  return results;
}

// Priority: lower index = higher priority (keep first, drop last)
const SEGMENT_PRIORITY: Record<string, number> = {
  'model': 1,
  'context-bar': 2,
  'rate-limit': 3,
  'session': 4,
  'promotion': 5,
  'git': 6,
  'project': 7,
  'worktree': 8,
};

function fitToWidth(segments: RenderedSegment[], maxWidth: number, sepWidth: number): RenderedSegment[] {
  if (maxWidth <= 0) return segments;

  let totalWidth = segments.reduce((sum, s) => sum + s.width, 0)
    + Math.max(0, segments.length - 1) * sepWidth;

  if (totalWidth <= maxWidth) return segments;

  // Drop lowest priority segments until it fits
  const sorted = [...segments].sort((a, b) => {
    const pa = SEGMENT_PRIORITY[a.name] ?? 99;
    const pb = SEGMENT_PRIORITY[b.name] ?? 99;
    return pb - pa; // highest number (lowest priority) first
  });

  const dropped = new Set<string>();
  for (const seg of sorted) {
    if (totalWidth <= maxWidth) break;
    dropped.add(seg.name);
    totalWidth -= seg.width + sepWidth;
  }

  return segments.filter((s) => !dropped.has(s.name));
}

function joinSegments(segments: RenderedSegment[], ctx: SegmentContext, config: StatuslineConfig): string {
  const sep = getSeparator(config.separator);

  const between = sep.between === '  '
    ? '  '
    : ` ${colorize(sep.between, ctx.theme.dimmed, ctx.colorDepth)} `;

  return segments.map((s) => s.text).join(between) + reset();
}

export function compose(ctx: SegmentContext, config: StatuslineConfig): string {
  const { layout } = config;
  const termWidth = config.responsive ? getTerminalWidth() : 0;
  const sep = getSeparator(config.separator);
  const sepWidth = sep.between === '  ' ? 2 : 3;

  let line1Segments = renderSegments(layout.line1, ctx, config);
  if (config.responsive && termWidth > 0) {
    line1Segments = fitToWidth(line1Segments, termWidth, sepWidth);
  }
  const line1 = joinSegments(line1Segments, ctx, config);

  if (layout.lines === 1) {
    return line1;
  }

  let line2Segments = renderSegments(layout.line2, ctx, config);
  if (config.responsive && termWidth > 0) {
    line2Segments = fitToWidth(line2Segments, termWidth, sepWidth);
  }
  const line2 = joinSegments(line2Segments, ctx, config);

  return `${line1}\n${line2}`;
}
