import { expect, test } from 'claude-code/testing'

import type { Stats } from '../types'
import { span, statsRow, thresholdOf, tokens } from './stats'
import { bookends, tree } from './style'
import type { Where } from '../types'

const at: Where = { computer: 'mike-desktop-l', os: 'ubuntu', workspace: 'home', project: 'session-band', herdr: null }
const base: Stats = {
  used: 52_000, window: 200_000, threshold: 80_000, usd: 3.42, startedAt: 0, now: 72 * 60_000, compactions: 2,
  limits: [
    { kind: 'five_hour', percentUsed: 41, resetsAt: new Date(202 * 60_000).toISOString() },
    { kind: 'seven_day', percentUsed: 18, resetsAt: null },
  ],
}
const text = (runs: { text: string }[]) => runs.map(r => r.text).join('')

test('the row reads as the gauge, limits, cost, age and compactions', () => {
  expect(text(statsRow(base))).toBe('ctx 52k/80k ▰▰▰▰▰▰▰▱▱▱  ·  5h 41% ↻2h10m  ·  7d 18%  ·  $3.42  ·  1h12m  ·  ⟳ 2')
})

test('the gauge fills toward the auto-compact threshold and changes color on the way', () => {
  const color = (used: number) => statsRow({ ...base, used })[0]!.color
  expect(color(40_000)).toBe('#22b3a1')
  expect(color(60_000)).toBe('#d9a23b')
  expect(color(76_000)).toBe('#ec7356')
})

test('CLAUDE_AUTOCOMPACT_PCT_OVERRIDE caps the reported threshold at that share of the window', () => {
  expect(thresholdOf(967_000, 1_000_000, '40')).toBe(400_000)
  expect(thresholdOf(967_000, 1_000_000, undefined)).toBe(967_000)
  expect(thresholdOf(967_000, 1_000_000, 'junk')).toBe(967_000)
  expect(thresholdOf(null, 1_000_000, '40')).toBe(null)
})

test('with auto-compaction off the gauge measures the model window', () => {
  expect(statsRow({ ...base, threshold: null })[0]!.text).toContain('52k/200k')
})

test('a window with no response yet shows a dash, and no compactions shows no count', () => {
  const row = text(statsRow({ ...base, used: null, compactions: 0 }))
  expect(row).toContain('ctx –/80k ▱▱▱▱▱▱▱▱▱▱')
  expect(row).not.toContain('⟳')
})

test('tokens and spans keep to short forms', () => {
  expect(tokens(1_200_000)).toBe('1.2M')
  expect(span(12 * 60_000)).toBe('12m')
  expect(span(76 * 3_600_000)).toBe('3d4h')
})

test('tree brackets the stats row outside herdr, bookends puts it beneath', () => {
  const t = tree(at, 'unicode', base)
  expect(t.kind === 'rows' && t.rows.map(r => r[0]!.text)).toEqual(['╭─ ', '╰─ '])
  const b = bookends(at, 'unicode', base)
  expect(b.kind === 'ends' && text(b.below ?? [])).toContain('ctx 52k/80k')
})
