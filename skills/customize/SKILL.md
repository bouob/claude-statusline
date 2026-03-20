---
name: customize
description: "This skill should be used when the user asks to customize claude-statusline appearance, or mentions: change theme, switch theme, bar style, separator, statusline colors, dracula, nord, catppuccin, hide segment, show segment, rate-limit settings, rainbow settings, responsive."
allowed-tools:
  - Read
  - Write
  - Bash(node *)
  - Bash(cd *)
  - AskUserQuestion
user-invocable: true
---

# customize

Customize claude-statusline themes, styles, colors, and segments without manually editing JSON.

## Dispatch on `$ARGUMENTS`

| Condition | Mode |
|-----------|------|
| No arguments | Wizard — interactive step-by-step setup |
| Contains "show", "current", "status", "list" | View — display current config |
| Other text | Quick edit — parse intent and update fields |

---

## Config files

Priority order (first found wins on read; user-level is default write target):

1. `./.claude-statusline.json` — project-level
2. `~/.claude/claude-statusline.json` — user-level

## Valid values

Read valid themes, separators, bar styles, color keys, and segment names from the source:
- Themes: `${CLAUDE_SKILL_DIR}/../../src/themes/` (one file per theme)
- Defaults: `${CLAUDE_SKILL_DIR}/../../src/config/defaults.ts`
- Types: `${CLAUDE_SKILL_DIR}/../../src/config/types.ts`

Color format: `#RGB` or `#RRGGBB` (hex). Validate with `/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/`.

## Segments (9)

`model`, `context-bar`, `session`, `git`, `project`, `worktree`, `rate-limit`, `promotion`, `status`

Each segment supports `enabled: boolean`. Some have additional sub-options:

| Segment | Sub-options |
|---------|------------|
| `context-bar` | `width`, `showPercentage` |
| `session` | `showCost`, `showDuration` |
| `git` | `cacheSeconds` |
| `rate-limit` | `showFiveHour`, `showSevenDay`, `showResetTime`, `showBar`, `barWidth`, `barStyle`, `rainbow` |
| `status` | `cacheTtlSeconds` |

## Rainbow behavior

The progress bar automatically shifts to rainbow gradient. Configurable via `rainbow` object:

| Field | Type | Default | Effect |
|-------|------|---------|--------|
| `contextThreshold` | `number` | `90` | Context % that triggers rainbow |
| `onAgent` | `boolean` | `true` | Rainbow when running as subagent |
| `onWorktree` | `boolean` | `true` | Rainbow when in worktree |
| `alwaysOn` | `boolean` | `false` | Force rainbow regardless of context |

---

## Wizard mode (no arguments)

Walk the user through setup step-by-step using AskUserQuestion.

### Step 1: Choose theme

Render all themes in the terminal first:

```bash
node "${CLAUDE_SKILL_DIR}/../../scripts/showcase.js" 2>/dev/null | head -13
```

Then present themes via AskUserQuestion. Enter to skip = keep current/default.

### Step 2: Choose bar style

Options: block, dot, line, braille.

### Step 3: Choose separator

Options: powerline, rounded, slash, minimal, none.

### Step 4: Rate limit settings

Ask whether to show rate-limit segment, 5h/7d/both, show bar and reset time.

### Step 5: Segment visibility

Ask which segments to hide. List all 9 segment names. Skip = keep all enabled.

### Step 6: Custom colors (optional)

Ask if the user wants custom colors. Yes → list color keys to customize. No → skip.

### Step 7: Preview and confirm

Show the complete config JSON for review. After confirmation, write and rebuild.

---

## Quick edit mode (with arguments)

### Workflow

1. **Parse intent** from `$ARGUMENTS`
2. **Read existing config** — try project-level, then user-level, fall back to `{}`
3. **Validate** — check against valid values from source
4. **Merge** — modify only specified fields, preserve the rest
5. **Write** — default to `~/.claude/claude-statusline.json`
6. **Rebuild and report** changed fields

### Intent mapping

| User says | Field |
|-----------|-------|
| `dracula` / `theme dracula` | `theme` |
| `dot` / `bar style dot` | `barStyle` |
| `powerline` / `separator powerline` | `separator` |
| `X + Y + Z` (joined with +) | Auto-detect each value's field |
| `Opus color #FF6B6B` | `colors.opus` |
| `hide git` / `show worktree` / `disable model` | `segments.<name>.enabled` |
| `disable rate-limit` | `segments.rate-limit.enabled = false` |
| `disable 7d` / `disable 5h` | `segments.rate-limit.showSevenDay/showFiveHour` |
| `hide cost` / `hide duration` | `segments.session.showCost/showDuration` |
| `hide percentage` | `segments.context-bar.showPercentage = false` |
| `bar width 30` | `segments.context-bar.width = 30` |
| `rainbow always on` / `rainbow off` | `rainbow.alwaysOn` |
| `rainbow threshold 80` | `rainbow.contextThreshold = 80` |
| `responsive off` | `responsive = false` |

Combo syntax: `dracula + dot + powerline` sets three fields at once.

---

## View mode

Read the active config file and display:
- Config file path in use
- All non-default settings
- Enabled/disabled status for each segment

---

## Rebuild

After any write, rebuild the plugin:

```bash
cd "${CLAUDE_SKILL_DIR}/../.." && npm run build
```

---

## Implementation notes

- Always Read the config file before Write — the user may have hand-edited it.
- Missing config file means defaults; treat ENOENT as `{}`, not an error.
- Only include fields the user wants to override — omitted fields use theme defaults.
- Pretty-print JSON with 2-space indent for hand-editability.
- Respond in the user's language.
