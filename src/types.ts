/** Normalized data for segments to consume */
export interface StatusData {
  model: {
    id: string;
    displayName: string;
  };
  context: {
    usedPercentage: number;
    remainingPercentage: number;
    totalTokens: number;
  };
  session: {
    durationMs: number;
    costUsd: number;
    linesAdded: number;
    linesRemoved: number;
  };
  workspace: {
    currentDir: string;
    projectDir: string;
    projectName: string;
  };
  exceeds200k: boolean;
  rateLimits?: {
    fiveHour: { usedPercentage: number; resetsAt: string | null };
    sevenDay: { usedPercentage: number; resetsAt: string | null };
  };
}

export type VisualMode = 'normal' | 'warning' | 'critical' | 'rainbow';

export interface SegmentOutput {
  text: string;
  width: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type ColorDepth = '16' | '256' | 'truecolor';
