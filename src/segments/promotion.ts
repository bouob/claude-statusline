import type { Segment, SegmentContext } from './base.js';
import type { SegmentOutput } from '../types.js';
import { colorize } from '../color/ansi.js';

// Promotion: 2026/3/13 00:00 PT ~ 2026/3/27 23:59 PT
const PROMO_START = Date.UTC(2026, 2, 13, 8, 0); // 00:00 PT = 08:00 UTC
const PROMO_END = Date.UTC(2026, 2, 28, 7, 59);   // 23:59 PT = next day 07:59 UTC

// Peak: weekdays 8:00-14:00 ET
const PEAK_START_ET = 8;
const PEAK_END_ET = 14;

/** Get current hour in ET (America/New_York), accounting for DST */
function getETComponents(now: Date): { hour: number; dayOfWeek: number; etDate: Date } {
  const etStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const etDate = new Date(etStr);
  return { hour: etDate.getHours(), dayOfWeek: etDate.getDay(), etDate };
}

function isWeekday(dayOfWeek: number): boolean {
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

function isPeakHour(hour: number, dayOfWeek: number): boolean {
  return isWeekday(dayOfWeek) && hour >= PEAK_START_ET && hour < PEAK_END_ET;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0m';
  const totalMinutes = Math.floor(ms / 60_000);
  const d = Math.floor(totalMinutes / 1440);
  const h = Math.floor((totalMinutes % 1440) / 60);
  const m = totalMinutes % 60;
  if (d > 0) return `${d}d${h}h`;
  if (h > 0) return `${h}h${m}m`;
  return `${m}m`;
}

/** Calculate ms until the next state flip (peak <-> off-peak) */
function msUntilFlip(now: Date): number {
  const { hour, dayOfWeek, etDate } = getETComponents(now);

  if (isPeakHour(hour, dayOfWeek)) {
    // Currently peak -> countdown to 14:00 ET today
    const endOfPeak = new Date(etDate);
    endOfPeak.setHours(PEAK_END_ET, 0, 0, 0);
    return endOfPeak.getTime() - etDate.getTime();
  }

  // Currently off-peak -> countdown to next weekday 8:00 ET
  const next = new Date(etDate);

  if (isWeekday(dayOfWeek) && hour >= PEAK_END_ET) {
    // After peak today -> next weekday is tomorrow (or Monday if Friday)
    next.setDate(next.getDate() + (dayOfWeek === 5 ? 3 : 1));
  } else if (dayOfWeek === 0) {
    // Sunday -> Monday
    next.setDate(next.getDate() + 1);
  } else if (dayOfWeek === 6) {
    // Saturday -> Monday
    next.setDate(next.getDate() + 2);
  } else {
    // Weekday before 8:00 -> today 8:00
    // (already correct date)
  }

  next.setHours(PEAK_START_ET, 0, 0, 0);
  return next.getTime() - etDate.getTime();
}

export const promotionSegment: Segment = {
  name: 'promotion',
  render(ctx: SegmentContext): SegmentOutput | null {
    const now = new Date();
    const nowMs = now.getTime();

    // Outside promotion period -> hide
    if (nowMs < PROMO_START || nowMs > PROMO_END) return null;

    const { hour, dayOfWeek } = getETComponents(now);
    const peak = isPeakHour(hour, dayOfWeek);
    const countdown = formatCountdown(msUntilFlip(now));

    const offPeakColor = ctx.theme.primary;
    const peakColor = ctx.theme.dimmed;

    if (!peak) {
      // Off-peak: show bolt + 2x + countdown to peak
      const raw = `\u26A12x ${countdown}`;
      const text = colorize(raw, offPeakColor, ctx.colorDepth);
      return { text, width: raw.length };
    }

    // Peak: show 1x + countdown to off-peak
    const raw = `1x ${countdown}`;
    const text = colorize(raw, peakColor, ctx.colorDepth);
    return { text, width: raw.length };
  },
};
