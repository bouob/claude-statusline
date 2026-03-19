import type { Segment } from './base.js';
import { modelSegment } from './model.js';
import { contextBarSegment } from './context-bar.js';
import { sessionSegment } from './session.js';
import { gitSegment } from './git.js';
import { projectSegment } from './project.js';
import { worktreeSegment } from './worktree.js';
import { rateLimitSegment } from './rate-limit.js';
import { promotionSegment } from './promotion.js';
import { statusSegment } from './status.js';

const ALL_SEGMENTS: Segment[] = [
  modelSegment,
  contextBarSegment,
  sessionSegment,
  gitSegment,
  projectSegment,
  worktreeSegment,
  rateLimitSegment,
  promotionSegment,
  statusSegment,
];

const SEGMENT_MAP = new Map<string, Segment>(
  ALL_SEGMENTS.map((s) => [s.name, s])
);

export function getSegment(name: string): Segment | undefined {
  return SEGMENT_MAP.get(name);
}

export function getSegments(names: string[]): Segment[] {
  return names.map((n) => SEGMENT_MAP.get(n)).filter((s): s is Segment => s !== undefined);
}
