import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import type { Segment, SegmentContext } from './base.js';
import { resolveColor } from './base.js';
import type { SegmentOutput, RGB } from '../types.js';
import { fg, reset, colorize } from '../color/ansi.js';
import { rainbowGradient } from '../color/gradient.js';
import { getBarChars } from '../core/bar-chars.js';
import type { BarStyle } from '../config/types.js';

interface RateLimitData {
  fiveHour: number;
  sevenDay: number;
  fiveHourReset: string | number | null;
  sevenDayReset: string | number | null;
}

const CACHE_FILE = join(tmpdir(), 'claude-statusline-ratelimit.json');
const CACHE_TTL = 60_000;

function readCache(): RateLimitData | null {
  try {
    const stat = statSync(CACHE_FILE);
    if (Date.now() - stat.mtimeMs > CACHE_TTL) return null;
    const raw = readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(data: RateLimitData): void {
  try {
    writeFileSync(CACHE_FILE, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function getAccessToken(): string | null {
  // Linux / Windows: plain file
  const credentialsPath = join(homedir(), '.claude', '.credentials.json');
  try {
    const raw = readFileSync(credentialsPath, 'utf-8');
    const creds = JSON.parse(raw);
    const token = creds?.claudeAiOauth?.accessToken;
    if (token) return token;
  } catch {
    // fall through
  }

  // macOS: Keychain
  if (process.platform === 'darwin') {
    try {
      const raw = execFileSync('security', [
        'find-generic-password', '-s', 'Claude Code-credentials', '-w',
      ], { encoding: 'utf-8', timeout: 2000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      const creds = JSON.parse(raw);
      return creds?.claudeAiOauth?.accessToken ?? null;
    } catch {
      // no keychain entry
    }
  }

  return null;
}

function fetchUsage(token: string): RateLimitData | null {
  try {
    const result = execFileSync('curl', [
      '-s', '--max-time', '3',
      'https://api.anthropic.com/api/oauth/usage',
      '-H', `Authorization: Bearer ${token}`,
      '-H', 'anthropic-beta: oauth-2025-04-20',
      '-H', 'Content-Type: application/json',
    ], {
      encoding: 'utf-8',
      timeout: 4000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const data = JSON.parse(result);
    if (data.error || !data.five_hour) return null;
    return {
      fiveHour: Number(data.five_hour?.utilization ?? 0),
      sevenDay: Number(data.seven_day?.utilization ?? 0),
      fiveHourReset: data.five_hour?.resets_at ?? null,
      sevenDayReset: data.seven_day?.resets_at ?? null,
    };
  } catch {
    return null;
  }
}

function getRateLimitData(): RateLimitData | null {
  const cached = readCache();
  if (cached) return cached;

  const token = getAccessToken();
  if (!token) return null;

  const data = fetchUsage(token);
  if (data) writeCache(data);
  return data;
}

function getColor(pct: number, ctx: SegmentContext): RGB {
  if (pct > 85) return resolveColor(ctx, 'progressCritical', ctx.theme.critical);
  if (pct > 60) return resolveColor(ctx, 'progressWarning', ctx.theme.warning);
  return resolveColor(ctx, 'progressNormal', ctx.theme.primary);
}

function formatResetTime(resetAt: string | number | null): string {
  if (!resetAt) return '';
  try {
    const ts = typeof resetAt === 'number'
      ? (resetAt < 1e12 ? resetAt * 1000 : resetAt)
      : resetAt;
    const resetDate = new Date(ts);
    const now = new Date();
    const diffMs = resetDate.getTime() - now.getTime();
    if (diffMs <= 0) return '';

    const diffMin = Math.floor(diffMs / 60_000);
    const d = Math.floor(diffMin / 1440);
    const h = Math.floor((diffMin % 1440) / 60);
    const m = diffMin % 60;
    if (d > 0) return `${d}d${h}h`;
    if (h > 0) return `${h}h${m}m`;
    return `${m}m`;
  } catch {
    return '';
  }
}

function resolveBarStyle(ctx: SegmentContext): BarStyle {
  const rlStyle = ctx.config.segments['rate-limit']?.barStyle;
  if (rlStyle && rlStyle !== 'inherit') return rlStyle;
  return ctx.config.barStyle;
}

function miniBar(pct: number, barWidth: number, ctx: SegmentContext, useRainbow: boolean): string {
  const chars = getBarChars(resolveBarStyle(ctx));
  const filled = Math.round((pct / 100) * barWidth);
  const empty = barWidth - filled;

  if (useRainbow && pct > 85 && filled > 0) {
    const colors = rainbowGradient(filled);
    const filledChars = colors.map((c) => `${fg(c, ctx.colorDepth)}${chars.filled}`).join('');
    const emptyChars = `${fg(ctx.theme.dimmed, ctx.colorDepth)}${chars.empty.repeat(empty)}`;
    return `${filledChars}${emptyChars}${reset()}`;
  }

  const color = getColor(pct, ctx);
  return `${fg(color, ctx.colorDepth)}${chars.filled.repeat(filled)}${fg(ctx.theme.dimmed, ctx.colorDepth)}${chars.empty.repeat(empty)}${reset()}`;
}

function renderWindow(
  label: string,
  pct: number,
  resetAt: string | number | null,
  barWidth: number,
  showBar: boolean,
  showReset: boolean,
  useRainbow: boolean,
  ctx: SegmentContext,
): { text: string; width: number } {
  const pctStr = `${Math.round(pct)}%`;
  const pctColor = getColor(pct, ctx);

  let text = `${label}:`;
  let width = label.length + 1;

  if (showBar) {
    text += miniBar(pct, barWidth, ctx, useRainbow);
    width += barWidth;
  }

  text += ` ${colorize(pctStr, pctColor, ctx.colorDepth)}`;
  width += 1 + pctStr.length;

  if (showReset) {
    const resetStr = formatResetTime(resetAt);
    if (resetStr) {
      const resetColor = resolveColor(ctx, 'resetTime', ctx.theme.dimmed);
      text += colorize(` ${resetStr}`, resetColor, ctx.colorDepth);
      width += 1 + resetStr.length;
    }
  }

  return { text, width };
}

function fromStdin(ctx: SegmentContext): RateLimitData | null {
  const rl = ctx.data.rateLimits;
  if (!rl) return null;
  return {
    fiveHour: rl.fiveHour.usedPercentage,
    sevenDay: rl.sevenDay.usedPercentage,
    fiveHourReset: rl.fiveHour.resetsAt,
    sevenDayReset: rl.sevenDay.resetsAt,
  };
}

export const rateLimitSegment: Segment = {
  name: 'rate-limit',
  render(ctx: SegmentContext): SegmentOutput | null {
    const rlConfig = ctx.config.segments['rate-limit'];
    const data = fromStdin(ctx) ?? getRateLimitData();
    if (!data) return null;

    const barWidth = rlConfig?.barWidth ?? 8;
    const showBar = rlConfig?.showBar ?? true;
    const showReset = rlConfig?.showResetTime ?? true;
    const showFive = rlConfig?.showFiveHour ?? true;
    const showSeven = rlConfig?.showSevenDay ?? true;
    const useRainbow = rlConfig?.rainbow ?? false;

    if (!showFive && !showSeven) return null;

    const parts: { text: string; width: number }[] = [];

    if (showFive) {
      parts.push(renderWindow('5h', data.fiveHour, data.fiveHourReset, barWidth, showBar, showReset, useRainbow, ctx));
    }
    if (showSeven) {
      parts.push(renderWindow('7d', data.sevenDay, data.sevenDayReset, barWidth, showBar, showReset, useRainbow, ctx));
    }

    const text = parts.map((p) => p.text).join('  ');
    const width = parts.reduce((sum, p) => sum + p.width, 0) + (parts.length - 1) * 2;

    return { text, width };
  },
};
