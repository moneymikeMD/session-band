import type { Herdr, Where } from '../types'

/** Splits a repo path into workspace (`<x>_workspace` -> `x`) and the project directly beneath it. */
export function placeOf(repo: string): Pick<Where, 'workspace' | 'project'> {
  const parts = repo.split('/').filter(Boolean)
  const at = parts.findIndex(p => /_workspace$/.test(p))
  const root = parts[at]
  if (root === undefined) return { workspace: '-', project: parts[parts.length - 1] ?? '/' }
  return {
    workspace: root.replace(/_workspace$/, ''),
    project: parts[at + 1] ?? '-',
  }
}

/** The main checkout a git common dir belongs to, so a worktree anywhere names its repo. */
export function repoOf(commonDir: string): string {
  return commonDir.replace(/\/+$/, '').replace(/\/\.git$/, '')
}

function parse(json: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(json)
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function field(json: string, kind: string, key: string): unknown {
  const result = parse(json).result
  if (typeof result !== 'object' || result === null) return undefined
  const item = (result as Record<string, unknown>)[kind]
  if (typeof item !== 'object' || item === null) return undefined
  return (item as Record<string, unknown>)[key]
}

/** A tab's label from `herdr tab get`, or undefined while it is herdr's default (the tab's own number). */
export function tabLabelOf(tabGet: string): string | undefined {
  const label = field(tabGet, 'tab', 'label')
  const number = field(tabGet, 'tab', 'number')
  if (typeof label !== 'string' || label === '' || label === String(number)) return undefined
  return label
}

/** The agent's name from `herdr agent get`, or undefined when it has none. */
export function agentNameOf(agentGet: string): string | undefined {
  const name = field(agentGet, 'agent', 'name')
  return typeof name === 'string' && name !== '' ? name : undefined
}

export function herdrOf(workspace: string, tabGet: string, agentGet: string): Herdr {
  const tab = tabLabelOf(tabGet)
  const agent = agentNameOf(agentGet)
  return { workspace, ...(tab === undefined ? {} : { tab }), ...(agent === undefined ? {} : { agent }) }
}
