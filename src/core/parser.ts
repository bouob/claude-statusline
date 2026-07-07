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
        gitWorktree: typeof d.workspace?.git_worktree === 'string' && d.workspace.git_worktree
          ? d.workspace.git_worktree
          // Top-level worktree object from --worktree sessions (CC 2.1.200+)
          : typeof d.worktree?.name === 'string' && d.worktree.name
            ? d.worktree.name
            : undefined,
      },
      effort: typeof d.effort?.level === 'string' && d.effort.level
        ? { level: d.effort.level }
        : undefined,
      thinking: typeof d.thinking?.enabled === 'boolean'
        ? { enabled: d.thinking.enabled }
        : undefined,
      agent: typeof d.agent?.name === 'string' && d.agent.name
        ? { name: d.agent.name }
        : undefined,
      pr: typeof d.pr?.number === 'number'
        ? {
            number: d.pr.number,
            url: typeof d.pr.url === 'string' ? d.pr.url : undefined,
            reviewState: typeof d.pr.review_state === 'string' ? d.pr.review_state : undefined,
          }
        : undefined,
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
