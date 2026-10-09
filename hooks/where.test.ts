import { expect, test } from 'claude-code/testing'

import { agentNameOf, herdrOf, placeOf, repoOf, tabLabelOf } from './where'

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

const tabGet = (label: string, number: number) =>
  JSON.stringify({ id: 'cli:tab:get', result: { tab: { label, number, tab_id: 'w1:t1' }, type: 'tab_info' } })
const agentGet = (name: string | null) =>
  JSON.stringify({ id: 'cli:agent:get', result: { agent: { name, pane_id: 'w1:p1' }, type: 'agent_info' } })

test('herdr tab label shows only when renamed from its default number', () => {
  expect(tabLabelOf(tabGet('1', 1))).toBeUndefined()
  expect(tabLabelOf(tabGet('3', 3))).toBeUndefined()
  expect(tabLabelOf(tabGet('review', 1))).toBe('review')
  expect(tabLabelOf('')).toBeUndefined()
})

test('herdr agent name shows only when set', () => {
  expect(agentNameOf(agentGet(null))).toBeUndefined()
  expect(agentNameOf(agentGet('proj-48'))).toBe('proj-48')
  expect(agentNameOf('not json')).toBeUndefined()
})

test('herdr block always carries the workspace id', () => {
  expect(herdrOf('w1', tabGet('1', 1), agentGet(null))).toEqual({ workspace: 'w1' })
  expect(herdrOf('w1', tabGet('review', 1), agentGet('proj-48'))).toEqual({ workspace: 'w1', tab: 'review', agent: 'proj-48' })
  expect(herdrOf('w1', '', '')).toEqual({ workspace: 'w1' })
})
