import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Herdr, Os, Stats, Where } from '../types'
import { layoutOf } from './style'
import type { IconChoice, Run, Style } from './style'
import { herdrOf, osOf, placeOf, repoOf } from './where'

const where = atom({ plugin: 'session-band', key: 'where' } as const, null)
const stats = atom({ plugin: 'session-band', key: 'stats' } as const, null)

async function herdrCall($: EngineInterface, bin: string, argv: string[]): Promise<string> {
  try {
    const { exitCode, stdout } = await $.process.run([bin, ...argv], { timeoutMs: 5000 })
    return exitCode === 0 ? stdout : ''
  } catch {
    return ''
  }
}

async function locateHerdr($: EngineInterface): Promise<Herdr | null> {
  const [workspace, tab, pane, bin] = await Promise.all([
    $.env.get('HERDR_WORKSPACE_ID'),
    $.env.get('HERDR_TAB_ID'),
    $.env.get('HERDR_PANE_ID'),
    $.env.get('HERDR_BIN_PATH'),
  ])
  if (!workspace) return null
  const herdr = bin || 'herdr'
  const [tabGet, agentGet] = await Promise.all([
    tab ? herdrCall($, herdr, ['tab', 'get', tab]) : '',
    pane ? herdrCall($, herdr, ['agent', 'get', pane]) : '',
  ])
  return herdrOf(workspace, tabGet, agentGet)
}

async function locateOs($: EngineInterface): Promise<Os> {
  const uname = await herdrCall($, 'uname', ['-s'])
  const release = uname.trim() === 'Linux' ? await herdrCall($, 'cat', ['/etc/os-release']) : ''
  return osOf(uname, release)
}

async function locate($: EngineInterface): Promise<Where> {
  const [label, host, root, herdr, os] = await Promise.all([
    $.env.get('HERDR_MACHINE'),
    $.process.run(['hostname', '-s']),
    $.session.root(),
    locateHerdr($),
    locateOs($),
  ])
  const git = await $.process.run(
    ['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'],
    { cwd: root },
  )
  const repo = git.exitCode === 0 ? repoOf(git.stdout.trim()) : root
  const computer = label || host.stdout.trim().toLowerCase()
  return { computer, os, ...placeOf(repo), herdr }
}

async function refresh($: EngineInterface): Promise<void> {
  const found = await locate($)
  await update($, where, () => found)
}

/** `full` also reads the auto-compact threshold; a light read keeps the one already held. */
async function measure($: EngineInterface, full: boolean, compacted = 0): Promise<void> {
  try {
    const [usage, now] = await Promise.all([
      $.session.usage(full ? { breakdown: 'summary' } : undefined),
      $.clock.now(),
    ])
    const b = usage.context.breakdown
    await update($, stats, (prev: Stats | null): Stats => ({
      used: usage.context.tokens ?? null,
      window: usage.context.window,
      threshold: b ? (b.isAutoCompactEnabled ? b.autoCompactThreshold ?? null : null) : prev?.threshold ?? null,
      limits: usage.rateLimits.map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt ?? null })),
      usd: usage.cost?.usd ?? null,
      startedAt: usage.startedAt,
      now,
      compactions: (prev?.compactions ?? 0) + compacted,
    }))
  } catch {
    return
  }
}

export const register: Register = (on, options) => {
  const style: Style = options.style === 'bookends' ? 'bookends' : 'tree'
  const icons: IconChoice = options.icons === 'nerd' || options.icons === 'unicode' ? options.icons : 'auto'
  const hasStats = options.stats !== 'off'

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await refresh($)
    if (hasStats) await measure($, true)
    return started
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId === undefined) {
      await refresh($)
      if (hasStats) await measure($, true)
    }
    return done
  })

  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    if (hasStats && e.agentId === undefined) await measure($, false)
    return result
  })

  on('session.compact', async ($, e, next) => {
    const result = await next(e)
    if (hasStats && e.agentId === undefined && e.trigger !== 'precompute' && result.messages) await measure($, true, 1)
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const at = await read($, where)
    if (e.props.hasSurvey || at === null) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const draw = (runs: Run[]) =>
      runs.map((r, i) => (
        <Text key={String(i)} color={r.color} backgroundColor={r.bg} bold={r.bold}>{r.text}</Text>
      ))
    const layout = layoutOf(style, at, icons, hasStats ? await read($, stats) : null)

    if (layout.kind === 'ends') {
      return (
        <Box flexDirection="column" width="100%">
          <Box justifyContent="space-between" width="100%">
            <Text wrap="truncate">{draw(layout.left)}</Text>
            {layout.right.length === 0 ? null : <Text wrap="truncate">{draw(layout.right)}</Text>}
          </Box>
          {layout.below === undefined ? null : <Text wrap="truncate">{draw(layout.below)}</Text>}
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        {layout.rows.map((row, i) => <Text key={String(i)} wrap="truncate">{draw(row)}</Text>)}
      </Box>
    )
  })
}
