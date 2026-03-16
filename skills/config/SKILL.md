---
name: config
description: "Quickly configure claude-statusline themes, styles, colors, and segments"
allowed-tools: Read, Write, Edit, Bash, Glob, AskUserQuestion
user-invocable: true
---

# config

Quickly configure claude-statusline without manually writing JSON.

## Mode Detection

Determine mode based on `$ARGUMENTS`:

| Condition | Mode | Behavior |
|-----------|------|----------|
| No arguments | Wizard mode | Interactive step-by-step setup |
| Contains "show", "current", "status", "list" | View mode | Display current config |
| Contains "reset", "default", "restore" | Reset mode | Delete config and restore defaults |
| Other | Quick edit mode | Update specified fields directly |

---

## Valid Values Reference

### Themes (10)

| Name | Style |
|------|-------|
| `default` | Subtle cyan |
| `rainbow` | Pink-purple tones |
| `nord` | Nordic cool blues |
| `catppuccin` | Mocha warm tones |
| `dracula` | Deep purple-blue |
| `gruvbox` | Retro warm tones |
| `tokyo-night` | Tokyo night blue-purple |
| `solarized` | Classic Solarized Dark |
| `one-dark` | Atom One Dark |
| `monokai` | Sublime Monokai |

### Separators (5)

| Name | Appearance |
|------|------------|
| `powerline` | Nerd Font arrows  /  |
| `rounded` | Rounded  /  |
| `slash` | Slashes / |
| `minimal` | Pipe \| |
| `none` | Space (default) |

### Bar Styles (4)

| Name | Appearance |
|------|------------|
| `block` | `████░░░░` (default) |
| `dot` | `●●●●○○○○` |
| `line` | `━━━━┅┅┅┅` |
| `braille` | `⣿⣿⣿⣿⠀⠀⠀⠀` |

### Custom Color Keys (12)

`opus`, `sonnet`, `haiku`, `progressNormal`, `progressWarning`, `progressCritical`, `progressEmpty`, `gitClean`, `gitDirty`, `worktree`, `project`, `session`, `resetTime`

- Format: `#RGB` or `#RRGGBB` (hex)

### Segments (8)

`model`, `context-bar`, `session`, `git`, `project`, `worktree`, `rate-limit`, `promotion`

### Config File Locations

1. `./.claude-statusline.json` — Project-level (highest priority)
2. `~/.claude/claude-statusline.json` — User-level (default write location)

---

## Wizard Mode (no arguments)

Guide the user through setup step-by-step using AskUserQuestion:

### Step 1: Choose Theme
First, render all 10 themes in the terminal so the user can see actual colors:

```bash
node "${CLAUDE_SKILL_DIR}/../../scripts/showcase.js" 2>/dev/null | head -13
```

Then list all 10 themes with AskUserQuestion (no preview needed — the user already saw colors above). User selects one (or Enter to skip and use default).

### Step 2: Choose Bar Style
Show block / dot / line / braille options.

### Step 3: Choose Separator
Show powerline / rounded / slash / minimal / none options.

### Step 4: Rate Limit Settings
Ask whether to show rate-limit segment, 5h/7d/both, show bar and reset time.

### Step 5: Custom Colors (optional)
Ask if user wants custom colors. Yes → list 12 keys to customize. No → skip.

### Step 6: Preview + Confirm
Show the complete config JSON for user to review and confirm before writing.
After confirmation, rebuild:

```bash
cd "${CLAUDE_SKILL_DIR}/../.." && npm run build
```

---

## Quick Edit Mode (with arguments)

### Workflow

1. **Parse intent**: Determine which fields to change from `$ARGUMENTS`
2. **Read existing config**:
   - Try `./.claude-statusline.json` first
   - Then `~/.claude/claude-statusline.json`
   - Fall back to empty object `{}`
3. **Validate input**:
   - Theme must be one of 10 valid values
   - Separator must be one of 5 valid values
   - Bar style must be one of 4 valid values
   - Colors must be `#RGB` or `#RRGGBB`
   - Segment names must be one of 8 valid values
4. **Merge config**: Only modify specified fields, preserve the rest
5. **Write config**: Default to `~/.claude/claude-statusline.json` (user-level)
6. **Rebuild**:
```bash
cd "${CLAUDE_SKILL_DIR}/../.." && npm run build
```
7. **Report**: List changed fields

### Common Intent Mapping

| User Says | Field Modified |
|-----------|---------------|
| `dracula` / `theme dracula` / `switch to X` | `theme` |
| `dot` / `bar style dot` | `barStyle` |
| `powerline` / `separator powerline` | `separator` |
| `X + Y + Z` (joined with +) | Multiple fields (auto-detect which field each value belongs to) |
| `Opus color #FF6B6B` | `colors.opus` |
| `disable rate-limit` | `segments.rate-limit.enabled = false` |
| `hide git` | `segments.git.enabled = false` |
| `show worktree` | `segments.worktree.enabled = true` |
| `disable 7d` | `segments.rate-limit.showSevenDay = false` |
| `responsive off` | `responsive = false` |

### Combo Syntax

Support `+` to combine multiple settings, auto-detecting field type:
- `dracula + dot + powerline` → theme=dracula, barStyle=dot, separator=powerline
- `nord + line + rounded` → theme=nord, barStyle=line, separator=rounded

---

## View Mode

Read current config file and display:
- Config file path in use
- All non-default settings
- Enabled/disabled status for each segment

---

## Reset Mode

Delete config file (after confirmation), restoring defaults:

```json
{
  "theme": "default",
  "colorMode": "auto",
  "separator": "none",
  "barStyle": "block",
  "responsive": true,
  "colors": {}
}
```

Rebuild after reset.

---

## Notes

- All changes only affect config files, never source code
- Rebuild command: `cd "${CLAUDE_SKILL_DIR}/../.." && npm run build`
- Color validation: must match `/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/`
- Respond in the user's language
