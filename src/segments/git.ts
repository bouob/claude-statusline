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

let cachedGit: GitInfo | null = null;
let cacheTime = 0;
const CACHE_TTL = 5000;

function getGitInfo(): GitInfo | null {
  const now = Date.now();
  if (cachedGit && now - cacheTime < CACHE_TTL) return cachedGit;

  try {
    const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf-8',
      timeout: 500,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    let dirty = false;
    try {
      const status = execFileSync('git', ['status', '--porcelain', '-uno'], {
        encoding: 'utf-8',
        timeout: 500,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
      dirty = status.length > 0;
    } catch {
      // ignore
    }

    cachedGit = { branch, dirty };
    cacheTime = now;
    return cachedGit;
  } catch {
    return null;
  }
}

export const gitSegment: Segment = {
  name: 'git',
  render(ctx: SegmentContext): SegmentOutput | null {
    const info = getGitInfo();
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
