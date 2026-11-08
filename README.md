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
`nerd` or `unicode`. Both are stored in `settings.json` under
`pluginConfigs["session-band@moneymike-plugins"].options`, and the band redraws as soon as it changes.

## Develop

```
claude plugin validate .
claude plugin test .
claude --plugin-dir .
```
