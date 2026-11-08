export type Herdr = { workspace: string; tab?: string; agent?: string }

export type Os = 'mac' | 'ubuntu' | 'linux' | 'other'

export type Where = { computer: string; os: Os; workspace: string; project: string; herdr: Herdr | null }

declare module 'claude-code' {
  interface PluginState {
    'session-band': { where: Where | null }
  }
}
