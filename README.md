# session-band

A Claude Code mod that draws one line above the prompt, so you can tell at a
glance which machine and project a session belongs to:

```
computer michaels-macbook-air  workspace home  project homelab
```

- **computer** is the short hostname, lowercased.
- **workspace** is the `<x>_workspace` folder in the repo's path, shown as `x`
  (`-` when there is none).
- **project** is the folder directly beneath the workspace, or the repo's own
  name outside one. A git worktree resolves to its main checkout, so a
  worktree stored anywhere still names its repo.

The band refreshes at session start and after every turn.

## Install

```
/plugin marketplace add moneymikeMD/moneymike-plugins
/plugin install session-band@moneymike-plugins
```

## Develop

```
claude plugin validate .
claude plugin test .
claude --plugin-dir .
```
