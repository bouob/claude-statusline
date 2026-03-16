#!/usr/bin/env node

// src/core/parser.ts
import { basename } from "path";
function parseInput(raw) {
  try {
    const d = JSON.parse(raw);
    if (!d || typeof d !== "object") return null;
    const projectDir = String(d.workspace?.project_dir ?? d.cwd ?? "");
    return {
      model: {
        id: String(d.model?.id ?? "unknown"),
        displayName: String(d.model?.display_name ?? "Unknown")
      },
      context: {
        usedPercentage: Number(d.context_window?.used_percentage ?? 0),
        remainingPercentage: Number(d.context_window?.remaining_percentage ?? 100),
        totalTokens: Number(d.context_window?.context_window_size ?? 0)
      },
      session: {
        durationMs: Number(d.cost?.total_duration_ms ?? 0),
        costUsd: Number(d.cost?.total_cost_usd ?? 0),
        linesAdded: Number(d.cost?.total_lines_added ?? 0),
        linesRemoved: Number(d.cost?.total_lines_removed ?? 0)
      },
      workspace: {
        currentDir: String(d.workspace?.current_dir ?? d.cwd ?? ""),
        projectDir,
        projectName: basename(projectDir) || ""
      },
      exceeds200k: Boolean(d.exceeds_200k_tokens)
    };
  } catch {
    return null;
  }
}

// src/core/engine.ts
function determineVisualMode(data, config2) {
  const pct = data.context.usedPercentage;
  const rainbow = config2.rainbow;
  if (rainbow.alwaysOn) return "rainbow";
  if (pct > rainbow.contextThreshold) return "rainbow";
  if (data.exceeds200k) return "rainbow";
  if (pct > 85) return "critical";
  if (pct > 70) return "warning";
  return "normal";
}
function buildContext(data, mode, colorDepth2, theme2, config2) {
  return { data, mode, colorDepth: colorDepth2, theme: theme2, config: config2 };
}

// src/color/hex.ts
function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  return null;
}

// src/segments/base.ts
function resolveColor(ctx, key, fallback) {
  const hex = ctx.config.colors?.[key];
  if (!hex) return fallback;
  return hexToRgb(hex) ?? fallback;
}

// src/color/ansi.ts
var ESC = "\x1B[";
var RESET = `${ESC}0m`;
function reset() {
  return RESET;
}
function fgTruecolor(rgb) {
  return `${ESC}38;2;${rgb.r};${rgb.g};${rgb.b}m`;
}
function fg256(code) {
  return `${ESC}38;5;${code}m`;
}
function fg(rgb, depth) {
  if (depth === "truecolor") {
    return fgTruecolor(rgb);
  }
  return fg256(rgbTo256(rgb));
}
function colorize(text, rgb, depth) {
  return `${fg(rgb, depth)}${text}${RESET}`;
}
function rgbTo256(rgb) {
  const r = Math.round(rgb.r / 255 * 5);
  const g = Math.round(rgb.g / 255 * 5);
  const b = Math.round(rgb.b / 255 * 5);
  return 16 + 36 * r + 6 * g + b;
}

// src/color/palette.ts
var COLORS = {
  // Base
  white: { r: 255, g: 255, b: 255 },
  black: { r: 0, g: 0, b: 0 },
  gray: { r: 128, g: 128, b: 128 },
  dimGray: { r: 80, g: 80, b: 80 },
  // Status
  cyan: { r: 0, g: 200, b: 200 },
  dimCyan: { r: 0, g: 140, b: 140 },
  yellow: { r: 230, g: 200, b: 50 },
  orange: { r: 230, g: 140, b: 30 },
  red: { r: 220, g: 50, b: 50 },
  green: { r: 80, g: 200, b: 80 },
  magenta: { r: 200, g: 80, b: 200 },
  // Models
  opus: { r: 200, g: 120, b: 255 },
  sonnet: { r: 100, g: 180, b: 255 },
  haiku: { r: 100, g: 220, b: 160 }
};

// src/segments/model.ts
var MODEL_MAP = [
  { pattern: "opus", label: "Opus", defaultColor: COLORS.opus, colorKey: "opus" },
  { pattern: "sonnet", label: "Sonnet", defaultColor: COLORS.sonnet, colorKey: "sonnet" },
  { pattern: "haiku", label: "Haiku", defaultColor: COLORS.haiku, colorKey: "haiku" }
];
function getShortName(displayName) {
  const match = displayName.match(/^(\w+\s*[\d.]*)/);
  return match ? match[1].trim() : displayName;
}
var modelSegment = {
  name: "model",
  render(ctx) {
    const id = ctx.data.model.id.toLowerCase();
    const label = getShortName(ctx.data.model.displayName);
    for (const m of MODEL_MAP) {
      if (id.includes(m.pattern)) {
        const color = resolveColor(ctx, m.colorKey, m.defaultColor);
        const text2 = colorize(`[${label}]`, color, ctx.colorDepth);
        return { text: text2, width: label.length + 2 };
      }
    }
    const text = colorize(`[${label}]`, COLORS.gray, ctx.colorDepth);
    return { text, width: label.length + 2 };
  }
};

// src/color/gradient.ts
function rainbowGradient(length) {
  if (length <= 0) return [];
  if (length === 1) return [hslToRgb(0, 90, 60)];
  const colors = [];
  for (let i = 0; i < length; i++) {
    const hue = i / (length - 1) * 300;
    colors.push(hslToRgb(hue, 90, 60));
  }
  return colors;
}
function hslToRgb(h, s, l) {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(h / 60 % 2 - 1));
  const m = ln - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

// src/core/bar-chars.ts
var BAR_STYLES = {
  block: { filled: "\u2588", empty: "\u2591" },
  // █ ░
  dot: { filled: "\u25CF", empty: "\u25CB" },
  // ● ○
  line: { filled: "\u2501", empty: "\u2505" },
  // ━ ┅
  braille: { filled: "\u28FF", empty: "\u2800" }
  // ⣿ ⠀
};
function getBarChars(style) {
  return BAR_STYLES[style] ?? BAR_STYLES.block;
}

// src/segments/context-bar.ts
var DEFAULT_WIDTH = 20;
function getModeColor(ctx) {
  switch (ctx.mode) {
    case "warning":
      return resolveColor(ctx, "progressWarning", ctx.theme.warning);
    case "critical":
      return resolveColor(ctx, "progressCritical", ctx.theme.critical);
    default:
      return resolveColor(ctx, "progressNormal", ctx.theme.primary);
  }
}
var contextBarSegment = {
  name: "context-bar",
  render(ctx) {
    const barWidth = ctx.config.segments["context-bar"]?.width ?? DEFAULT_WIDTH;
    const chars = getBarChars(ctx.config.barStyle);
    const pct = ctx.data.context.usedPercentage;
    const filled = Math.round(pct / 100 * barWidth);
    const empty = barWidth - filled;
    const label = `${Math.round(pct)}%`;
    const emptyColor = resolveColor(ctx, "progressEmpty", ctx.theme.dimmed);
    let bar;
    if (ctx.mode === "rainbow" && filled > 0) {
      const colors = rainbowGradient(filled);
      const filledChars = colors.map((c) => `${fg(c, ctx.colorDepth)}${chars.filled}`).join("");
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
  }
};

// src/segments/session.ts
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1e3);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor(totalSeconds % 3600 / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h${m}m`;
  if (m > 0) return `${m}m${s}s`;
  return `${s}s`;
}
function formatCost(usd) {
  if (usd < 0.01) return "$0.00";
  return `$${usd.toFixed(2)}`;
}
var sessionSegment = {
  name: "session",
  render(ctx) {
    const dur = formatDuration(ctx.data.session.durationMs);
    const cost = formatCost(ctx.data.session.costUsd);
    const raw = `${dur} ${cost}`;
    const color = resolveColor(ctx, "session", ctx.theme.secondary);
    const text = colorize(raw, color, ctx.colorDepth);
    return { text, width: raw.length };
  }
};

// src/segments/git.ts
import { execFileSync } from "child_process";
var cachedGit = null;
var cacheTime = 0;
var CACHE_TTL = 5e3;
function getGitInfo() {
  const now = Date.now();
  if (cachedGit && now - cacheTime < CACHE_TTL) return cachedGit;
  try {
    const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf-8",
      timeout: 500,
      stdio: ["pipe", "pipe", "pipe"]
    }).trim();
    let dirty = false;
    try {
      const status = execFileSync("git", ["status", "--porcelain", "-uno"], {
        encoding: "utf-8",
        timeout: 500,
        stdio: ["pipe", "pipe", "pipe"]
      }).trim();
      dirty = status.length > 0;
    } catch {
    }
    cachedGit = { branch, dirty };
    cacheTime = now;
    return cachedGit;
  } catch {
    return null;
  }
}
var gitSegment = {
  name: "git",
  render(ctx) {
    const info = getGitInfo();
    if (!info) return null;
    const icon = "\uE0A0";
    const dirtyMark = info.dirty ? "*" : "";
    const raw = `${icon} ${info.branch}${dirtyMark}`;
    const color = info.dirty ? resolveColor(ctx, "gitDirty", COLORS.yellow) : resolveColor(ctx, "gitClean", ctx.theme.secondary);
    const text = colorize(raw, color, ctx.colorDepth);
    return { text, width: raw.length };
  }
};

// src/segments/project.ts
var projectSegment = {
  name: "project",
  render(ctx) {
    const name = ctx.data.workspace.projectName;
    if (!name) return null;
    const color = resolveColor(ctx, "project", ctx.theme.secondary);
    const text = colorize(name, color, ctx.colorDepth);
    return { text, width: name.length };
  }
};

// src/segments/worktree.ts
import { resolve, normalize, sep } from "path";
function normalizePath(p) {
  return normalize(resolve(p)).toLowerCase();
}
function isSubdirectory(child, parent) {
  const normalChild = normalizePath(child);
  const normalParent = normalizePath(parent);
  return normalChild.startsWith(normalParent + sep) || normalChild === normalParent;
}
var worktreeSegment = {
  name: "worktree",
  render(ctx) {
    const current = ctx.data.workspace.currentDir;
    const project = ctx.data.workspace.projectDir;
    if (!current || !project || isSubdirectory(current, project)) return null;
    const raw = "[worktree]";
    const color = resolveColor(ctx, "worktree", COLORS.magenta);
    const text = colorize(raw, color, ctx.colorDepth);
    return { text, width: raw.length };
  }
};

// src/segments/rate-limit.ts
import { readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";
import { homedir, tmpdir } from "os";
import { execFileSync as execFileSync2 } from "child_process";
var CACHE_FILE = join(tmpdir(), "claude-statusline-ratelimit.json");
var CACHE_TTL2 = 6e4;
function readCache() {
  try {
    const stat = statSync(CACHE_FILE);
    if (Date.now() - stat.mtimeMs > CACHE_TTL2) return null;
    const raw = readFileSync(CACHE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function writeCache(data) {
  try {
    writeFileSync(CACHE_FILE, JSON.stringify(data));
  } catch {
  }
}
function getAccessToken() {
  const credentialsPath = join(homedir(), ".claude", ".credentials.json");
  try {
    const raw = readFileSync(credentialsPath, "utf-8");
    const creds = JSON.parse(raw);
    const token = creds?.claudeAiOauth?.accessToken;
    if (token) return token;
  } catch {
  }
  if (process.platform === "darwin") {
    try {
      const raw = execFileSync2("security", [
        "find-generic-password",
        "-s",
        "Claude Code-credentials",
        "-w"
      ], { encoding: "utf-8", timeout: 2e3, stdio: ["pipe", "pipe", "pipe"] }).trim();
      const creds = JSON.parse(raw);
      return creds?.claudeAiOauth?.accessToken ?? null;
    } catch {
    }
  }
  return null;
}
function fetchUsage(token) {
  try {
    const result = execFileSync2("curl", [
      "-s",
      "--max-time",
      "3",
      "https://api.anthropic.com/api/oauth/usage",
      "-H",
      `Authorization: Bearer ${token}`,
      "-H",
      "anthropic-beta: oauth-2025-04-20",
      "-H",
      "Content-Type: application/json"
    ], {
      encoding: "utf-8",
      timeout: 4e3,
      stdio: ["pipe", "pipe", "pipe"]
    });
    const data = JSON.parse(result);
    return {
      fiveHour: Number(data.five_hour?.utilization ?? 0),
      sevenDay: Number(data.seven_day?.utilization ?? 0),
      fiveHourReset: data.five_hour?.resets_at ?? null,
      sevenDayReset: data.seven_day?.resets_at ?? null
    };
  } catch {
    return null;
  }
}
function getRateLimitData() {
  const cached = readCache();
  if (cached) return cached;
  const token = getAccessToken();
  if (!token) return null;
  const data = fetchUsage(token);
  if (data) writeCache(data);
  return data;
}
function getColor(pct, ctx) {
  if (pct > 85) return resolveColor(ctx, "progressCritical", ctx.theme.critical);
  if (pct > 60) return resolveColor(ctx, "progressWarning", ctx.theme.warning);
  return resolveColor(ctx, "progressNormal", ctx.theme.primary);
}
function formatResetTime(resetAt) {
  if (!resetAt) return "";
  try {
    const resetDate = new Date(resetAt);
    const now = /* @__PURE__ */ new Date();
    const diffMs = resetDate.getTime() - now.getTime();
    if (diffMs <= 0) return "";
    const diffMin = Math.floor(diffMs / 6e4);
    const d = Math.floor(diffMin / 1440);
    const h = Math.floor(diffMin % 1440 / 60);
    const m = diffMin % 60;
    if (d > 0) return `${d}d${h}h`;
    if (h > 0) return `${h}h${m}m`;
    return `${m}m`;
  } catch {
    return "";
  }
}
function resolveBarStyle(ctx) {
  const rlStyle = ctx.config.segments["rate-limit"]?.barStyle;
  if (rlStyle && rlStyle !== "inherit") return rlStyle;
  return ctx.config.barStyle;
}
function miniBar(pct, barWidth, ctx, useRainbow) {
  const chars = getBarChars(resolveBarStyle(ctx));
  const filled = Math.round(pct / 100 * barWidth);
  const empty = barWidth - filled;
  if (useRainbow && pct > 85 && filled > 0) {
    const colors = rainbowGradient(filled);
    const filledChars = colors.map((c) => `${fg(c, ctx.colorDepth)}${chars.filled}`).join("");
    const emptyChars = `${fg(ctx.theme.dimmed, ctx.colorDepth)}${chars.empty.repeat(empty)}`;
    return `${filledChars}${emptyChars}${reset()}`;
  }
  const color = getColor(pct, ctx);
  return `${fg(color, ctx.colorDepth)}${chars.filled.repeat(filled)}${fg(ctx.theme.dimmed, ctx.colorDepth)}${chars.empty.repeat(empty)}${reset()}`;
}
function renderWindow(label, pct, resetAt, barWidth, showBar, showReset, useRainbow, ctx) {
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
      const resetColor = resolveColor(ctx, "resetTime", ctx.theme.dimmed);
      text += colorize(` ${resetStr}`, resetColor, ctx.colorDepth);
      width += 1 + resetStr.length;
    }
  }
  return { text, width };
}
var rateLimitSegment = {
  name: "rate-limit",
  render(ctx) {
    const rlConfig = ctx.config.segments["rate-limit"];
    const data = getRateLimitData();
    if (!data) return null;
    const barWidth = rlConfig?.barWidth ?? 8;
    const showBar = rlConfig?.showBar ?? true;
    const showReset = rlConfig?.showResetTime ?? true;
    const showFive = rlConfig?.showFiveHour ?? true;
    const showSeven = rlConfig?.showSevenDay ?? true;
    const useRainbow = rlConfig?.rainbow ?? false;
    if (!showFive && !showSeven) return null;
    const parts = [];
    if (showFive) {
      parts.push(renderWindow("5h", data.fiveHour, data.fiveHourReset, barWidth, showBar, showReset, useRainbow, ctx));
    }
    if (showSeven) {
      parts.push(renderWindow("7d", data.sevenDay, data.sevenDayReset, barWidth, showBar, showReset, useRainbow, ctx));
    }
    const text = parts.map((p) => p.text).join("  ");
    const width = parts.reduce((sum, p) => sum + p.width, 0) + (parts.length - 1) * 2;
    return { text, width };
  }
};

// src/segments/promotion.ts
var PROMO_START = Date.UTC(2026, 2, 13, 8, 0);
var PROMO_END = Date.UTC(2026, 2, 28, 7, 59);
var PEAK_START_ET = 8;
var PEAK_END_ET = 14;
function getETComponents(now) {
  const etStr = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const etDate = new Date(etStr);
  return { hour: etDate.getHours(), dayOfWeek: etDate.getDay(), etDate };
}
function isWeekday(dayOfWeek) {
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}
function isPeakHour(hour, dayOfWeek) {
  return isWeekday(dayOfWeek) && hour >= PEAK_START_ET && hour < PEAK_END_ET;
}
function formatCountdown(ms) {
  if (ms <= 0) return "0m";
  const totalMinutes = Math.floor(ms / 6e4);
  const d = Math.floor(totalMinutes / 1440);
  const h = Math.floor(totalMinutes % 1440 / 60);
  const m = totalMinutes % 60;
  if (d > 0) return `${d}d${h}h`;
  if (h > 0) return `${h}h${m}m`;
  return `${m}m`;
}
function msUntilFlip(now) {
  const { hour, dayOfWeek, etDate } = getETComponents(now);
  if (isPeakHour(hour, dayOfWeek)) {
    const endOfPeak = new Date(etDate);
    endOfPeak.setHours(PEAK_END_ET, 0, 0, 0);
    return endOfPeak.getTime() - etDate.getTime();
  }
  const next = new Date(etDate);
  if (isWeekday(dayOfWeek) && hour >= PEAK_END_ET) {
    next.setDate(next.getDate() + (dayOfWeek === 5 ? 3 : 1));
  } else if (dayOfWeek === 0) {
    next.setDate(next.getDate() + 1);
  } else if (dayOfWeek === 6) {
    next.setDate(next.getDate() + 2);
  } else {
  }
  next.setHours(PEAK_START_ET, 0, 0, 0);
  return next.getTime() - etDate.getTime();
}
var promotionSegment = {
  name: "promotion",
  render(ctx) {
    const now = /* @__PURE__ */ new Date();
    const nowMs = now.getTime();
    if (nowMs < PROMO_START || nowMs > PROMO_END) return null;
    const { hour, dayOfWeek } = getETComponents(now);
    const peak = isPeakHour(hour, dayOfWeek);
    const countdown = formatCountdown(msUntilFlip(now));
    const offPeakColor = ctx.theme.primary;
    const peakColor = ctx.theme.dimmed;
    if (!peak) {
      const raw2 = `\u26A12x ${countdown}`;
      const text2 = colorize(raw2, offPeakColor, ctx.colorDepth);
      return { text: text2, width: raw2.length };
    }
    const raw = `1x ${countdown}`;
    const text = colorize(raw, peakColor, ctx.colorDepth);
    return { text, width: raw.length };
  }
};

// src/segments/registry.ts
var ALL_SEGMENTS = [
  modelSegment,
  contextBarSegment,
  sessionSegment,
  gitSegment,
  projectSegment,
  worktreeSegment,
  rateLimitSegment,
  promotionSegment
];
var SEGMENT_MAP = new Map(
  ALL_SEGMENTS.map((s) => [s.name, s])
);
function getSegments(names) {
  return names.map((n) => SEGMENT_MAP.get(n)).filter((s) => s !== void 0);
}

// src/core/separators.ts
var SEPARATORS = {
  powerline: { left: "\uE0B0", right: "\uE0B2", between: "\uE0B1" },
  //
  rounded: { left: "\uE0B4", right: "\uE0B6", between: "\uE0B5" },
  //
  slash: { left: "\u2571", right: "\u2572", between: "\u2571" },
  // ╱ ╲ ╱
  minimal: { left: "", right: "", between: "|" },
  none: { left: "", right: "", between: "  " }
};
function getSeparator(style) {
  return SEPARATORS[style] ?? SEPARATORS.none;
}

// src/core/composer.ts
function getTerminalWidth() {
  try {
    return process.stdout.columns || 80;
  } catch {
    return 80;
  }
}
function renderSegments(segmentNames, ctx, config2) {
  const results = [];
  for (const name of segmentNames) {
    const segConfig = config2.segments[name];
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
var SEGMENT_PRIORITY = {
  "model": 1,
  "context-bar": 2,
  "rate-limit": 3,
  "session": 4,
  "promotion": 5,
  "git": 6,
  "project": 7,
  "worktree": 8
};
function fitToWidth(segments, maxWidth, sepWidth) {
  if (maxWidth <= 0) return segments;
  let totalWidth = segments.reduce((sum, s) => sum + s.width, 0) + Math.max(0, segments.length - 1) * sepWidth;
  if (totalWidth <= maxWidth) return segments;
  const sorted = [...segments].sort((a, b) => {
    const pa = SEGMENT_PRIORITY[a.name] ?? 99;
    const pb = SEGMENT_PRIORITY[b.name] ?? 99;
    return pb - pa;
  });
  const dropped = /* @__PURE__ */ new Set();
  for (const seg of sorted) {
    if (totalWidth <= maxWidth) break;
    dropped.add(seg.name);
    totalWidth -= seg.width + sepWidth;
  }
  return segments.filter((s) => !dropped.has(s.name));
}
function joinSegments(segments, ctx, config2) {
  const sep2 = getSeparator(config2.separator);
  const between = sep2.between === "  " ? "  " : ` ${colorize(sep2.between, ctx.theme.dimmed, ctx.colorDepth)} `;
  return segments.map((s) => s.text).join(between) + reset();
}
function compose(ctx, config2) {
  const { layout } = config2;
  const termWidth = config2.responsive ? getTerminalWidth() : 0;
  const sep2 = getSeparator(config2.separator);
  const sepWidth = sep2.between === "  " ? 2 : 3;
  let line1Segments = renderSegments(layout.line1, ctx, config2);
  if (config2.responsive && termWidth > 0) {
    line1Segments = fitToWidth(line1Segments, termWidth, sepWidth);
  }
  const line1 = joinSegments(line1Segments, ctx, config2);
  if (layout.lines === 1) {
    return line1;
  }
  let line2Segments = renderSegments(layout.line2, ctx, config2);
  if (config2.responsive && termWidth > 0) {
    line2Segments = fitToWidth(line2Segments, termWidth, sepWidth);
  }
  const line2 = joinSegments(line2Segments, ctx, config2);
  return `${line1}
${line2}`;
}

// src/config/loader.ts
import { readFileSync as readFileSync2 } from "fs";
import { resolve as resolve2, join as join2 } from "path";
import { homedir as homedir2 } from "os";

// src/config/defaults.ts
var DEFAULT_CONFIG = {
  theme: "default",
  colorMode: "auto",
  separator: "none",
  barStyle: "block",
  responsive: true,
  colors: {},
  layout: {
    lines: 2,
    line1: ["model", "project", "git", "worktree", "promotion"],
    line2: ["context-bar", "session", "rate-limit"]
  },
  segments: {
    "context-bar": { enabled: true, width: 20, showPercentage: true },
    session: { enabled: true, showCost: true, showDuration: true },
    git: { enabled: true, cacheSeconds: 5 },
    project: { enabled: true },
    model: { enabled: true },
    worktree: { enabled: true },
    "rate-limit": {
      enabled: true,
      cacheSeconds: 60,
      barWidth: 8,
      barStyle: "inherit",
      showFiveHour: true,
      showSevenDay: true,
      showResetTime: true,
      showBar: true,
      rainbow: false
    },
    promotion: { enabled: true }
  },
  rainbow: {
    contextThreshold: 90,
    onAgent: true,
    onWorktree: true,
    alwaysOn: false
  }
};

// src/config/loader.ts
var CONFIG_FILENAME = "claude-statusline.json";
function tryReadJson(path) {
  try {
    const raw = readFileSync2(path, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function deepMerge(a, b) {
  const result = { ...a };
  for (const key of Object.keys(b)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
    const bVal = b[key];
    const aVal = a[key];
    if (bVal && typeof bVal === "object" && !Array.isArray(bVal) && aVal && typeof aVal === "object" && !Array.isArray(aVal)) {
      result[key] = deepMerge(aVal, bVal);
    } else {
      result[key] = bVal;
    }
  }
  return result;
}
function loadConfig() {
  const projectConfig = tryReadJson(resolve2(`.${CONFIG_FILENAME}`));
  const userConfig = tryReadJson(join2(homedir2(), ".claude", CONFIG_FILENAME));
  let merged = DEFAULT_CONFIG;
  if (userConfig) {
    merged = deepMerge(merged, userConfig);
  }
  if (projectConfig) {
    merged = deepMerge(merged, projectConfig);
  }
  return merged;
}

// src/themes/default.ts
var defaultTheme = {
  name: "default",
  colors: {
    primary: { r: 0, g: 200, b: 200 },
    // cyan
    secondary: { r: 140, g: 160, b: 170 },
    // muted steel
    warning: { r: 230, g: 200, b: 50 },
    // yellow
    critical: { r: 220, g: 50, b: 50 },
    // red
    dimmed: { r: 60, g: 60, b: 60 },
    // dark gray
    text: { r: 200, g: 200, b: 200 },
    // light gray
    background: { r: 0, g: 0, b: 0 }
    // black
  }
};

// src/themes/rainbow.ts
var rainbowTheme = {
  name: "rainbow",
  colors: {
    primary: { r: 255, g: 100, b: 200 },
    // pink
    secondary: { r: 180, g: 140, b: 255 },
    // lavender
    warning: { r: 255, g: 200, b: 50 },
    // gold
    critical: { r: 255, g: 80, b: 80 },
    // bright red
    dimmed: { r: 50, g: 50, b: 60 },
    // dark
    text: { r: 240, g: 240, b: 250 },
    // near-white
    background: { r: 0, g: 0, b: 0 }
  }
};

// src/themes/nord.ts
var nordTheme = {
  name: "nord",
  colors: {
    primary: { r: 136, g: 192, b: 208 },
    // Nord8 frost
    secondary: { r: 129, g: 161, b: 193 },
    // Nord9
    warning: { r: 235, g: 203, b: 139 },
    // Nord13 yellow
    critical: { r: 191, g: 97, b: 106 },
    // Nord11 red
    dimmed: { r: 59, g: 66, b: 82 },
    // Nord1
    text: { r: 216, g: 222, b: 233 },
    // Nord4
    background: { r: 46, g: 52, b: 64 }
    // Nord0
  }
};

// src/themes/catppuccin.ts
var catppuccinTheme = {
  name: "catppuccin",
  colors: {
    primary: { r: 137, g: 180, b: 250 },
    // Blue
    secondary: { r: 166, g: 173, b: 200 },
    // Subtext0
    warning: { r: 249, g: 226, b: 175 },
    // Yellow
    critical: { r: 243, g: 139, b: 168 },
    // Red
    dimmed: { r: 69, g: 71, b: 90 },
    // Surface0
    text: { r: 205, g: 214, b: 244 },
    // Text
    background: { r: 30, g: 30, b: 46 }
    // Base
  }
};

// src/themes/dracula.ts
var draculaTheme = {
  name: "dracula",
  colors: {
    primary: { r: 139, g: 233, b: 253 },
    // Cyan
    secondary: { r: 98, g: 114, b: 164 },
    // Comment
    warning: { r: 241, g: 250, b: 140 },
    // Yellow
    critical: { r: 255, g: 85, b: 85 },
    // Red
    dimmed: { r: 68, g: 71, b: 90 },
    // Current Line
    text: { r: 248, g: 248, b: 242 },
    // Foreground
    background: { r: 40, g: 42, b: 54 }
    // Background
  }
};

// src/themes/gruvbox.ts
var gruvboxTheme = {
  name: "gruvbox",
  colors: {
    primary: { r: 131, g: 165, b: 152 },
    // aqua
    secondary: { r: 168, g: 153, b: 132 },
    // gray
    warning: { r: 250, g: 189, b: 47 },
    // yellow
    critical: { r: 251, g: 73, b: 52 },
    // red
    dimmed: { r: 60, g: 56, b: 54 },
    // bg1
    text: { r: 235, g: 219, b: 178 },
    // fg
    background: { r: 40, g: 40, b: 40 }
    // bg
  }
};

// src/themes/tokyo-night.ts
var tokyoNightTheme = {
  name: "tokyo-night",
  colors: {
    primary: { r: 122, g: 162, b: 247 },
    // blue
    secondary: { r: 86, g: 95, b: 137 },
    // comment
    warning: { r: 224, g: 175, b: 104 },
    // yellow
    critical: { r: 247, g: 118, b: 142 },
    // red
    dimmed: { r: 41, g: 46, b: 66 },
    // bg highlight
    text: { r: 169, g: 177, b: 214 },
    // fg
    background: { r: 26, g: 27, b: 38 }
    // bg
  }
};

// src/themes/solarized.ts
var solarizedTheme = {
  name: "solarized",
  colors: {
    primary: { r: 38, g: 139, b: 210 },
    // blue
    secondary: { r: 88, g: 110, b: 117 },
    // base01
    warning: { r: 181, g: 137, b: 0 },
    // yellow
    critical: { r: 220, g: 50, b: 47 },
    // red
    dimmed: { r: 7, g: 54, b: 66 },
    // base02
    text: { r: 147, g: 161, b: 161 },
    // base1
    background: { r: 0, g: 43, b: 54 }
    // base03
  }
};

// src/themes/one-dark.ts
var oneDarkTheme = {
  name: "one-dark",
  colors: {
    primary: { r: 97, g: 175, b: 239 },
    // blue
    secondary: { r: 92, g: 99, b: 112 },
    // comment
    warning: { r: 229, g: 192, b: 123 },
    // yellow
    critical: { r: 224, g: 108, b: 117 },
    // red
    dimmed: { r: 50, g: 53, b: 59 },
    // gutter
    text: { r: 171, g: 178, b: 191 },
    // fg
    background: { r: 40, g: 44, b: 52 }
    // bg
  }
};

// src/themes/monokai.ts
var monokaiTheme = {
  name: "monokai",
  colors: {
    primary: { r: 102, g: 217, b: 239 },
    // cyan
    secondary: { r: 117, g: 113, b: 94 },
    // comment
    warning: { r: 230, g: 219, b: 116 },
    // yellow
    critical: { r: 249, g: 38, b: 114 },
    // red/magenta
    dimmed: { r: 62, g: 61, b: 50 },
    // line highlight
    text: { r: 248, g: 248, b: 242 },
    // fg
    background: { r: 39, g: 40, b: 34 }
    // bg
  }
};

// src/themes/loader.ts
var THEMES = /* @__PURE__ */ new Map([
  ["default", defaultTheme],
  ["rainbow", rainbowTheme],
  ["nord", nordTheme],
  ["catppuccin", catppuccinTheme],
  ["dracula", draculaTheme],
  ["gruvbox", gruvboxTheme],
  ["tokyo-night", tokyoNightTheme],
  ["solarized", solarizedTheme],
  ["one-dark", oneDarkTheme],
  ["monokai", monokaiTheme]
]);
function loadTheme(name) {
  const theme2 = THEMES.get(name);
  return theme2?.colors ?? defaultTheme.colors;
}

// src/color/detect.ts
function detectColorDepth() {
  const env = process.env;
  if (env.COLORTERM === "truecolor" || env.COLORTERM === "24bit") {
    return "truecolor";
  }
  if (env.WT_SESSION) {
    return "truecolor";
  }
  if (env.TERM_PROGRAM === "iTerm.app" || env.TERM === "xterm-kitty" || env.TERM_PROGRAM === "WezTerm") {
    return "truecolor";
  }
  if (env.TERM?.includes("256color")) {
    return "256";
  }
  return "256";
}

// src/index.ts
var config = loadConfig();
var theme = loadTheme(config.theme);
var colorDepth = config.colorMode === "auto" ? detectColorDepth() : config.colorMode;
var buffer = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
});
process.stdin.on("end", () => {
  const input = buffer.trim();
  if (!input) return;
  const data = parseInput(input);
  if (!data) return;
  const mode = determineVisualMode(data, config);
  const ctx = buildContext(data, mode, colorDepth, theme, config);
  const output = compose(ctx, config);
  process.stdout.write(output + "\n");
});
process.on("SIGPIPE", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
