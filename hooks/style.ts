import type { Os, Where } from '../types'

/** One stretch of the band drawn in a single style. */
export type Run = { text: string; color?: string; bg?: string; bold?: boolean }

/** `rows` stacks lines top to bottom; `ends` pins one group left and one right. */
export type Layout = { kind: 'rows'; rows: Run[][] } | { kind: 'ends'; left: Run[]; right: Run[] }

export type Style = 'tree' | 'bookends'

export type Icons = 'nerd' | 'unicode'

export type IconChoice = 'auto' | Icons

type Glyphs = Record<Os | 'home' | 'repo' | 'herdr' | 'tab' | 'agent' | 'arrowRight' | 'arrowLeft', string>

export const GLYPHS: Record<Icons, Glyphs> = {
  nerd: {
    mac: '',
    ubuntu: '',
    linux: '',
    other: '',
    home: '',
    repo: '',
    herdr: '',
    tab: '\u{F04E9}',
    agent: '\u{F06A9}',
    arrowRight: '',
    arrowLeft: '',
  },
  unicode: {
    mac: '◉',
    ubuntu: '◉',
    linux: '◉',
    other: '◉',
    home: '⌂',
    repo: '◆',
    herdr: '❖',
    tab: '▸',
    agent: '✦',
    arrowRight: '▌',
    arrowLeft: '▐',
  },
}

/** herdr 0.9.5 draws Nerd Font private-use glyphs as boxes, so `auto` uses plain Unicode inside a herdr pane. */
export function iconsFor(choice: IconChoice, at: Where): Icons {
  if (choice !== 'auto') return choice
  return at.herdr === null ? 'nerd' : 'unicode'
}

export type Family = { name: string; hue: string; segment: string }

const FAMILIES: readonly Family[] = [
  { name: 'coral', hue: '#ec7356', segment: '#a83d27' },
  { name: 'violet', hue: '#9b7bf0', segment: '#5a3fb0' },
  { name: 'sky', hue: '#4ea3ea', segment: '#235da3' },
  { name: 'teal', hue: '#22b3a1', segment: '#137266' },
]

const COLOR = {
  workspace: '#22b3a1',
  project: '#9b7bf0',
  herdr: '#e0794a',
  tab: '#d9a23b',
  agent: '#d9559b',
  workspaceSegment: '#2b6f8f',
  slate: '#3a3f4b',
  tabSegment: '#8a5a2b',
  agentSegment: '#b5612a',
  onSegment: '#ffffff',
} as const

/** A machine's color family, fixed by an FNV-1a hash of its name. */
export function familyOf(computer: string): Family {
  let n = 2166136261
  for (const ch of computer) n = Math.imul(n ^ ch.charCodeAt(0), 16777619) >>> 0
  return FAMILIES[n % FAMILIES.length]!
}

type Segment = { bg: string; text: string; bold?: boolean }

function chainRight(segments: Segment[], sep: string): Run[] {
  return segments.flatMap((s, i) => [
    { text: ` ${s.text} `, color: COLOR.onSegment, bg: s.bg, bold: s.bold },
    { text: sep, color: s.bg, bg: segments[i + 1]?.bg },
  ])
}

function chainLeft(segments: Segment[], sep: string): Run[] {
  return segments.flatMap((s, i) => [
    { text: sep, color: s.bg, bg: segments[i - 1]?.bg },
    { text: ` ${s.text} `, color: COLOR.onSegment, bg: s.bg, bold: s.bold },
  ])
}

/** Colored icons on one row; inside herdr a bracket in the machine's color adds a second row for the pane. */
export function tree(at: Where, icons: Icons = 'nerd'): Layout {
  const g = GLYPHS[icons]
  const branch = familyOf(at.computer).hue
  const h = at.herdr
  const top: Run[] = [
    { text: h ? '╭─ ' : '── ', color: branch },
    { text: `${g[at.os]} ${at.computer}`, color: branch },
    { text: '  ' },
    { text: `${g.home} ${at.workspace}`, color: COLOR.workspace },
    { text: '  ' },
    { text: `${g.repo} ${at.project}`, color: COLOR.project, bold: true },
  ]
  if (h === null) return { kind: 'rows', rows: [top] }
  const pane: Run[] = [
    { text: '╰─ ', color: branch },
    { text: `${g.herdr} ${h.workspace}`, color: COLOR.herdr },
    ...(h.tab === undefined ? [] : [{ text: '  ' }, { text: `${g.tab} ${h.tab}`, color: COLOR.tab }]),
    ...(h.agent === undefined ? [] : [{ text: '  ' }, { text: `${g.agent} ${h.agent}`, color: COLOR.agent }]),
  ]
  return { kind: 'rows', rows: [top, pane] }
}

/** Powerline segments: where you are pointing right from the left edge, herdr pointing left from the right edge. */
export function bookends(at: Where, icons: Icons = 'nerd'): Layout {
  const g = GLYPHS[icons]
  const left = chainRight([
    { bg: familyOf(at.computer).segment, text: `${g[at.os]} ${at.computer}` },
    { bg: COLOR.workspaceSegment, text: `${g.home} ${at.workspace}` },
    { bg: COLOR.slate, text: `${g.repo} ${at.project}`, bold: true },
  ], g.arrowRight)
  const h = at.herdr
  if (h === null) return { kind: 'ends', left, right: [] }
  const right = chainLeft([
    { bg: COLOR.slate, text: `${g.herdr} ${h.workspace}` },
    ...(h.tab === undefined ? [] : [{ bg: COLOR.tabSegment, text: `${g.tab} ${h.tab}` }]),
    ...(h.agent === undefined ? [] : [{ bg: COLOR.agentSegment, text: `${g.agent} ${h.agent}` }]),
  ], g.arrowLeft)
  return { kind: 'ends', left, right }
}

export function layoutOf(style: Style, at: Where, choice: IconChoice = 'auto'): Layout {
  const icons = iconsFor(choice, at)
  return style === 'bookends' ? bookends(at, icons) : tree(at, icons)
}
