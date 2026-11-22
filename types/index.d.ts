export type Herdr = { workspace: string; tab?: string; agent?: string }

export type Os = 'mac' | 'ubuntu' | 'linux' | 'other'

export type Where = { computer: string; os: Os; workspace: string; project: string; herdr: Herdr | null }

export type Limit = { kind: string; percentUsed: number; resetsAt: string | null }

/** `threshold` is the token count auto-compaction runs at, null when it is off; `now` is when the figures were read. */
export type Stats = {
  used: number | null
  window: number
  threshold: number | null
  limits: Limit[]
  usd: number | null
  startedAt: number
  now: number
  compactions: number
}

declare module 'claude-code' {
  interface PluginState {
    'session-band': { where: Where | null; stats: Stats | null }
  }
}
