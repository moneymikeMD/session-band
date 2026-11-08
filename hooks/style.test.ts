import { expect, test } from 'claude-code/testing'

import type { Where } from '../types'
import { GLYPHS, bookends, familyOf, iconsFor, layoutOf, tree } from './style'
import { osOf } from './where'

const mac: Where = {
  computer: 'michaels-macbook-air', os: 'mac', workspace: 'home', project: 'homelab',
  herdr: { workspace: 'w1', tab: 'review', agent: 'proj-48' },
}
const desktop: Where = { computer: 'mike-desktop-l', os: 'ubuntu', workspace: 'home', project: 'night-watchman', herdr: null }
const GLYPH = GLYPHS.nerd
const U = GLYPHS.unicode
const text = (runs: { text: string }[]) => runs.map(r => r.text).join('')

test('the owner\'s three machines get three different colors', () => {
  const names = ['michaels-macbook-air', 'mike-desktop-l', 'hetricus'].map(n => familyOf(n).name)
  expect(names).toEqual(['violet', 'teal', 'coral'])
})

test('os comes from uname, with ubuntu read from os-release', () => {
  expect(osOf('Darwin\n', '')).toBe('mac')
  expect(osOf('Linux\n', 'NAME="Ubuntu"\nID=ubuntu\nID_LIKE=debian\n')).toBe('ubuntu')
  expect(osOf('Linux\n', 'ID="fedora"\n')).toBe('linux')
  expect(osOf('FreeBSD', '')).toBe('other')
})

test('tree stays one row outside herdr and grows a pane row inside it', () => {
  const one = tree(desktop)
  expect(one.kind === 'rows' && one.rows.length).toBe(1)
  expect(one.kind === 'rows' && text(one.rows[0]!)).toBe(`── ${GLYPH.ubuntu} mike-desktop-l  ${GLYPH.home} home  ${GLYPH.repo} night-watchman`)

  const two = tree(mac, 'nerd')
  expect(two.kind === 'rows' && two.rows.length).toBe(2)
  expect(two.kind === 'rows' && text(two.rows[1]!)).toBe(`╰─ ${GLYPH.herdr} w1  ${GLYPH.tab} review  ${GLYPH.agent} proj-48`)
})

test('tree drops a herdr tab or agent that is not set', () => {
  const bare = tree({ ...mac, herdr: { workspace: 'w2' } }, 'nerd')
  expect(bare.kind === 'rows' && text(bare.rows[1]!)).toBe(`╰─ ${GLYPH.herdr} w2`)
})

test('bookends separators take the color of the segment behind them and the background of the next', () => {
  const b = bookends(mac, 'nerd')
  if (b.kind !== 'ends') throw new Error('expected ends')
  const arrows = b.left.filter(r => r.text === GLYPH.arrowRight)
  expect(arrows.length).toBe(3)
  expect(arrows[0]!.bg).toBe(b.left[2]!.bg)
  expect(arrows[2]!.bg).toBeUndefined()
  expect(b.right.filter(r => r.text === GLYPH.arrowLeft).length).toBe(3)
  expect(b.right[0]!.bg).toBeUndefined()
})

test('bookends has an empty right side outside herdr', () => {
  const b = bookends(desktop)
  expect(b.kind === 'ends' && b.right).toEqual([])
})

test('tree is the default style', () => {
  expect(layoutOf('tree', mac).kind).toBe('rows')
  expect(layoutOf('bookends', mac).kind).toBe('ends')
})

test('auto icons are plain Unicode inside herdr and Nerd Font outside it', () => {
  expect(iconsFor('auto', mac)).toBe('unicode')
  expect(iconsFor('auto', desktop)).toBe('nerd')
  expect(iconsFor('nerd', mac)).toBe('nerd')
  expect(iconsFor('unicode', desktop)).toBe('unicode')
})

test('unicode icons hold no private-use characters', () => {
  for (const g of Object.values(U)) {
    for (const ch of g) expect(ch.codePointAt(0)! < 0xe000 || ch.codePointAt(0)! > 0xf8ff).toBe(true)
  }
  const t = layoutOf('tree', mac, 'auto')
  expect(t.kind === 'rows' && text(t.rows[1]!)).toBe(`╰─ ${U.herdr} w1  ${U.tab} review  ${U.agent} proj-48`)
  const b = layoutOf('bookends', mac, 'auto')
  expect(b.kind === 'ends' && b.left.filter(r => r.text === U.arrowRight).length).toBe(3)
})
