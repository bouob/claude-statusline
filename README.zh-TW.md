# claude-statusline

零依賴的 [Claude Code](https://code.claude.com/) 狀態列，具備條件式彩虹進度條、10 種主題、速率限制監控，以及自然語言設定功能。

[English](./README.md)

![showcase](./images/showcase.jpg)

## 功能特色

- **速率限制監控** — 5 小時 / 7 天配額用量，含 mini 進度條與重置倒數（Claude Code 2.1.80+ 原生 stdin，舊版 OAuth 降級）
- **條件式彩虹** — 進度條在高 context 使用率時自動切換為彩虹漸層
- **10 種主題** — default、rainbow、nord、catppuccin、dracula、gruvbox、tokyo-night、solarized、one-dark、monokai
- **12 個段落** — 模型、context 進度條、session（時長 + 費用）、git、專案、worktree、速率限制、promotion、status、PR 審查狀態、agent、effort
- **4 種進度條樣式** — 方塊 `████░░░░`、圓點 `●●●●○○○○`、細線 `━━━━┅┅┅┅`、點陣 `⣿⣿⣿⣿⠀⠀⠀⠀`
- **5 種分隔符** — powerline、rounded、slash、minimal、none
- **18 個自訂顏色** — 以 hex 值覆寫任意色彩
- **自適應排版** — 終端寬度不足時自動隱藏低優先級段落
- **自然語言設定** — 透過 `/claude-statusline:customize dracula + dot + powerline` 直接設定
- **促銷段落** — 限時功能：在促銷活動期間顯示 1x/2x context 倍率與尖峰/離峰倒數

## 前置需求

- [Claude Code](https://code.claude.com/) v1.0.33+
- [Node.js](https://nodejs.org/) v18+

## 安裝方式

### Claude Code Plugin（推薦）

```bash
# 1. 透過 bouob-plugins marketplace（推薦）
/plugin marketplace add bouob/claude-plugins
/plugin install claude-statusline@bouob-plugins

#    或直接從本 repo 安裝
/plugin marketplace add bouob/claude-statusline
/plugin install claude-statusline@claude-statusline

# 2. 重新載入 plugin
/reload-plugins

# 3. 執行 setup（自動寫入 ~/.claude/settings.json）
/claude-statusline:setup

# 4. 重啟 Claude Code
```

### 手動安裝

```bash
git clone https://github.com/bouob/claude-statusline.git
cd claude-statusline
npm install && npm run build
node scripts/setup.js
# 重啟 Claude Code
```

## 視覺模式

進度條會根據 context 使用率自動變化：

| 條件 | 模式 | 視覺效果 |
|------|------|----------|
| Context < 70% | `normal` | 低調主題色 |
| Context 70–85% | `warning` | 黃色系 |
| Context 85–90% | `critical` | 紅色系 |
| Context > 90% | `rainbow` | 逐字元彩虹漸層 |

## 主題

| 主題 | 風格 |
|------|------|
| `default` | 低調 cyan |
| `rainbow` | 粉紫色系 |
| `nord` | 北歐冷色 |
| `catppuccin` | Mocha 暖色 |
| `dracula` | 深紫藍色調 |
| `gruvbox` | 復古暖色 |
| `tokyo-night` | 東京夜色藍紫 |
| `solarized` | 經典 Solarized Dark |
| `one-dark` | Atom One Dark |
| `monokai` | Sublime Monokai |

## 可用指令

| 指令 | 用途 |
|------|------|
| `/claude-statusline:setup` | 將 statusline 註冊到 `~/.claude/settings.json` |
| `/claude-statusline:customize` | 互動式精靈或快速編輯（如 `dracula + dot + powerline`） |
| `/claude-statusline:customize show` | 檢視目前設定 |

## 設定方式

### Plugin Skill（推薦）

使用自然語言設定，不需手動編輯 JSON：

```
/claude-statusline:customize dracula + dot + powerline
/claude-statusline:customize show current
/claude-statusline:customize reset
```

不帶參數執行可進入互動式設定精靈：

```
/claude-statusline:customize
```

### 設定檔

設定檔依以下優先順序載入：

1. `./.claude-statusline.json` — 專案層級（最高優先，依 session 的 `project_dir` 解析）
2. `~/.claude/claude-statusline.json` — 使用者層級

```json
{
  "theme": "dracula",
  "separator": "powerline",
  "barStyle": "dot",
  "responsive": true,
  "colors": {
    "opus": "#FF79C6"
  },
  "segments": {
    "rate-limit": {
      "enabled": true,
      "showFiveHour": true,
      "showSevenDay": true,
      "showResetTime": true
    }
  },
  "rainbow": {
    "contextThreshold": 90,
    "alwaysOn": false
  }
}
```

只需填入要覆寫的欄位，其餘沿用主題預設值。

<details>
<summary>完整設定參考</summary>

```json
{
  "theme": "default",
  "colorMode": "auto",
  "separator": "none",
  "barStyle": "block",
  "responsive": true,
  "colors": {},
  "layout": {
    "lines": 2,
    "line1": ["model", "effort", "agent", "project", "git", "pr", "worktree", "promotion"],
    "line2": ["context-bar", "session", "rate-limit", "status"]
  },
  "segments": {
    "context-bar": { "enabled": true, "width": 20, "showPercentage": true },
    "session": { "enabled": true, "showCost": true, "showDuration": true, "showLines": false },
    "git": { "enabled": true },
    "project": { "enabled": true },
    "model": { "enabled": true },
    "worktree": { "enabled": true },
    "pr": { "enabled": true },
    "agent": { "enabled": true },
    "effort": { "enabled": true, "showThinking": true },
    "rate-limit": {
      "enabled": true,
      "cacheSeconds": 60,
      "barWidth": 8,
      "barStyle": "inherit",
      "showFiveHour": true,
      "showSevenDay": true,
      "showResetTime": true,
      "showBar": true,
      "rainbow": false
    },
    "promotion": { "enabled": true },
    "status": { "enabled": true, "cacheTtlSeconds": 300 }
  },
  "rainbow": {
    "contextThreshold": 90,
    "onAgent": false,
    "onWorktree": false,
    "alwaysOn": false
  }
}
```

</details>

### 自動刷新 Refresh Interval

> 需要 Claude Code **v2.1.97+**

預設情況下 Claude Code 只會在每個回合結束後呼叫一次 statusline，因此 context bar、rate-limit、session 時長等動態段落在長回合的中途不會更新。若想讓 statusline 定期重繪，在 `~/.claude/settings.json` 加入 `refreshInterval`：

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /path/to/claude-statusline/dist/index.js",
    "refreshInterval": 30
  }
}
```

`refreshInterval` 單位為秒，建議值 `30` — 兼顧動態更新的即時性與每次重啟的開銷（約 50–100 ms/次）。

注意：`refreshInterval` 屬於 **Claude Code 核心設定**，不是 plugin 設定 — 它放在 `settings.json`，不是 `claude-statusline.json`。首次安裝時 setup 腳本會寫入 `refreshInterval: 30`；若你已自行設定，腳本會保留原值不覆蓋。

### 自訂顏色

可用 hex 值（`#RGB` 或 `#RRGGBB`）覆寫 18 個色彩 key：

`opus`、`sonnet`、`haiku`、`fable`、`mythos`、`progressNormal`、`progressWarning`、`progressCritical`、`progressEmpty`、`gitClean`、`gitDirty`、`worktree`、`project`、`session`、`resetTime`、`pr`、`agent`、`effort`

```json
{
  "colors": {
    "opus": "#FF6B6B",
    "progressNormal": "#50FA7B"
  }
}
```

覆蓋優先順序：`colors` 欄位 > 主題定義 > 預設值。

## 段落說明

| 段落 | 內容 |
|------|------|
| `model` | 模型名稱 + 顏色（Opus 紫 / Sonnet 藍 / Haiku 綠） |
| `context-bar` | 進度條 + 百分比（高使用率時彩虹漸層） |
| `session` | 時長 + 費用（開啟 `showLines` 可加顯示行數增減） |
| `git` | 分支名 + dirty 狀態（在該 session 的 `current_dir` 下執行） |
| `project` | 專案資料夾名稱 |
| `worktree` | Worktree 標籤（`git_worktree` / 頂層 `worktree` 欄位，路徑分歧為降級判斷） |
| `rate-limit` | 5h/7d 配額用量 + mini 進度條 + 重置倒數（原生 stdin，OAuth 降級） |
| `promotion` | 限時促銷標籤（未啟用時自動隱藏） |
| `status` | Claude 服務狀態指示器（快取） |
| `pr` | PR 編號 + 審查狀態（approved ✓ / changes requested ✗ / pending ○ / draft ◌） |
| `agent` | `--agent` session 顯示 agent 名稱 |
| `effort` | Reasoning effort 等級，extended thinking 開啟時附 ✦ 標記 |

> `pr`、`agent`、`effort` 需要較新版 Claude Code（約 v2.1.200+）。舊版沒有這些 stdin 欄位，段落會自動隱藏。
>
> `git` 段落反映各 session 自己的 `current_dir`，因此不同目錄或 worktree 的並行 session 會各自顯示正確分支。若兩個 session 共用同一目錄，該目錄仍只有一個 HEAD — 想讓每個 session 有自己的分支請使用 worktree。

## 解除安裝

從 `~/.claude/settings.json` 移除 `statusLine` 欄位，然後重啟 Claude Code。

## 授權條款

MIT
