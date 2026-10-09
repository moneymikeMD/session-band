import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Herdr, Where } from '../types'
import { herdrOf, placeOf, repoOf } from './where'

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

async function locate($: EngineInterface): Promise<Where> {
  const [host, root, herdr] = await Promise.all([
    $.process.run(['hostname', '-s']),
    $.session.root(),
    locateHerdr($),
  ])
  const git = await $.process.run(
    ['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'],
    { cwd: root },
  )
  const repo = git.exitCode === 0 ? repoOf(git.stdout.trim()) : root
  return { computer: host.stdout.trim().toLowerCase(), ...placeOf(repo), herdr }
}

async function refresh($: EngineInterface): Promise<void> {
  const found = await locate($)
  await update($, where, () => found)
}

export const register: Register = on => {
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
    const herdr = at.herdr

    return (
      <Box>
        <Text wrap="truncate">
          <Text dimColor>computer </Text>
          <Text bold color="suggestion">{at.computer}</Text>
          <Text dimColor>  workspace </Text>
          <Text bold color="warning">{at.workspace}</Text>
          <Text dimColor>  project </Text>
          <Text bold color="success">{at.project}</Text>
          {herdr == null ? null : (
            <Text>
              {'  '}
              <Text inverse color="claude">
                <Text bold> herdr </Text>
                {' workspace '}
                <Text bold>{herdr.workspace}</Text>
                {herdr.tab === undefined ? null : <Text>{'  tab '}<Text bold>{herdr.tab}</Text></Text>}
                {herdr.agent === undefined ? null : <Text>{'  agent '}<Text bold>{herdr.agent}</Text></Text>}
                {' '}
              </Text>
            </Text>
          )}
        </Text>
      </Box>
    )
  })
}
