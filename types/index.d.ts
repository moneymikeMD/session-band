export type Herdr = { workspace: string; tab?: string; agent?: string }

export type Where = { computer: string; workspace: string; project: string; herdr: Herdr | null }

declare module 'claude-code' {
  interface PluginState {
    'session-band': { where: Where | null }
  }
}
