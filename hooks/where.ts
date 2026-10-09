import type { Where } from '../types'

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
