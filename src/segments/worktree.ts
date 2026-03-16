import { resolve, normalize, sep } from 'node:path';
import type { Segment, SegmentContext } from './base.js';
import { resolveColor } from './base.js';
import type { SegmentOutput } from '../types.js';
import { colorize } from '../color/ansi.js';
import { COLORS } from '../color/palette.js';

function normalizePath(p: string): string {
  return normalize(resolve(p)).toLowerCase();
}

function isSubdirectory(child: string, parent: string): boolean {
  const normalChild = normalizePath(child);
  const normalParent = normalizePath(parent);
  return normalChild.startsWith(normalParent + sep) || normalChild === normalParent;
}

export const worktreeSegment: Segment = {
  name: 'worktree',
  render(ctx: SegmentContext): SegmentOutput | null {
    const current = ctx.data.workspace.currentDir;
    const project = ctx.data.workspace.projectDir;
    // Show [worktree] only when current_dir is NOT the project or a subdirectory of it
    // (i.e., a real git worktree in a different location)
    if (!current || !project || isSubdirectory(current, project)) return null;

    const raw = '[worktree]';
    const color = resolveColor(ctx, 'worktree', COLORS.magenta);
    const text = colorize(raw, color, ctx.colorDepth);
    return { text, width: raw.length };
  },
};
