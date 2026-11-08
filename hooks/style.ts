import type { Os, Where } from '../types'

/** One stretch of the band drawn in a single style. */
export type Run = { text: string; color?: string; bg?: string; bold?: boolean }

/** `rows` stacks lines top to bottom; `ends` pins one group left and one right. */
export type Layout = { kind: 'rows'; rows: Run[][] } | { kind: 'ends'; left: Run[]; right: Run[] }

export type Style = 'tree' | 'bookends'

export const GLYPH = {
  apple: '',
  ubuntu: '',
  linux: '',
  server: '',
  home: '',
  repo: '',
  herdr: '',
  tab: '\u{F04E9}',
  agent: '\u{F06A9}',
  arrowRight: '',
  arrowLeft: '',
} as const

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

export function osGlyph(os: Os): string {
  return { mac: GLYPH.apple, ubuntu: GLYPH.ubuntu, linux: GLYPH.linux, other: GLYPH.server }[os]
}

type Segment = { bg: string; text: string; bold?: boolean }

function chainRight(segments: Segment[]): Run[] {
  return segments.flatMap((s, i) => [
    { text: ` ${s.text} `, color: COLOR.onSegment, bg: s.bg, bold: s.bold },
    { text: GLYPH.arrowRight, color: s.bg, bg: segments[i + 1]?.bg },
  ])
}

function chainLeft(segments: Segment[]): Run[] {
  return segments.flatMap((s, i) => [
    { text: GLYPH.arrowLeft, color: s.bg, bg: segments[i - 1]?.bg },
    { text: ` ${s.text} `, color: COLOR.onSegment, bg: s.bg, bold: s.bold },
  ])
}

/** Colored icons on one row; inside herdr a bracket in the machine's color adds a second row for the pane. */
export function tree(at: Where): Layout {
  const branch = familyOf(at.computer).hue
  const h = at.herdr
  const top: Run[] = [
    { text: h ? '╭─ ' : '── ', color: branch },
    { text: `${osGlyph(at.os)} ${at.computer}`, color: branch },
    { text: '  ' },
    { text: `${GLYPH.home} ${at.workspace}`, color: COLOR.workspace },
    { text: '  ' },
    { text: `${GLYPH.repo} ${at.project}`, color: COLOR.project, bold: true },
  ]
  if (h === null) return { kind: 'rows', rows: [top] }
  const pane: Run[] = [
    { text: '╰─ ', color: branch },
    { text: `${GLYPH.herdr} ${h.workspace}`, color: COLOR.herdr },
    ...(h.tab === undefined ? [] : [{ text: '  ' }, { text: `${GLYPH.tab} ${h.tab}`, color: COLOR.tab }]),
    ...(h.agent === undefined ? [] : [{ text: '  ' }, { text: `${GLYPH.agent} ${h.agent}`, color: COLOR.agent }]),
  ]
  return { kind: 'rows', rows: [top, pane] }
}

/** Powerline segments: where you are pointing right from the left edge, herdr pointing left from the right edge. */
export function bookends(at: Where): Layout {
  const left = chainRight([
    { bg: familyOf(at.computer).segment, text: `${osGlyph(at.os)} ${at.computer}` },
    { bg: COLOR.workspaceSegment, text: `${GLYPH.home} ${at.workspace}` },
    { bg: COLOR.slate, text: `${GLYPH.repo} ${at.project}`, bold: true },
  ])
  const h = at.herdr
  if (h === null) return { kind: 'ends', left, right: [] }
  const right = chainLeft([
    { bg: COLOR.slate, text: `${GLYPH.herdr} ${h.workspace}` },
    ...(h.tab === undefined ? [] : [{ bg: COLOR.tabSegment, text: `${GLYPH.tab} ${h.tab}` }]),
    ...(h.agent === undefined ? [] : [{ bg: COLOR.agentSegment, text: `${GLYPH.agent} ${h.agent}` }]),
  ])
  return { kind: 'ends', left, right }
}

export function layoutOf(style: Style, at: Where): Layout {
  return style === 'bookends' ? bookends(at) : tree(at)
}
