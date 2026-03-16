export type SeparatorStyle = 'powerline' | 'rounded' | 'slash' | 'minimal' | 'none';
export type BarStyle = 'block' | 'dot' | 'line' | 'braille';

/** Hex color string like "#FF00FF" or "#F0F" */
export type HexColor = string;

export interface CustomColors {
  // Model colors
  opus?: HexColor;
  sonnet?: HexColor;
  haiku?: HexColor;

  // Progress bar colors (override theme)
  progressNormal?: HexColor;
  progressWarning?: HexColor;
  progressCritical?: HexColor;
  progressEmpty?: HexColor;

  // Segment-specific colors
  gitClean?: HexColor;
  gitDirty?: HexColor;
  worktree?: HexColor;
  project?: HexColor;
  session?: HexColor;
  resetTime?: HexColor;
}

export interface StatuslineConfig {
  theme: string;
  colorMode: 'auto' | '16' | '256' | 'truecolor';
  separator: SeparatorStyle;
  barStyle: BarStyle;
  responsive: boolean;
  colors: CustomColors;
  layout: {
    lines: 1 | 2;
    line1: string[];
    line2: string[];
  };
  segments: {
    'context-bar': { enabled: boolean; width: number; showPercentage: boolean };
    session: { enabled: boolean; showCost: boolean; showDuration: boolean };
    git: { enabled: boolean; cacheSeconds: number };
    project: { enabled: boolean };
    model: { enabled: boolean };
    worktree: { enabled: boolean };
    'rate-limit': {
      enabled: boolean;
      cacheSeconds: number;
      barWidth: number;
      barStyle: BarStyle | 'inherit';
      showFiveHour: boolean;
      showSevenDay: boolean;
      showResetTime: boolean;
      showBar: boolean;
      rainbow: boolean;
    };
    promotion: { enabled: boolean };
  };
  rainbow: {
    contextThreshold: number;
    onAgent: boolean;
    onWorktree: boolean;
    alwaysOn: boolean;
  };
}
