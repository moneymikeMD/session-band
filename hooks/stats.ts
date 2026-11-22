import type { Limit, Stats } from '../types'
import type { Run } from './style'

const DIM = '#7b8196'
const LEVEL = { ok: '#22b3a1', warn: '#d9a23b', crit: '#ec7356' } as const
const CELLS = 10
const LABEL: Record<string, string> = { five_hour: '5h', seven_day: '7d', spend_limit: 'spend' }

/** 52000 reads `52k`, 1200000 reads `1.2M`. */
export function tokens(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : `${Math.round(n / 1000)}k`
}

/** A length of time in its two largest units: `12m`, `1h12m`, `3d4h`. */
export function span(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60_000))
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  if (d > 0) return `${d}d${h}h`
  return h > 0 ? `${h}h${m % 60}m` : `${m}m`
}

/** The auto-compact threshold, capped at `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` percent of the window, which the harness leaves out of the figure it reports. */
export function thresholdOf(reported: number | null, window: number, pct: string | undefined): number | null {
  const p = Number(pct)
  if (reported === null || !(p >= 1 && p <= 100)) return reported
  return Math.min(reported, Math.round((window * p) / 100))
}

/** The ceiling the gauge fills toward: the auto-compact threshold, or the model's window when auto-compaction is off. */
export function ceilingOf(s: Stats): number {
  return s.threshold ?? s.window
}

function gauge(s: Stats): Run {
  const ceiling = ceilingOf(s)
  const frac = s.used === null || ceiling <= 0 ? 0 : s.used / ceiling
  const filled = Math.min(CELLS, Math.max(0, Math.round(frac * CELLS)))
  const color = frac < 0.6 ? LEVEL.ok : frac < 0.85 ? LEVEL.warn : LEVEL.crit
  const used = s.used === null ? '–' : tokens(s.used)
  return { text: `ctx ${used}/${tokens(ceiling)} ${'▰'.repeat(filled)}${'▱'.repeat(CELLS - filled)}`, color }
}

function limit(l: Limit, now: number): Run {
  const reset = l.resetsAt === null ? NaN : Date.parse(l.resetsAt)
  const left = Number.isNaN(reset) ? '' : ` ↻${span(reset - now)}`
  const color = l.percentUsed >= 95 ? LEVEL.crit : l.percentUsed >= 80 ? LEVEL.warn : undefined
  return { text: `${LABEL[l.kind] ?? l.kind} ${Math.round(l.percentUsed)}%${left}`, color }
}

/** The stats row: context gauge, rate limits, cost, session age and the compactions so far. */
export function statsRow(s: Stats): Run[] {
  const parts: Run[] = [
    gauge(s),
    ...s.limits.map(l => limit(l, s.now)),
    ...(s.usd === null ? [] : [{ text: `$${s.usd.toFixed(2)}` }]),
    { text: span(s.now - s.startedAt) },
    ...(s.compactions === 0 ? [] : [{ text: `⟳ ${s.compactions}`, color: DIM }]),
  ]
  return parts.flatMap((p, i) => (i === 0 ? [p] : [{ text: '  ·  ', color: DIM }, p]))
}
