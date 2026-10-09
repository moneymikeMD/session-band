import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Where } from '../types'
import { placeOf, repoOf } from './where'

const where = atom({ plugin: 'session-band', key: 'where' } as const, null)

async function locate($: EngineInterface): Promise<Where> {
  const [host, root] = await Promise.all([
    $.process.run(['hostname', '-s']),
    $.session.root(),
  ])
  const git = await $.process.run(
    ['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'],
    { cwd: root },
  )
  const repo = git.exitCode === 0 ? repoOf(git.stdout.trim()) : root
  return { computer: host.stdout.trim().toLowerCase(), ...placeOf(repo) }
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

    return (
      <Box>
        <Text wrap="truncate">
          <Text dimColor>computer </Text>
          <Text bold color="suggestion">{at.computer}</Text>
          <Text dimColor>  workspace </Text>
          <Text bold color="warning">{at.workspace}</Text>
          <Text dimColor>  project </Text>
          <Text bold color="success">{at.project}</Text>
        </Text>
      </Box>
    )
  })
}
