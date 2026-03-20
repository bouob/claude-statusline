---
name: customize
description: "This skill should be used when the user asks to customize claude-statusline appearance, or mentions: change theme, switch theme, bar style, separator, statusline colors, dracula, nord, catppuccin, hide segment, show segment, rate-limit settings, statusline reset."
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
| Contains "reset", "default", "restore" | Reset — delete config, restore defaults |
| Other text | Quick edit — parse intent and update fields |

---

## Config files

Priority order (first found wins on read; user-level is default write target):

1. `./.claude-statusline.json` — project-level
2. `~/.claude/claude-statusline.json` — user-level

## Valid values

Read valid themes, separators, bar styles, color keys, and segment names from the source:
- Themes: `${CLAUDE_SKILL_DIR}/../../src/config/themes/` (one file per theme)
- Defaults: `${CLAUDE_SKILL_DIR}/../../src/config/defaults.ts`
- Types: `${CLAUDE_SKILL_DIR}/../../src/config/types.ts`

Color format: `#RGB` or `#RRGGBB` (hex). Validate with `/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/`.

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

### Step 5: Custom colors (optional)

Ask if the user wants custom colors. Yes → list color keys to customize. No → skip.

### Step 6: Preview and confirm

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
| `disable rate-limit` | `segments.rate-limit.enabled = false` |
| `hide git` / `show worktree` | `segments.<name>.enabled` |
| `disable 7d` | `segments.rate-limit.showSevenDay = false` |

Combo syntax: `dracula + dot + powerline` sets three fields at once.

---

## View mode

Read the active config file and display:
- Config file path in use
- All non-default settings
- Enabled/disabled status for each segment

---

## Reset mode

Confirm with the user, then delete the config file to restore defaults. Rebuild after reset.

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
