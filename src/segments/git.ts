import { execFileSync } from 'node:child_process';
import type { Segment, SegmentContext } from './base.js';
import { resolveColor } from './base.js';
import type { SegmentOutput } from '../types.js';
import { colorize } from '../color/ansi.js';
import { COLORS } from '../color/palette.js';

interface GitInfo {
  branch: string;
  dirty: boolean;
}

// Git must run in the session's own directory (from stdin), never the process
// cwd — concurrent sessions would otherwise show each other's branch.
function getGitInfo(dir: string): GitInfo | null {
  if (!dir) return null;

  try {
    const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: dir,
      encoding: 'utf-8',
      timeout: 500,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    let dirty = false;
    try {
      const status = execFileSync('git', ['status', '--porcelain', '-uno'], {
        cwd: dir,
        encoding: 'utf-8',
        timeout: 500,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
      dirty = status.length > 0;
    } catch {
      // ignore
    }

    return { branch, dirty };
  } catch {
    return null;
  }
}

export const gitSegment: Segment = {
  name: 'git',
  render(ctx: SegmentContext): SegmentOutput | null {
    const info = getGitInfo(ctx.data.workspace.currentDir);
    if (!info) return null;

    const icon = '\uE0A0';
    const dirtyMark = info.dirty ? '*' : '';
    const raw = `${icon} ${info.branch}${dirtyMark}`;
    const color = info.dirty
      ? resolveColor(ctx, 'gitDirty', COLORS.yellow)
      : resolveColor(ctx, 'gitClean', ctx.theme.secondary);
    const text = colorize(raw, color, ctx.colorDepth);
    return { text, width: raw.length };
  },
};
