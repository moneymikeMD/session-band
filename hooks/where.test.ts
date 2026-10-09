import { expect, test } from 'claude-code/testing'

import { placeOf, repoOf } from './where'

test('reads workspace and project from the repo path', () => {
  expect(placeOf('/Users/m/code/home_workspace/homelab')).toEqual({ workspace: 'home', project: 'homelab' })
  expect(placeOf('/Users/m/code/home_exp_workspace/acme-widgets')).toEqual({ workspace: 'home_exp', project: 'acme-widgets' })
  expect(placeOf('/Users/m/code/home_workspace')).toEqual({ workspace: 'home', project: '-' })
  expect(placeOf('/Users/m/dotfiles')).toEqual({ workspace: '-', project: 'dotfiles' })
})

test('a worktree resolves to its main checkout', () => {
  expect(repoOf('/Users/m/code/home_workspace/homelab/.git')).toBe('/Users/m/code/home_workspace/homelab')
  expect(placeOf(repoOf('/Users/m/code/home_workspace/homelab/.git')).project).toBe('homelab')
})
