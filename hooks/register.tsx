import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Herdr, Os, Where } from '../types'
import { layoutOf } from './style'
import type { Run, Style } from './style'
import { herdrOf, osOf, placeOf, repoOf } from './where'

const where = atom({ plugin: 'session-band', key: 'where' } as const, null)

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

export const register: Register = (on, options) => {
  const style: Style = options.style === 'bookends' ? 'bookends' : 'tree'

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await refresh($)
    return started
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId === undefined) await refresh($)
    return done
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const at = await read($, where)
    if (e.props.hasSurvey || at === null) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const draw = (runs: Run[]) =>
      runs.map((r, i) => (
        <Text key={String(i)} color={r.color} backgroundColor={r.bg} bold={r.bold}>{r.text}</Text>
      ))
    const layout = layoutOf(style, at)

    if (layout.kind === 'ends') {
      return (
        <Box justifyContent="space-between" width="100%">
          <Text wrap="truncate">{draw(layout.left)}</Text>
          {layout.right.length === 0 ? null : <Text wrap="truncate">{draw(layout.right)}</Text>}
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
