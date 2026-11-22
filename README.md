# session-band

A Claude Code mod that draws a band above the prompt, so you can tell at a glance which machine and project a session belongs to. It comes in two
styles, both drawn with [Nerd Font](https://www.nerdfonts.com/) icons.

**tree** (the default): colored icons on one row. Inside a herdr pane a bracket in the machine's color adds a second row for the pane.

```
╭─  michaels-macbook-air   home   homelab
╰─  w1  󰓩 review  󰚩 proj-48
```

**bookends**: powerline segments. Where you are points right from the left edge; the herdr pane points left from the right edge.

```
  michaels-macbook-air   home   homelab                 w1  󰓩 review  󰚩 proj-48 
```

- **computer** is `$HERDR_MACHINE` when set, the label other machines use for this one in `herdr --machine`; otherwise the short hostname, lowercased.
  Its icon follows the OS (macOS, Ubuntu, other Linux), and its color is fixed per machine by a hash of the name.
- **workspace** is the `<x>_workspace` folder in the repo's path, shown as `x` (`-` when there is none).
- **project** is the folder directly beneath the workspace, or the repo's own name outside one. A git worktree resolves to its main checkout, so a
  worktree stored anywhere still names its repo.
- **herdr** appears only inside a herdr pane (`HERDR_WORKSPACE_ID` set). It always shows the herdr workspace id; it adds the tab label once the tab is
  renamed from its default number, and the agent name once one is set.

The band refreshes at session start and after every turn.

## Session stats

A last row carries the session's figures. In `tree` it closes the bracket; in `bookends` it sits under the segments.

```
╭─  michaels-macbook-air   home   homelab
├─  w1  󰓩 review  󰚩 proj-48
╰─ ctx 52k/80k ▰▰▰▰▰▰▰▱▱▱  ·  5h 41% ↻2h10m  ·  7d 18%  ·  $3.42  ·  1h12m  ·  ⟳ 2
```

- **ctx** is the context in use over the token count auto-compaction runs at, so a full bar means a compaction is next. With auto-compaction off it
  measures the model's window instead. It turns amber at 60% and red at 85%, and shows `–` until the first response of a fresh or just-compacted window.
- **5h** and **7d** are the rate-limit windows, each with the time until it resets. They turn amber at 80% and red at 95%.
- **$** is the `/cost` estimate, then the session's age, then `⟳` with the compactions since the session started (hidden at 0).

The stats refresh after every tool call as well as every turn, so the gauge moves during a long turn. Set **Band stats** to `off` in `/config` to drop
the row.

## Install

```
/plugin marketplace add moneymikeMD/moneymike-plugins
/plugin install session-band@moneymike-plugins
```

Outside herdr the terminal needs a Nerd Font, Mono variant (for example `GoogleSansCode Nerd Font Mono`), or the icons and arrows draw as empty
boxes. Inside a herdr pane the band uses plain Unicode symbols instead (`◉ ⌂ ◆ ❖ ▸ ✦`, half blocks for the bookends edges), because herdr
0.9.5 draws Nerd Font private-use characters as boxes even when the terminal's font has them
([herdr#5201](https://github.com/herdrdev/herdr/issues/5201) is the same bug reported on Windows).

## Choosing a style

Open `/config` and set **Band style** to `tree` or `bookends`, and **Band icons** to `auto` (the default: Unicode inside herdr, Nerd Font elsewhere),
`nerd` or `unicode`. **Band stats** is `on` or `off`. All are stored in `settings.json` under
`pluginConfigs["session-band@moneymike-plugins"].options`, and the band redraws as soon as it changes.

## Develop

```
claude plugin validate .
claude plugin test .
claude --plugin-dir .
```
