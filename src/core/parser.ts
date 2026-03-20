import { basename } from 'node:path';
import type { StatusData } from '../types.js';

/** Parse real Claude Code stdin JSON into normalized StatusData */
export function parseInput(raw: string): StatusData | null {
  try {
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object') return null;

    const projectDir = String(d.workspace?.project_dir ?? d.cwd ?? '');

    return {
      model: {
        id: String(d.model?.id ?? 'unknown'),
        displayName: String(d.model?.display_name ?? 'Unknown'),
      },
      context: {
        usedPercentage: Number(d.context_window?.used_percentage ?? 0),
        remainingPercentage: Number(d.context_window?.remaining_percentage ?? 100),
        totalTokens: Number(d.context_window?.context_window_size ?? 0),
      },
      session: {
        durationMs: Number(d.cost?.total_duration_ms ?? 0),
        costUsd: Number(d.cost?.total_cost_usd ?? 0),
        linesAdded: Number(d.cost?.total_lines_added ?? 0),
        linesRemoved: Number(d.cost?.total_lines_removed ?? 0),
      },
      workspace: {
        currentDir: String(d.workspace?.current_dir ?? d.cwd ?? ''),
        projectDir,
        projectName: basename(projectDir) || '',
      },
      exceeds200k: Boolean(d.exceeds_200k_tokens),
      rateLimits: d.rate_limits?.five_hour || d.rate_limits?.seven_day
        ? {
            fiveHour: {
              usedPercentage: Number(d.rate_limits?.five_hour?.used_percentage ?? 0),
              resetsAt: d.rate_limits?.five_hour?.resets_at ?? null,
            },
            sevenDay: {
              usedPercentage: Number(d.rate_limits?.seven_day?.used_percentage ?? 0),
              resetsAt: d.rate_limits?.seven_day?.resets_at ?? null,
            },
          }
        : undefined,
    };
  } catch {
    return null;
  }
}
