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
    const { currentDir, projectDir, gitWorktree } = ctx.data.workspace;

    // Priority 1: official field (Claude Code 2.1.97+)
    // Shows the actual worktree name, e.g. [feature-auth]
    let raw: string | null = null;
    if (gitWorktree) {
      raw = `[${gitWorktree}]`;
    }
    // Priority 2: legacy heuristic (pre-2.1.97 fallback)
    // Older Claude Code doesn't send git_worktree; infer from path divergence.
    else if (currentDir && projectDir && !isSubdirectory(currentDir, projectDir)) {
      raw = '[worktree]';
    }

    if (!raw) return null;

    const color = resolveColor(ctx, 'worktree', COLORS.magenta);
    const text = colorize(raw, color, ctx.colorDepth);
    return { text, width: raw.length };
  },
};
